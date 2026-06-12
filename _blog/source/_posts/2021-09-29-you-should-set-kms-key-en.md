---
title: Considering the Meaning of Setting an AWS KMS Key
category: AWS
tags:
- AWS
date: 2021-09-29
lang: en
translation_id: you-should-set-kms-key
permalink: en/2021/09/29/you-should-set-kms-key/
cover: /img/cover/2021-09-29-you-should-set-kms-key.svg
---

The `kms_key_id` of `aws_rds_cluster` is `Optional`,
but here I want to think about what benefits you get by setting it.

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

```
resource "aws_kms_key" "rds" {
  enable_key_rotation = true
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

resource "aws_rds_cluster" "db" {
    kms_key_id        = aws_kms_key.rds.arn
}
```

## What is kms_key_id?

As stated in the official Terraform documentation, `kms_key_id` is required when encrypting storage.

https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/rds_cluster#kms_key_id
> (Optional) The ARN for the KMS encryption key. When specifying kms_key_id, storage_encrypted needs to be set to true.

## Why Encrypt Storage

The reason to encrypt storage is that even if the storage were physically taken away, it cannot be decrypted without the configured KMS key, so your data remains protected.

## It Also Serves as Proof of Disposal

If you read the following AWS documentation, you'll find this sentence:
https://aws.amazon.com/jp/blogs/news/data_disposal/

> Protecting and recording the disposal of data by leveraging encryption

By encrypting your storage with your own KMS key,
you can control and record access to that key through policies,
and furthermore, by disposing of the key itself, you can make the data itself inaccessible.

This allows you to provide proof of disposal.

## Summary

The reasons it is meaningful to set a self-managed KMS key were as follows.

* Data protection
  * Encrypt storage so it cannot be decrypted even if the storage is taken away
* Access control and recording
  * Control access via policies, which lets you keep records of access
* Proof of disposal
  * Since you can prohibit access to the data itself, this serves as proof of disposal

## How I Came to Think About This

What prompted me to think about KMS key configuration was a question from a customer:
"If your company's DB contains personal information, can you provide proof of disposal when the service is closed?"

I thought, "Isn't deleting the DB itself enough for proof of disposal?" but it also felt like that only deletes it logically, and it seemed like it might remain on AWS side... So when I dug deeper, I realized there are various meanings beyond just data protection.

That's all.
I hope this is helpful.
