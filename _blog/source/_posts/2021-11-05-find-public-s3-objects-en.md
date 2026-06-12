---
title: Hunting for Publicly Accessible S3 Objects!
tags:
  - AWS
date: 2021-11-05
lang: en
translation_id: find-public-s3-objects
permalink: en/2021/11/05/find-public-s3-objects/
cover: https://i.imgur.com/ZskUBGT.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

- AWS075: S3 Access block should restrict public bucket to limit access
  https://tfsec.dev/docs/aws/s3/no-public-buckets/

[tfsec](https://tfsec.dev/) now flags cases where public access is not restricted.

In Terraform, you can address this by using the [aws_s3_bucket_public_access_block](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_public_access_block) resource as shown below.

```
resource "aws_s3_bucket" "this" {
  ...
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  ignore_public_acls      = true
  restrict_public_buckets = true
  block_public_acls       = true
  block_public_policy     = true
}
```

That said, just because tfsec flags it doesn't mean you should fix it right away.
First, you need to investigate whether there is any current impact on users.

## Investigating with a Script

Here is a script that searches for S3 objects that have two or more permissions attached.

```shell
#!/bin/bash

function acl() {
  if $(aws s3api get-object-acl --bucket $1 --key "$2" | jq '.Grants | length != 1'); then
    echo $2
  fi
}

export -f acl
aws s3 ls s3://$BUCKET --recursive | awk '{print $4}' | xargs -P4 -I{} bash -c "acl ${BUCKET} {}"
```

Normally only the owner has access permissions, so the idea is that if public-read is granted, the count becomes two or more.

```console
$ aws s3api get-object-acl --bucket tanaka.no.bucket --key t.txt | jq '.Grants'

// result
[
  {
    "Grantee": {
      "DisplayName": "tanaka+administer",
      "ID": "xxxxxxxxxxxxxxxxxxxxxxx",
      "Type": "CanonicalUser"
    },
    "Permission": "FULL_CONTROL"
  },
  {
    "Grantee": {
      "Type": "Group",
      "URI": "http://acs.amazonaws.com/groups/global/AllUsers"
    },
    "Permission": "READ"
  }
]
```

In the console, you can easily detect it when it is configured like the following.
![](https://i.imgur.com/IDCeTqO.png)

However, if only public-read is granted, the count stays at just one, so this script cannot detect it.
![](https://i.imgur.com/Yy8FIw6.png)

## Searching CloudTrail with Athena

If you have CloudTrail enabled and integrated with Athena, you can search like this.

```
SELECT *
FROM cloudtrail_logs
WHERE eventName = 'PutObject'
	AND eventsource = 's3.amazonaws.com'
	AND (requestParameters LIKE '%x-amz-acl%public-read%' OR requestParameters LIKE '%x-amz-acl%authenticated-read%')
```

Result

```
eventTime: 2021-11-01T07:18:36Z
requestParameters: {... ,"bucketName":"tanaka.no.bucket", ..., "x-amz-acl":"public-read", ... ,"key":"t.txt", ...}
```

* Note: I have confirmed that the above also appears in the results even when you first upload a file to S3 and then make it public afterward.

You can search not only for public-read but also for authenticated-read.

And above all, although it depends on the volume of data, this is far faster than the script.
It gets even faster if you narrow the date range to roughly within the last three months, so adjust that to your needs.

With this, you can identify the S3 buckets that allow public access, and you can now confidently set up tfsec's public access block.

That's all.
I hope this is helpful.
