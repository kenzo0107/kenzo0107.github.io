---
title: Allowing CloudFront and Other S3 Bucket Access Logs to Be Stored via the Log Bucket's ACL
tags:
  - AWS
date: 2021-11-04
category: AWS
lang: en
translation_id: cloudfront-logdelivery
permalink: en/2021/11/04/cloudfront-logdelivery/
cover: https://i.imgur.com/SK23gOy.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

In Terraform, you configure it as follows.

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

## The CloudFront Log Delivery Canonical User ID Can Now Be Retrieved via a Data Source!

While following the issue below, I found it had been addressed!
https://github.com/hashicorp/terraform-provider-aws/issues/12512

Until now there was no data source, so I had been specifying the string directly. This is very welcome!

- Data Source: aws_cloudfront_log_delivery_canonical_user_id
  https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/cloudfront_log_delivery_canonical_user_id

## Summary

The configuration itself is quick to finish once you know it, but if you don't, there's a pitfall where you only notice when you actually try to look at the logs.

If you manage multiple AWS accounts with Terraform, turning this into a module and rolling it out is also effective for preventing configuration omissions.

That's all.
I hope this is helpful.
