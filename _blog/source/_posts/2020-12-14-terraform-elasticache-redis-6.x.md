---
title: Terraform Elasticache Redis 6.x 構築時の注意
category: Terraform
tags:
- AWS
date: 2020-12-14
thumbnail: https://i.imgur.com/aCEdhs4.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## 概要

terraform で ElastiCache redis 6 系を利用時に通る儀式があったので、備忘録

## redis engine_version = 6.x 指定時の問題点

ElastiCache > Redis を 6 系で構築するには以下の様に `engine_version = "6.x"` と指定する必要があります。

```
resource "aws_elasticache_replication_group" "cache_store" {
    engine         = "redis"
    engine_version = "6.x"
  ...
```

そして、構築後に `terraform plan` をすると、以下の様な変更が生じます。

```
~ resource "aws_elasticache_replication_group" "cache_store" {
    engine         = "redis"
  ~ engine_version = "6.0.5" -> "6.x"
```

この事象について issue が上がっていました。

https://github.com/hashicorp/terraform-provider-aws/issues/15625

対応の一手として `ignore_changes = [engine_version]` を加えるのは極力避けたい。
https://github.com/hashicorp/terraform-provider-aws/issues/15625#issuecomment-727759811

現状は、作成後に以下の様に `engine_version = "6.0.5"` を指定することで対応しています。

```
resource "aws_elasticache_replication_group" "cache_store" {
    engine         = "redis"
    engine_version = "6.0.5"
```

構築時に `engine_version = "6.0.5"` って指定したらいいじゃないか！と思いましたが、それだとエラーになります。

なので、構築時にはコメントを入れておくとレビュワーに優しい。

```
resource "aws_elasticache_replication_group" "cache_store" {
    engine         = "redis"
    # TODO: 構築後に採用されたバージョンに変更する。
    #       構築後に terraform plan で engine_version の差分が生じる為です。
    # see: https://github.com/hashicorp/terraform-provider-aws/issues/15625
    engine_version = "6.x"
```

以上
参考になれば幸いです。
