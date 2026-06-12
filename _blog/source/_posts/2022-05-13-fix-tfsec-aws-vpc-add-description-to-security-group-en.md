---
title: Dealing with tfsec aws-vpc-add-description-to-security-group
date: 2022-05-13
lang: en
translation_id: fix-tfsec-aws-vpc-add-description-to-security-group
permalink: en/2022/05/13/fix-tfsec-aws-vpc-add-description-to-security-group/
category:
  - Terraform
cover: https://i.imgur.com/vaHrTti.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

In terraform, an AWS Security Group resource is flagged as a violation by the `aws-vpc-add-description-to-security-group` rule in the following cases.

<!-- more -->

- It has no `description`
- `description = "Managed by Terraform"`

You can avoid the rule by changing the description, but doing so causes the security group to be recreated.

```
$ terraform plan

...

  # aws_security_group.this must be replace
-/+ resource "aws_security_group" "this" {
```

You can work around it temporarily with tfsec:ignore:aws-vpc-add-description-to-security-group.

```
resource "aws_security_group" "this" {
  description = "Managed by Terraform" # tfsec:ignore:aws-vpc-add-description-to-security-group 変更時に再作成となる為
}
```

## You cannot update a security group's description with the aws-cli

As of 2022-05-13,
there was no aws-cli command to update a security group's description.

* Note: there is a command to update the description of a security group rule.

Sometimes there are cases where terraform requires recreation but the aws-cli can perform an update, but for a security group's description it was not possible.

## You cannot change it in the AWS console either

I was not able to change it in the AWS console.

## So, what to do

It seems best to create a copy of the existing resource in terraform and re-attach it.

```
resource "aws_security_group" "this" {
  description = "Managed by Terraform"
}

# 別途作成する
resource "aws_security_group" "this_v2" {
  description = ""
}

resource "aws_lb" "app" {
  name = "${local.prefix}-app-lb"

  security_groups = [
    aws_security_group.this.id,
    aws_security_group.this_v2.id, # 追加
  ]
```

This is the same as selecting the security group in the AWS console and clicking Actions > `Copy to new security group`.

That said, considering the cost and risk of the work, the priority is not high, and since changing the description of a security group rule is possible, I felt it was best to handle that as appropriate.

I want to keep this in mind when creating security group resources going forward.

That's all.
I hope this is helpful.
