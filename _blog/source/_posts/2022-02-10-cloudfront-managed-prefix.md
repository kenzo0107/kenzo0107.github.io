---
title: terraform で CloudFront マネージドプリフィックスリストを利用したアクセス制限
date: 2022-02-10
category: AWS
thumbnail: https://i.imgur.com/raMMbxt.png
---

https://aws.amazon.com/jp/about-aws/whats-new/2022/02/amazon-cloudfront-managed-prefix-list/

VPC が CloudFront のマネージドプリフィックスリストをサポートするようになりました。
これにより CloudFront からのアクセスをセキュリティグループルールベースでアクセス制限できるようになります。

## 早速 terraform で実装してみた

以下の構成を想定しています。

```
CloudFront-->ALB
```

ALB にアタッチするセキュリティグループで CloudFront のマネージドプリフィックスリスト ID のみ許可するようにします。

```
# CloudFront のマネージドプリフィックスリスト取得
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "lb_app" {
  ...
}

resource "aws_security_group_rule" "lb_app_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  prefix_list_ids   = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  security_group_id = aws_security_group.lb_app.id
}

resource "aws_lb" "app" {
  security_groups = [aws_security_group.lb_app.id]
  ...
}
```

セキュリティグループルールベースで CloudFront からのアクセスを許可できました。

## CloudFront のプレフィックスリストの取得方法について

プレフィックスリストの取得方法でどんな実装が正しいのか試行錯誤しました。

結論から言うと [data "ec2_managed_prefix_list"](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ec2_managed_prefix_list) を採用しました。

全てのリージョンで `com.amazonaws.global.cloudfront.origin-facing` で指定されており、リージョン変更に柔軟な構成にしました。

```
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}
```

以下 `data "aws_prefix_list"` で ID 直指定でも取得できましたが
リージョン毎に値が異なり、リージョン変更した場合に利用できません。

```
data "aws_prefix_list" "cloudfront" {
  prefix_list_id = "pl-58a04531"
}
```

以下、 name 指定の場合、エラーになりました。

```
data "aws_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}
```

エラー内容

```
Error: no matching prefix list found; the prefix list ID or name may be invalid or not exist in the current region
```

参考: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/prefix_list#name

Filter 指定する場合、ステップ数も増えます。

シンプルな実装で済む `data "aws_ec2_managed_prefix_list"` が最適と判断しました。
https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/prefix_list#filter

### よりセキュアに

これは CloudFront のマネージドプリフィックリストでの制御とは話が逸れるところですが、
WAF or ALB のリスナールールでドメイン名で制限しておくとよりセキュアです。

1 つのリポジトリで app, admin と双方のコードを書いていて、
ルーティングに特に制限をかけていない場合、
以下のようにインターネット越しにアクセスできてしまう可能性があります。

```
curl -H "Host: admin.example.com" https://example.com/login
```

上記のような処理を防止すべく、
以下処理では、ALB リスナールールでデフォルト処理がメンテページ表示にし
指定したドメイン名の場合のみバックエンドへルーティングさせています。

```
resource "aws_cloudfront_distribution" "app" {
  aliases = [
    "example.com",
  ]
  ...
}
resource "aws_lb_listener" "app_https" {
  load_balancer_arn = aws_lb.app.arn
  ...

  # メンテナンス画面
  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/html"
      message_body = file("${path.module}/files/503.html")
      status_code  = "503"
    }
  }

  depends_on = [aws_lb_target_group.app]
}

resource "aws_lb_listener_rule" "app_listener_https_host" {
  listener_arn = aws_lb_listener.app_https.arn
  ...

  condition {
    host_header {
      # NOTE: ドメイン名で制御する
      values = [
        "example.com",
      ]
    }
  }
}
```

CloudFront 経由でないとアクセスできないようにする、に加えて、
さらにドメイン名によるアクセス制限を加えることでより
意図しない CloudFront からのルーティングを回避できます。

## 総評

既存では CloudFront のカスタムヘッダーに値を入れて
ALB の WAF でその値を照合するような仕組みを採用していましたが、
よりシンプルな実装にできました。

実質、セキュリティグループルールベースでの許可となるので
ALB → CloudFront + ALB への構成への移行もしやすくなったと感じました。

これは有難いアップデートです ♪

以上
参考になれば幸いです。
