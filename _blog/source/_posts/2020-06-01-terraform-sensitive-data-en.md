---
title: Don't Add aws_ssm_parameter's value to ignore_changes
category: Terraform
tags:
- AWS
date: 2020-06-01
lang: en
translation_id: terraform-sensitive-data
permalink: en/2020/06/01/terraform-sensitive-data/
cover: /img/cover/2020-06-01-terraform-sensitive-data.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## Overview

Up until now, secret information was often handled in ways like the following.

```yml
resource "aws_ssm_parameter" "master_password" {
  name  = "master_password"
  type  = "SecureString"
  value = "dummy"

  lifecycle {
    ignore_changes = [value]
  }
}
```

```yml
data "aws_ssm_parameter" "master_password" {
  name = "master_password"
}
```

In either of the above cases, registering the value in Parameter Store beforehand is required.
In other words, this introduces work that is not managed by Terraform.

## Steps to Address This

The way to keep everything within Terraform is to encrypt the value before registering it in Parameter Store.

<!-- more -->

1. [Create the KMS Key needed for encryption](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_key)

```yml
resource "aws_kms_key" "a" {
  description             = "KMS key 1"
  deletion_window_in_days = 10
}
```

2. Encrypt the value with [aws kms encrypt](https://docs.aws.amazon.com/cli/latest/reference/kms/encrypt.html)

```sh
aws kms encrypt --key-id <key-id> --plaintext <value>

AQECAHgaPa0J8...3MmDBdqP8dPp28OoAQ==
```

3. Register the value obtained via [data.aws_kms_secrets]((https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/kms_secrets)) in Parameter Store

```yml
data "aws_kms_secrets" "parameters" {
  secret {
    name    = "master_password"
    payload = "AQECAHgaPa0J8...3MmDBdqP8dPp28OoAQ=="
  }
}

resource "aws_ssm_parameter" "master_password" {
  name  = "/${var.environment}/database/password/master"
  type  = "SecureString"
  value = data.aws_kms_secrets.parameters.plaintext["master_password"]
}
```

Under the premise of registering it in Parameter Store, the `resource "aws_ssm_parameter"` processing was necessary, but you can also specify it directly on a resource as shown below.

```yml
resource "aws_rds_cluster" "example" {
  # ... other configuration ...
  master_password = data.aws_kms_secrets.parameters.plaintext["master_password"]
  master_username = data.aws_kms_secrets.parameters.plaintext["master_username"]
}
```

## Summary

It's truly common that, when you're stuck, checking the official documentation resolves the issue.

By the way,
when you think about who is the one encrypting with the KMS key, it's probably the person writing the Terraform code, and that operator needs permission to encrypt with the KMS key.

* kms:Encrypt


That's all.
I hope this helps.
