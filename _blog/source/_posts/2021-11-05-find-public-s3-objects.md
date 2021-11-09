---
title: 公開された S3 Objcet を探せ！
tags:
- AWS
date: 2021-11-05
---

* AWS075: S3 Access block should restrict public bucket to limit access
  https://tfsec.dev/docs/aws/s3/no-public-buckets/


[tfsec](https://tfsec.dev/) でパブリックアクセスが制限されていない場合に指摘される様になりました。


terraform では以下の様に [aws_s3_bucket_public_access_block](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_public_access_block) リソースを利用することで対応できます。

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

ですが、 tfsec で指摘されたので直ちに対応して良いか、というと勿論そうではありません。
まず、現状のユーザ影響があるかどうかを調査する必要があります。

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## スクリプトで調査する

2つ以上 permission がついている S3 Object を探索するスクリプトです。

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

通常、所有者のみアクセス権限がありますが、 public-read が付与されていると2つ以上になるという算段です。

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

コンソール上でわかりやすく、以下の様な設定になっていると検知できます。
![](https://i.imgur.com/IDCeTqO.png)

但し、 public-read だけ付与されていると1つだけになってしまうので、このスクリプトでは検知できません。
![](https://i.imgur.com/Yy8FIw6.png)

## CloudTrail を Athena で検索する

CloudTrail を有効化し、 Athena 連携している場合、以下の様に検索が可能です。

```
SELECT *
FROM cloudtrail_logs
WHERE eventName = 'PutObject'
	AND eventsource = 's3.amazonaws.com'
	AND (requestParameters LIKE '%x-amz-acl%public-read%' OR requestParameters LIKE '%x-amz-acl%authenticated-read%')
```

結果
```
eventTime: 2021-11-01T07:18:36Z
requestParameters: {... ,"bucketName":"tanaka.no.bucket", ..., "x-amz-acl":"public-read", ... ,"key":"t.txt", ...}
```

※ 上記は、一旦 S3 上にファイルをアップし、その後、公開設定した場合でも実行結果に含まれることを確認しています。

public-read のみならず、 authenticated-read も検索できます。

そして何より、データ量にもよりますが、スクリプトよりはるかに速いです。
日付で3ヶ月以内くらいに絞ってみるとより早くなるのでそこは調整してください。


これでパブリックアクセスを許可する S3 Bucket が特定でき、安心して tfsec のパブリックアクセスのブロックが設定できる様になりました。


以上
参考になれば幸いです。
