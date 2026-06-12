---
title: ACL Behavior of S3 Objects After Enabling and Then Disabling S3 Block Public Access
date: 2023-04-05
lang: en
translation_id: s3-bucket-public-access-block
permalink: en/2023/04/05/s3-bucket-public-access-block/
category: AWS
cover: https://i.imgur.com/cEbTyJe.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## Overview

For an S3 bucket that has Block Public Access disabled, I will verify whether
enabling Block Public Access and then disabling it again has any effect on
the ACLs of the objects.

<!-- more -->

## Conclusion First

I was able to confirm that the behavior matches what is described in the official documentation.

For an S3 object with ACL = public-read, enabling Block Public Access makes public access
unavailable, and then disabling Block Public Access makes public access available again.

In the AWS console, the Everyone Read permission disappears when Block Public Access is enabled,
which is momentarily alarming, but I confirmed that it returns to its original state when
Block Public Access is disabled.

## Official Documentation Reference

https://docs.aws.amazon.com/ja_jp/AmazonS3/latest/userguide/access-control-block-public-access.html

> Block Public Access settings don't change existing policies or ACLs. Therefore, removing a Block Public Access setting causes a bucket or object with a public policy or ACL to again become publicly accessible.

In other words, enabling Block Public Access and then disabling it has no effect on the object's ACL.

## What to Try

1. Create an S3 bucket with Block Public Access disabled
2. Upload a file with acl = public-read to S3
3. Confirm that the file can be accessed via its S3 object URL
4. Enable Block Public Access on S3
5. Confirm that the file cannot be accessed via its S3 object URL
6. Disable Block Public Access on S3
7. Confirm that the file can be accessed via its S3 object URL

## Trying It Out

<details><summary>Create a test S3 bucket with Terraform</summary>

```terraform
resource "aws_s3_bucket" "test" {
  bucket = "test-by-kenzo-tanaka"
}

resource "aws_s3_bucket_acl" "test" {
  bucket = aws_s3_bucket.test.id
  acl    = "private"
}

resource "aws_s3_bucket_versioning" "test" {
  bucket = aws_s3_bucket.test.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "test" {
  bucket = aws_s3_bucket.test.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3/${aws_s3_bucket.test.id}/"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "test" {
  bucket = aws_s3_bucket.test.bucket
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block Public Access disabled
resource "aws_s3_bucket_public_access_block" "test" {
  bucket = aws_s3_bucket.test.id

  ignore_public_acls      = false
  restrict_public_buckets = false
  block_public_acls       = false
  block_public_policy     = false
}
```

</details>

### Upload a File with acl = public-read

```bash
$ echo "public read" > public_read.txt

// Upload public_read.txt to S3 with acl=public-read (public)
$ aws s3 cp public_read.txt s3://test-by-kenzo-tanaka/ --acl public-read

$ echo "private" > private.txt

// Upload private.txt to S3 with acl=private (not public)
$ aws s3 cp private.txt s3://test-by-kenzo-tanaka/ --acl private
```

With acl = public-read, I can confirm that the object is in a public state accessible by anyone.

![](https://i.imgur.com/6jdIsrE.png)

![](https://i.imgur.com/eJnnwA4.png)

### Verify Access via the S3 Object URL

```bash
// Since acl = public-read, the S3 object URL is accessible
$ curl -I https://test-by-kenzo-tanaka.s3.ap-northeast-1.amazonaws.com/public_read.txt

HTTP/1.1 200 OK
...

// Since acl = private, the S3 object URL is not accessible
$ curl -I https://test-by-kenzo-tanaka.s3.ap-northeast-1.amazonaws.com/private.txt

HTTP/1.1 403 Forbidden
...
```

### Enable S3 Block Public Access

```terraform
resource "aws_s3_bucket_public_access_block" "test" {
  bucket = aws_s3_bucket.test.id

  ignore_public_acls      = true
  restrict_public_buckets = true
  block_public_acls       = true
  block_public_policy     = true
}
```

- Confirm that Block Public Access has been enabled
  ![](https://i.imgur.com/Uf1JYsa.png)

- The Everyone Read permission on public_read.txt has disappeared
  ![](https://i.imgur.com/8JtlgXd.png)

- private.txt is unchanged
  ![](https://i.imgur.com/45wN1Yt.png)

I confirmed that attempting to access both public_read.txt and private.txt returns 403 Forbidden.

```bash
$ curl -I https://test-by-kenzo-tanaka.s3.ap-northeast-1.amazonaws.com/public_read.txt

HTTP/1.1 403 Forbidden
...

$ curl -I https://test-by-kenzo-tanaka.s3.ap-northeast-1.amazonaws.com/private.txt

HTTP/1.1 403 Forbidden
...
```

### Disable S3 Block Public Access Again

Disable Block Public Access once more.

```terraform
resource "aws_s3_bucket_public_access_block" "test" {
  bucket = aws_s3_bucket.test.id

  ignore_public_acls      = false
  restrict_public_buckets = false
  block_public_acls       = false
  block_public_policy     = false
}
```

- Confirm that Block Public Access has been disabled
  ![](https://i.imgur.com/cEbTyJe.png)

- Confirm that the Everyone Read permission on public_read.txt has been restored
  ![](https://i.imgur.com/k5qPlMm.png)

- private.txt is unchanged
  ![](https://i.imgur.com/sCQv7F9.png)

I was able to confirm that public_read.txt becomes publicly accessible again,
while private.txt remains not publicly accessible.

```bash
$ curl -I https://test-by-kenzo-tanaka.s3.ap-northeast-1.amazonaws.com/public_read.txt

HTTP/1.1 200 OK
...

$ curl -I https://test-by-kenzo-tanaka.s3.ap-northeast-1.amazonaws.com/private.txt

HTTP/1.1 403 Forbidden
...
```

## Summary

As stated in the conclusion, I was able to confirm that the behavior matches the official documentation.

That's all.
I hope this is helpful.
