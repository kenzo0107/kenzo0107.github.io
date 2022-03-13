---
title: AWS ALB/CloudFront でのメンテナンス切り替え方法
date: 2022-03-13
category: AWS
thumbnail: https://i.imgur.com/IwHAByw.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

ALB, CloudFront がインターフェースにある場合のメンテナンス切り替え方法をまとめました。

<!-- more -->

## ALB の場合

```
resource "aws_lb" "app" {
  ...
}

resource "aws_lb_target_group" "app" {
  # CodeDeploy で ECS Service をデプロイする際に blue/green を用意しています。
  for_each = toset(["blue", "green"])
  ...
}

resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.app.arn
  ...

  # デフォルトアクションは 404 エラー
  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      status_code  = "404"
    }
  }
}

# NOTE: メンテナンスモード時は社内 IP のみルーティングする
resource "aws_alb_listener_rule" "app_routing_in_maintenance" {
  count = var.maintenance_mode ? 1 : 0

  listener_arn = aws_alb_listener.app.arn
  priority     = 10

  action {
    # ECS Service に紐づけている Target Group ARN を指定する
    target_group_arn = element(aws_ecs_service.app.load_balancer[*].target_group_arn, 0)
    type             = "forward"
  }

  condition {
    # NOTE: ドメイン名で制御する
    host_header {
      values = [
        "example.com",
      ]
    }
  }

  # 社内 IP のみメンテ時でもアクセスできるようにしておく
  condition {
    source_ip {
      values = office_ips
    }
  }

  # NOTE: CodeDeployによるBlue/Green Deploymentで変更される箇所を無視
  lifecycle {
    ignore_changes = [
      action,
    ]
  }
}

# NOTE: メンテナンスモード時は503の固定レスポンスを返す。
resource "aws_alb_listener_rule" "app_listener_https_maintenance" {
  count = var.maintenance_mode ? 1 : 0

  listener_arn = aws_alb_listener.app.arn
  priority     = 20

  action {
    type = "fixed-response"

    fixed_response {
      status_code  = "503"
      content_type = "application/json"
      message_body = jsonencode(
        {
          code = "service_unavailable"
          hint = "現在メンテナンス中です。"
        }
      )
    }
  }

  condition {
    # NOTE: ドメイン名で制御する
    host_header {
      values = [
        "example.com",
      ]
    }
  }
}

resource "aws_lb_listener_rule" "app_listener_https_host" {
  listener_arn = aws_lb_listener.app_https.arn
  priority     = 100

  action {
    target_group_arn = aws_lb_target_group.app["blue"].arn
    type             = "forward"
  }

  condition {
    host_header {
      # NOTE: ドメイン名で制御する
      values = [
        "example.com",
      ]
    }
  }

  # NOTE: CodeDeployによるBlue/Green Deploymentで変更される箇所を無視
  lifecycle {
    ignore_changes = [
      action,
    ]
  }
}
```

- メンテモード有効時に社内 IP のみ、サーバへ接続できるようにし、その他リクエストを 503 で返します。
- メンテ無効時には上記ルールは削除されます。
- メンテ時のレスポンスを application/json で返しているのはネイティブアプリケーションとの通信を想定しています。 text/html 等選択可能です。

参考: https://docs.aws.amazon.com/ja_jp/elasticloadbalancing/latest/application/load-balancer-limits.html

### var.maintenance_mode をメンテモード切り替えに利用している理由

ALB リソースを管理する terraform 外で maintenace_mode を管理すると
メンテ切り替えとリソースの更新を別のライフサイクルで管理できるメリットがある為です。

例えば、 以下のような利用想定をしています。

1. Terraform Cloud 上で mainteance_mode = true にし、 `terraform apply` を実行しメンテナンスモードにする
2. インフラの変更を terraform で実施する

### ALB のデフォルトアクションを 404 にしている理由

メンテモードの話と逸れますが、
指定ドメイン以外のリクエストを許可しないようにしたい為です。

IP 直指定や ALB ドメイン名指定のアクセスを許可してるとセキュリティ上も SEO 上もよろしくない認識です。

## CloudFront の場合

```
resource "aws_wafv2_web_acl" "cloudfront_app" {
  ...
  scope = "CLOUDFRONT"

  custom_response_body {
    content = jsonencode(
      {
        code = "service_unavailable"
        hint = "現在システムのメンテナンス中です。"
      }
    )
    content_type = "APPLICATION_JSON"
    key          = "maintenance"
  }

  default_action {
    allow {}
  }

  # アクセス許可 IP にマッチしない場合 block する
  dynamic "rule" {
    for_each = var.maintenance_mode ? ["1"] : []
    content {
      ...
      priority = 10

      # ブロック時にメンテナンス時のレスポンスを返す
      action {
        block {
          custom_response {
            custom_response_body_key = "maintenance"
            response_code            = 503
          }
        }
      }

      statement {
        not_statement {
          statement {
            ip_set_reference_statement {
              arn = aws_wafv2_ip_set.allow_ips.arn
            }
          }
        }
      }
      ...
    }
  }

  ...
}

resource "aws_cloudfront_distribution" "app" {
  ...

  web_acl_id = aws_wafv2_web_acl.cloudfront_app.arn

  ...
}
```

- CloudFront にアタッチする WAF でリクエスト許可 IP 以外は 503 メンテ用レスポンスを返します。
- ※ `custom_response_body` は、terraform-provider-aws>=3.67.0 でサポートしています。

## デフォルトアクションを allow {} にしている理由

```
  default_action {
    allow {}
  }

  dynamic "rule" {
    ...
    content {
      statement {
        not_statement {
          statement {
            ip_set_reference_statement {
              arn = aws_wafv2_ip_set.allow_ips.arn
            }
          }
        }
      }
```

メンテモードの話とは逸れますが、
本番環境・ステージング環境でデフォルトのアクションを統一したい為です。

時折見受けられるのは以下の様な設定

- 本番環境 → `default_action { allow {} }`
- ステージング環境 → `default_action { block {} }`

デフォルトアクションが環境毎に異なることで
追加したルールによってリクエストが意図せずにブロックしたり・許可してしまったりする事故が起きる可能性があり、その防止策の一環として
統一しておくほうが良いという判断です。

## まとめ

それぞれのリソースの特性を活かしたメンテ方法が実装できました。

- ALB はリスナールール
- CloudFront は WAF

メンテページをよりリッチにしたい場合は S3 にルーティングしても良いと思います。

以上
参考になれば幸いです。
