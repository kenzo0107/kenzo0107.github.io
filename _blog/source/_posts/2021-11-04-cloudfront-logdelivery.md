---
title: ログ保存用 S3 Bucket の ACL で CloudFront や他 S3 Bucket のアクセスログを保存する
tags:
- AWS
date: 2021-11-04
---

terraform 的には以下の様に設定します。

```
resource "aws_s3_bucket" "logs" {
  # NOTE: S3 logging を有効化する為、 S3 group Log Delivery に権限を付与する
  # https://docs.aws.amazon.com/AmazonS3/latest/userguide/enable-server-access-logging.html#grant-log-delivery-permissions-general
  grant {
    permissions = [
      "READ_ACP",
      "WRITE",
    ]
    type = "Group"
    uri  = "http://acs.amazonaws.com/groups/s3/LogDelivery"
  }

  # NOTE: CloudFront からログ保存できる様、 CloudFront Log Delivery Canonical User に権限を付与する
  grant {
    id          = data.aws_cloudfront_log_delivery_canonical_user_id.current.id
    permissions = ["FULL_CONTROL"]
    type        = "CanonicalUser"
  }

  # S3 Bucket 所有者に権限付与する
  grant {
    id          = data.aws_canonical_user_id.current.id
    permissions = ["FULL_CONTROL"]
    type        = "CanonicalUser"
  }
```


## CloudFront Log Delivery Canonical User ID が data ソースで取れる様になった！

以下 issue を追っていたところ、対応されていました！
https://github.com/hashicorp/terraform-provider-aws/issues/12512

これまで data ソースがなかった為、直接、文字列指定していたので、有り難い！

* Data Source: aws_cloudfront_log_delivery_canonical_user_id
  https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/cloudfront_log_delivery_canonical_user_id

## まとめ

設定自体は知っていればさくっと終わりますが、知らないと、いざログを見ようとして気付くという落とし穴があります。
複数 AWS アカウントを terraform で管理している場合は、 module 化して展開するのも設定漏れを防ぐ為に有効です。

以上
参考になれば幸いです。
