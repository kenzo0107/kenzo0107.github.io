---
title: For AWS IAM Policies, Prefer Managed Policies over Inline Policies
category: Terraform
tags:
- AWS
date: 2020-07-02
lang: en
translation_id: aws-iam-policy-managed-or-inline
permalink: en/2020/07/02/aws-iam-policy-managed-or-inline/
cover: /img/cover/2020-07-02-aws-iam-policy-managed-or-inline.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## Overview

I looked into the difference between managed policies and inline policies for IAM policies, and which one you should use.

<!-- more -->

## Conclusion: Avoid Inline Policies and Actively Use Managed Policies

[Managed Policies and Inline Policies](https://docs.aws.amazon.com/ja_jp/IAM/latest/UserGuide/access_policies_managed-vs-inline.html)

If you look at the "Comparison of managed policies and inline policies" section in the AWS documentation linked above, the benefits of using managed policies become clear.

> We recommend that you use managed policies instead of inline policies.
>
> Managed policies provide the following features:
> * Reusability
> * Central change management
> * Versioning and rollback
> * Delegating permissions management
> * Automatic updates for AWS managed policies



## Thinking Like Terraform

If you think about the resources you need from Terraform's perspective, you end up with the following:

* Managed policy
  * aws_iam_policy
  * aws_iam_user_policy_attachment

* Inline policy
  * aws_iam_user_policy

#### Example) Managed Policy

```
# IAM User
resource "aws_iam_user" "hoge" {
  name = "hoge"
  path = "/"
}

# 管理ポリシー
resource "aws_iam_policy" "hoge" {
  name   = "hoge"
  policy = data.aws_iam_policy_document.hoge.json
}

# ポリシー
data "aws_iam_policy_document" "hoge" {
  statement {
    ...
  }
}

# ポリシーを IAM User にアタッチ
resource "aws_iam_user_policy_attachment" "hoge" {
  user       = aws_iam_user.hoge.name
  policy_arn = aws_iam_policy.hoge.arn
}
```

#### Example) Inline Policy

```
# IAM User
resource "aws_iam_user" "hoge" {
  name = "hoge"
  path = "/"
}

# ポリシー
data "aws_iam_policy_document" "hoge" {
  statement {
    ...
  }
}

# インラインポリシーとして IAM User にポリシーをアタッチ
resource "aws_iam_user_policy" "hoge" {
  name   = "hoge"
  user   = aws_iam_user.hoge.name
  policy = data.aws_iam_policy_document.hoge.json
}
```

## Summary

The next time you get a chance to review a Terraform project and you spot an `aws_iam_user_policy`, by all means narrow your eyes and hold forth about "the superiority of managed policies..." while linking to the AWS documentation.

That's all.
I hope you find this helpful.
