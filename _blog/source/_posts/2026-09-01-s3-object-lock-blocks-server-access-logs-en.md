---
title: 'S3 Server Access Logs Can''t Be Delivered to a Bucket with Object Lock Retention'
date: 2026-09-01
lang: en
translation_id: s3-object-lock-blocks-server-access-logs
permalink: en/2026/09/01/s3-object-lock-blocks-server-access-logs/
cover: /img/cover/2026-09-01-s3-object-lock-blocks-server-access-logs.svg
categories:
- [AWS]
- [Terraform]
tags:
- AWS
- S3
- Object Lock
- Terraform
- Logging
- Security
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

If your log storage bucket has an Object Lock default retention period configured (for tamper protection), **S3 server access logs can't be delivered to it**.

The nasty part is that nothing stops you from configuring it. `terraform apply` succeeds, the console lets you pick the bucket as a destination, and no error or notification is raised. The logs simply never arrive. This is easy to walk into when rebuilding log buckets with tamper protection, so I'm writing it down.

Note: this post reflects the state as of **September 1, 2026**. Version-dependent statements assume Terraform 1.15.8 and `hashicorp/aws` **6.62.0** (released August 26, 2026, the latest at the time of writing). The constraint itself is an S3-side behavior and doesn't depend on the provider version, but I confirmed in [bucket_logging.go](https://github.com/hashicorp/terraform-provider-aws/blob/v6.62.0/internal/service/s3/bucket_logging.go) that even in 6.62.0, `aws_s3_bucket_logging` performs no validation of the destination's Object Lock configuration — it simply calls [PutBucketLogging](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketLogging.html). **Don't expect the provider to catch this for you.**

<!-- more -->

## Conclusion

| Item | Detail |
| --- | --- |
| Constraint | A bucket with Object Lock enabled (with a default retention configuration) can't be a destination for S3 server access logs |
| Behavior | No error, no notification — the logs just don't arrive |
| Cause | `PutObject` for an object that gets a retention period requires `Content-MD5` or a checksum header (my inference) |
| Scope | S3 server access logs only. ELB / CloudFront / VPC Flow Logs are unaffected |
| Workaround | Split off a dedicated bucket without Object Lock, or deliver to CloudWatch Logs |

## What the docs say

It's stated in the Important callout of [Enabling Amazon S3 server access logging](https://docs.aws.amazon.com/AmazonS3/latest/userguide/enable-server-access-logging.html).

> S3 buckets that have S3 Object Lock enabled can't be used as destination buckets for server access logs. Your destination bucket must not have a default retention period configuration.

The same constraint appears in [Object Lock considerations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-managing.html).

> S3 buckets with Object Lock can't be used as destination buckets for server access logs.

Note that **the two sentences read as slightly different conditions**. The first half says "a bucket with Object Lock enabled is not allowed"; the second says "the destination must not have a default retention period configuration". Whether a bucket with Object Lock enabled but no default retention is usable is something I couldn't determine from the official docs. I erred on the safe side: **no Object Lock at all on the server access log destination**.

## Why delivery fails

Uploading an object that will receive a retention period requires an integrity header, as documented in [Object Lock considerations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-managing.html).

> If you use the PutObject API you must specify the `Content-MD5` header, the `x-amz-sdk-checksum-algorithm` header, or both to configure the Object Lock retention period.

With a default retention configuration, this requirement applies to every `PutObject` against the bucket. I couldn't confirm from public information whether the log delivery service (`logging.s3.amazonaws.com`) sends these headers, so I can't state it as fact — but **not sending them, and therefore failing the PUT**, is the straightforward explanation.

## The scary part is that the failure is invisible

S3 server access log delivery is explicitly documented as best-effort.

> The completeness and timeliness of server logging is not guaranteed. The log record for a particular request might be delivered long after the request was actually processed, or *it might not be delivered at all*.
>
> — [Logging requests with server access logging](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ServerLogs.html)

In other words, "no logs arrived" is within spec, and a delivery failure never surfaces as an exception. Since nothing rejects the configuration at any step, **you find out about the gap when you go looking for logs during an audit**. Even with the LogDelivery group granted `WRITE` / `READ_ACP` on the log bucket ACL — so permissions *look* correct — the retention configuration means nothing is received. It's enabled in appearance only.

The reliable check is whether objects are actually accumulating under the destination prefix. Delivery can take a few hours, so don't panic if it's empty right after you configure it.

```console
$ aws s3 ls s3://prd.example.logs/s3/prd.example.images/ --recursive | tail
```

## Fix: split the buckets

I wanted to keep tamper protection, so I split things into two buckets: a log storage bucket with Object Lock, and a dedicated bucket without Object Lock for S3 server access logs. ELB / CloudFront / VPC Flow Logs are delivered to the Object Lock bucket without trouble, so only S3 server access logs need to be separated out.

```hcl
# Log storage: tamper protection via Object Lock default retention
resource "aws_s3_bucket" "logs" {
  bucket              = "prd.example.logs"
  object_lock_enabled = true
}

resource "aws_s3_bucket_object_lock_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    default_retention {
      mode = "GOVERNANCE"
      days = 400
    }
  }
}

# For S3 server access logs: no Object Lock
resource "aws_s3_bucket" "s3_access_logs" {
  bucket = "prd.example.s3-access-logs"
}

resource "aws_s3_bucket_logging" "images" {
  bucket = aws_s3_bucket.images.id

  # NOTE: server access logs go to the dedicated bucket without Object Lock
  target_bucket = aws_s3_bucket.s3_access_logs.id
  target_prefix = "s3/${aws_s3_bucket.images.id}/"
}
```

Grant delivery permission with a bucket policy rather than an ACL. New buckets have ACLs disabled (`BucketOwnerEnforced`) by default, which is also the AWS recommendation, and in that case an ACL can't grant the access.

```hcl
data "aws_iam_policy_document" "s3_access_logs" {
  statement {
    sid    = "S3ServerAccessLogsPolicy"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["logging.s3.amazonaws.com"]
    }

    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.s3_access_logs.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}
```

### Other destination bucket constraints

The other constraints listed in the same doc need to be satisfied too.

- Must be in the **same Region and same AWS account** as the source bucket
- Must use **SSE-S3, not SSE-KMS**. With SSE-KMS, logs may be delivered encrypted with a key you can't access
- Must not have **Requester Pays** enabled
- Don't enable server access logging on the destination bucket itself (pointing the destination at the source creates an infinite loop of logs)

### If you need to remove Object Lock from an existing bucket

`object_lock_enabled` **can't be disabled after the bucket is created**. You can remove just the default retention (`aws_s3_bucket_object_lock_configuration`), but disabling Object Lock itself requires recreating the bucket. If you're retrofitting tamper protection onto existing log buckets, it's safer to go with the two-bucket layout from the start.

## Alternative: deliver to CloudWatch Logs

S3 server access logs can also be delivered to **CloudWatch Logs** instead of an S3 bucket ([Delivering server access logs to CloudWatch Logs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/sal-cw-enabling.html)). The Object Lock constraint only applies when the destination is an S3 bucket, so this route avoids the conflict entirely.

- Query directly with CloudWatch Logs Insights
- Cross-account / cross-Region aggregation
- KMS encryption (S3 delivery is SSE-S3 only)

The tradeoff is CloudWatch vended logs charges. If your logs are already consolidated in S3, splitting the buckets is the more natural fit, and that's what I went with.

## Summary

- Server access logs can't be delivered to a bucket with an Object Lock default retention configuration
- The failure produces no error and no notification — logs go missing silently. ACLs and bucket policies can look perfectly correct while nothing is received
- Only S3 server access logs are affected; ELB / CloudFront / VPC Flow Logs are delivered to the Object Lock bucket fine
- To keep tamper protection, split into an Object Lock log bucket and a dedicated S3 access log bucket without Object Lock
- `object_lock_enabled` can't be turned off later, so make the split at bucket design time

I hope this helps.

## References

- [Enabling Amazon S3 server access logging](https://docs.aws.amazon.com/AmazonS3/latest/userguide/enable-server-access-logging.html)
- [Logging requests with server access logging](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ServerLogs.html)
- [Object Lock considerations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-managing.html)
- [Delivering server access logs to CloudWatch Logs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/sal-cw-enabling.html)
- [Controlling ownership of objects and disabling ACLs for your bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/about-object-ownership.html)
