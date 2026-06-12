---
title: Building an IP-Restricted SFTP Server with AWS Transfer for SFTP + S3
category: AWS
tags:
  - AWS
date: 2021-10-20
lang: en
translation_id: aws-transfer-for-sftp
permalink: en/2021/10/20/aws-transfer-for-sftp/
cover: https://i.imgur.com/hgb10nC.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## Overview

We needed to build an SFTP server for sharing files with an external company.

If the other company had been using AWS, we could have handed them an IAM Role and let them upload directly to S3 via Assume Role. However, they had a strong preference for using SFTP, so we ended up building an SFTP server.

## Comparing SFTP Build Approaches

1. AWS Transfer for SFTP + S3
   - Pros: Low management cost
   - Cons: Expensive :dollar: [from ¥25,000/month](https://aws.amazon.com/jp/aws-transfer-family/pricing/)
2. EC2 + s3fs + S3
   - Pros: Cheap, from ¥6,836/month
   - Cons: High management cost
     - Periodic EC2 maintenance
     - AMI / middleware updates

Although the resource cost is higher, we chose AWS Transfer for SFTP because of its low management cost.

It's cheaper than the cost of hiring an engineer!

## Architecture

We built it with public key authentication.
We chose public key authentication to keep management costs as low as possible while staying secure.

* Note: password authentication apparently has to be handled with Lambda.

![](https://i.imgur.com/hgb10nC.png)

1. Route 53 resolves the name of the AWS Transfer for SFTP endpoint
2. Access goes through a VPC endpoint

- A security group allows only specific IPs

3. Access AWS Transfer for SFTP via SSH public key authentication
4. Restrict permissions per user with an IAM Role or IAM Policy and access S3

## Implementing with Terraform

We did the build with Terraform.

### Building the Transfer for SFTP Server

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

By specifying `endpoint_type = "VPC"` and configuring `endpoint_details` as follows, you can set things up so that access goes through a VPC endpoint.

```
  endpoint_type = "VPC"

  endpoint_details {
    vpc_id                 = aws_vpc.main.id
    subnet_ids             = aws_subnet.transfer[*].id
    address_allocation_ids = aws_eip.transfer[*].id
    security_group_ids     = [aws_security_group.sftp.id]
  }
```

With `logging_role = aws_iam_role.transfer_logging_access.arn`, you need to specify an IAM Role for outputting logs to CloudWatch Logs.

One thing to watch out for: as of this writing, terraform-provider-aws does not support specifying a Route 53 DNS alias for the server endpoint.

There is an issue for this:
[aws_transfer_server custom hostname via alternate mechanism](https://github.com/hashicorp/terraform-provider-aws/issues/18077)

We made a note in the code that the provider doesn't support this, and configured it in the AWS Console instead.

### Creating Users That Can Access Transfer for SFTP

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

Register the username and public key as a Transfer user on the server, and access is granted.

Permission management for operations on S3 is handled with an IAM Role.

```
  # 権限管理
  role = aws_iam_role.this.arn
```

For every user, the home directory is set to a common root path.
You can also configure a home directory individually per user.

```
  home_directory_type = "PATH"
  home_directory      = "/${aws_s3_bucket.this.id}"
```

## Tracking Operation Logs

Operation logs are recorded in CloudWatch Logs at `/aws/transfer/SFTPサーバーID`.

We have confirmed that operations such as get, put, and rm are logged.

## Organizing the Information Needed for Access

Information that connection requesters submit:

- Source IP
  - It needs to be allowed in the security group
- Username
  - The username must be 3 to 100 characters long. Valid characters are a–z, A–Z, 0–9, underscore, hyphen, at sign, and period. It cannot begin with a hyphen, at sign, or period.
- SSH public key

Information that the server administrator submits:

- Server hostname

## Conclusion

It does feel a little on the expensive side, but as a managed service there's a lot we can leave to AWS, and we were able to build an SFTP server with low management cost.

Since uploaded files accumulate in the S3 bucket, the total object size will keep growing. To prevent ballooning costs, I think you should set up lifecycle rules, such as transitioning objects to Glacier.

I hope this is helpful.
