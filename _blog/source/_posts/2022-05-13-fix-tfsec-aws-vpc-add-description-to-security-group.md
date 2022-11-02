---
title: tfsec aws-vpc-add-description-to-security-group 対応
date: 2022-05-13
category:
  - Terraform
thumbnail: https://i.imgur.com/vaHrTti.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

terraform で AWS Security Group リソースは以下の場合、 `aws-vpc-add-description-to-security-group` ルールで違反が指摘されます。

<!-- more -->

- `description` がない
- `description = "Managed by Terraform"`

description を変更すればルールを回避できますが、その際にセキュリティグループが再作成となります。

```
$ terraform plan

...

  # aws_security_group.this must be replace
-/+ resource "aws_security_group" "this" {
```

tfsec:ignore:aws-vpc-add-description-to-security-group で暫定的に回避することは可能です。

```
resource "aws_security_group" "this" {
  description = "Managed by Terraform" # tfsec:ignore:aws-vpc-add-description-to-security-group 変更時に再作成となる為
}
```

## aws-cli でセキュリティグループの　 description 更新はできない

2022-05-13 時点、
aws-cli でセキュリティグループの description の更新コマンドはありませんでした。

※セキュリティグループルールの description 更新コマンドはあります。

時折、 terraform だと再作成になるが、 aws-cli であれば更新できるケースがありますが、セキュリティグループの description は無理でした。

## AWS コンソール上でも変更はできない

AWS コンソール上で変更ができませんでした。

## かくなる上は

terraform で既存リソースのコピーを作成しアタッチし直すのが良さそうです。

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

AWS コンソールのセキュリティグループを選択し Actions > `Copy to new security group` をクリックする手と同じです。

ただ、対応コストとリスクを鑑みると、優先順位が高くなく、
セキュリティグループルールの description の変更は可能なので、
そちらを適宜対応していくのが良いと感じました。

セキュリティグループリソース作成時に意識できる様にしていきたい所です。

以上
参考になれば幸いです。
