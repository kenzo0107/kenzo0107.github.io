---
title: Key Points for Sharing a Specific Folder of an AWS S3 Bucket Externally
category: Terraform
tags:
- AWS
date: 2020-08-13
lang: en
translation_id: external-s3-bucket
permalink: en/2020/08/13/external-s3-bucket/
cover: /img/cover/2020-08-13-external-s3-bucket.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## Overview

This post summarizes the key points to consider when sharing a specific path of an AWS S3 Bucket with an external party.

<!-- more -->

## Proposed Sharing Methods

I came up with the following three options as ways to share the data.

### Option 1. Receive upload permissions to storage owned by Company A

Without adding any access permission settings to our own S3 Bucket `hoge.share`, we upload the objects from our side.

* Pros
  * Secure, since no access permissions need to be added to our S3 Bucket.
  * We can review and screen out objects we do not want to share, at our own discretion.
* Cons
  * There is a work cost involved in uploading the objects.
  * It takes time when there are many objects.
  * If Company A's storage is S3, a Bucket copy can be used, but otherwise there is a work cost of downloading the data once first.

### Option 2. Put it on a ROM and hand it over

Download the data once, put it on a CD-ROM, and hand it over to Company A.

(In the past, there were cases where an audit instructed us to put the data on a ROM and hand it over.)

* Pros
  * Similar to Option 1, but more secure in that it does not go over the internet.
* Cons
  * It takes time when there are many objects.
  * As the sharing frequency increases, the number of shipping procedures increases, incurring that work cost.

### Option 3. Grant Company A access to our S3 Bucket

* Pros
  * The work cost on our side is minimal. We only need to grant the access permissions.
* Cons
  * The work effort on Company A's side becomes higher.

Option 1 seems good and secure.

The one I actually handled in a real task was Option 3.
In that case, it was due to business circumstances where the deadline was extremely short and we could not afford the work cost on our side.

I'll summarize what I considered for Option 3, starting from the conclusion.

## Conclusion: The permissions to grant change depending on whether the objects to be shared are known in advance.

As a use case, suppose we want to share the objects under the specific path `aaa/bbb` of our S3 Bucket `hoge.share` with Company A.

### When the files to be shared with Company A are known in advance

If there is an agreement that the file shared with Company A is always `hoge.share`'s `aaa/bbb/c.gz`, you can restrict access by Company A's IP using a policy like the following.

```json
{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Effect":"Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::hoge.share/aaa/bbb/c.gz"],
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": ["<A社IP>/32"]
        }
      }
    }
  ]
}
```

Company A can download it from their IP with the following command.

```sh
curl https://s3-ap-northeast-1.amazonaws.com/hoge.share/aaa/bbb/c.gz --output c.gz
```

### When the files to be shared with Company A are not specified in advance

* Create an IAM User for Company A (with no permissions)
* In the S3 Bucket policy, restrict by Company A's IP and grant `s3:GetObject` and `s3:ListBucket` to the IAM User for Company A

#### How I arrived at the implementation above

In a case like "share all objects under `aaa/bbb/`", you cannot bulk-download them by specifying a wildcard in `curl` like the following.

```sh
curl https://s3-ap-northeast-1.amazonaws.com/hoge.share/aaa/bbb/*
```

Bulk downloading requires the `s3:ListBucket` permission, and there was no way to support that with IP allowlisting alone.

Example) Command to bulk download
```
aws s3 cp --recusive s3://hoge.share/aaa/bbb/ .
```

When creating the IAM User for Company A, it is given no permissions, and the access permissions for the Company A IAM User are explicitly defined in the S3 Bucket Policy.

```json
{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Effect":"Allow",
      "Principal": {
        "AWS": ["<A 社用 IAM User ARN>"]
      },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::hoge.share/aaa/bbb/*"],
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": ["<A社IP>/32"]
        }
      }
    },
    {
      "Effect":"Allow",
      "Principal": {
        "AWS": ["<A 社用 IAM User ARN>"]
      },
      "Action": ["s3:ListBucket"],
      "Resource": ["arn:aws:s3:::hoge.share"],
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": ["<A社IP>/32"]
        },
        "StringLike": {
          "s3:prefix": ["aaa/bbb/*"]
        }
      }
    }
  ]
}
```

Also, as a point to consider,
you need to separately ensure access logging for `hoge.share`.

I've put together the response, including that consideration, in Terraform.

{% gist kenzo0107/fef3f4127e9ac4a6af3030b1d60689f1 %}

## Summary

Reconsidering the ways to share a specific folder of an S3 Bucket,
I realized there are many different approaches.

There are likely pros and cons depending on the relationship with the party you're sharing with.

If you know of a good method like "Here's a great way to do it!", I'd love to hear from you m(_ _)m
