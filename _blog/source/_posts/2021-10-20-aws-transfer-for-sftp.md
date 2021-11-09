---
title: AWS Transfer for sftp + S3 で IP 制限付き sftp サーバ構築
category: AWS
tags:
- AWS
date: 2021-10-20
thumbnail: https://i.imgur.com/hgb10nC.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## 概要

外部会社とのファイル共有で sftp サーバを構築することとなった。

先方が AWS を利用していれば、 IAM Role を渡して Assume Role で S3 に直接アップロードしていただくことができましたが、
sftp を利用したい強い気持ちを感じ、 sftp サーバを構築することとなりました。

## SFTP 構築方法 比較

1. AWS Transfer for SFTP + S3
    - Pros: 管理コストが低い
    - Cons: 高い :dollar:  [¥25,000/月〜](https://aws.amazon.com/jp/aws-transfer-family/pricing/)
2. EC2 + s3fs + S3
    - Pros: 安い ¥6,836/月〜
    - Cons: 管理コストが高い
        - EC2 定期メンテ
        - AMI・ミドルウェア更新

リソースの利用コストこそ高いが、管理コストの低さから AWS Transfer for SFTP を採用することとしました。

エンジニアの採用コストより低い！

## アーキテクチャ

公開鍵認証で構築します。
極力管理コストを下げ、セキュアにすべく公開鍵認証としました。

※ パスワード認証は Lambda で対応するっぽい

![](https://i.imgur.com/hgb10nC.png)

1. Route53 で AWS Transfer for SFTP エンドポイントの名前解決
2. VPC エンドポイント経由でアクセスする
  - セキュリティグループで特定 IP のみ許可する
3. SSH 公開鍵認証で AWS Transfer for SFTP にアクセス
4. ユーザ毎に IAM Role or IAM Policy で権限を制限し、S3 へアクセス


## terraform で対応

構築は terraform で実施しました。

### Transfer for sftp サーバ構築

```
resource "aws_transfer_server" "this" {
  # VPC エンドポイントを指定し、セキュリティグループで IP 制限する
  endpoint_type = "VPC"

  endpoint_details {
    vpc_id                 = aws_vpc.main.id
    subnet_ids             = aws_subnet.transfer[*].id
    address_allocation_ids = aws_eip.transfer[*].id
    security_group_ids     = [aws_security_group.sftp.id]
  }

  # FIPS 準拠でない最新のポリシーを指定
  # 東京リージョンは FIPS 準拠対応していない
  security_policy_name = "TransferSecurityPolicy-2020-06"

  # NOTE: ロギング用の IAM Role を指定
  logging_role = aws_iam_role.transfer_logging_access.arn

  tags = {
    # NOTE: サーバエンドポイントを Route53 レコードと紐づけるには以下のタグ指定が必要です。
    # "aws:transfer:customHostname" = local.domain_sftp
    # "aws:transfer:route53HostedZoneId" = "/hostedzone/${aws_route53_zone.main.zone_id}"
    #
    # ですが、`aws:` で始まるタグキーは指定できず、 terraform では現状対応していない為、
    # コンソール上で Route53 DNS エイリアスの設定をします。
    # issue: https://github.com/hashicorp/terraform-provider-aws/issues/18077
  }
}
```

`endpoint_type = "VPC"` を指定し `endpoint_details` で以下設定することで VPC エンドポイント経由でアクセスする様、設定できます。

```
  endpoint_type = "VPC"

  endpoint_details {
    vpc_id                 = aws_vpc.main.id
    subnet_ids             = aws_subnet.transfer[*].id
    address_allocation_ids = aws_eip.transfer[*].id
    security_group_ids     = [aws_security_group.sftp.id]
  }
```

`logging_role = aws_iam_role.transfer_logging_access.arn` で CloudWatch Logs へログ出力する為の IAM Role を指定する必要があります。




注意点として、現時点でサーバエンドポイントの Route53 DNS エイリアスの指定を terraform-provider-aws がサポートしていません。

以下 Issue があります。
[aws_transfer_server custom hostname via alternate mechanism](https://github.com/hashicorp/terraform-provider-aws/issues/18077)

コード中に provider がサポートしていない旨を明記し、 AWS Console 上で設定しました。


### Transfer for sftp アクセス可能ユーザ作成

```
locals {
  users_map = {
    # ユーザ名 = SSH 公開鍵
    # 公開鍵なので、ベタ書きして問題ない
    "kenzo.tanaka" = "ssh-rsa AAAAB3Nxxxxxxx="
  }
}

resource "aws_transfer_user" "this" {
  for_each = local.users_map

  server_id = aws_transfer_server.this.id
  user_name = each.key

  # 権限管理
  role = aws_iam_role.this.arn

  # sftp 接続時のデフォルトのアクセス先を S3 のルートディレクトリとする
  # S3 をコンソールや `aws-cli` でオブジェクトのリストを見る際に見やすい為です。
  home_directory_type = "PATH"
  home_directory      = "/${aws_s3_bucket.this.id}"
}

resource "aws_transfer_ssh_key" "this" {
  for_each = local.users_map

  server_id = aws_transfer_server.this.id
  user_name = aws_transfer_user.this[each.key].user_name
  body      = each.value # 公開鍵情報
}
```

ユーザ名と公開鍵を Transfer ユーザとしてサーバに登録しアクセス許可されます。

S3 への操作権限管理は IAM Role で実施しています。

```
  # 権限管理
  role = aws_iam_role.this.arn
```

ホームディレクトリはどのユーザでも共通してルートパスにしています。
個別にホームディレクトリを設定することも可能です。

```
  home_directory_type = "PATH"
  home_directory      = "/${aws_s3_bucket.this.id}"
```


## 操作ログの追跡

CloudWatch Logs  `/aws/transfer/SFTPサーバーID` に操作ログが記録されます。

get, put, rm 等ログが記録されることを確認しています。

## アクセスに必要な情報の整理

接続希望者が提出する情報

* 接続元 IP
    * セキュリティグループで許可する必要がある
* ユーザ名
    * ユーザー名は 3～100 文字にする必要があります。有効な文字は a～z、A～Z、0～9、アンダースコア、ハイフン、アットマーク、ピリオドです。ハイフン、アットマーク、ピリオドで始めることはできません。
* SSH 公開鍵

サーバ管理者が提出する情報

* サーバホスト名

## 総評

やや高い気がしないでもないですが、マネージドサービスとして AWS にお任せできる部分が多く、管理コストの低い sftp サーバの構築ができました。

アップロードされたファイルは S3 Bucket へ蓄積されるのでオブジェクトサイズが肥大化→コスト増を防止する為にも Glacier へ移行する等、ライフサイクルルールの設定が必要と思います。

参考になれば幸いです。
