---
title: aws_ssm_parameter の value を ignore_change に指定しない
category: Terraform
tags:
- AWS
date: 2020-06-01
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## 概要

これまで秘密情報は以下の様な取り扱いをしていることが多かったです。

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

上記いずれの場合にも、事前に Parameter Store への登録が必須です。
つまり、terraform で管理されない作業が発生していることになります。

## 対応ステップ

terraform で完結させる方法としては、パラメータストアに登録する value を暗号化して登録することです。

<!-- more -->

1. [暗号化に必要な KMS Key を作成](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_key)する

```yml
resource "aws_kms_key" "a" {
  description             = "KMS key 1"
  deletion_window_in_days = 10
}
```

2. [aws kms encrypt](https://docs.aws.amazon.com/cli/latest/reference/kms/encrypt.html) で値を暗号化

```sh
aws kms encrypt --key-id <key-id> --plaintext <value>

AQECAHgaPa0J8...3MmDBdqP8dPp28OoAQ==
```

3. [data.aws_kms_secrets]((https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/kms_secrets)) で取得した値をパラメータストアに登録する

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

パラメータストアに登録という前提では `resource "aws_ssm_parameter"` の処理が必要でしたが、以下の様に直接リソースへの指定も可能です。

```yml
resource "aws_rds_cluster" "example" {
  # ... other configuration ...
  master_password = data.aws_kms_secrets.parameters.plaintext["master_password"]
  master_username = data.aws_kms_secrets.parameters.plaintext["master_username"]
}
```

## まとめ

悩んだ時に公式ドキュメントを見ると解決されていることが本当に多いです。

ちなみに、
KMS キーで暗号化するのは誰がするか？と考えると、おそらく terraform のコードを書いている方になろうかと思いますが、
その施行者には KMS キーで暗号化する権限が必要になります。

* kms:Encrypt


以上
参考になれば幸いです。
