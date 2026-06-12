---
title: Caveats When Building ElastiCache Redis 6.x with Terraform
category: Terraform
tags:
  - AWS
date: 2020-12-14
lang: en
translation_id: terraform-elasticache-redis-6.x
permalink: en/2020/12/14/terraform-elasticache-redis-6.x/
cover: https://i.imgur.com/aCEdhs4.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## Overview

There was a certain ritual to go through when using the ElastiCache Redis 6.x line with Terraform, so here is a memo for future reference.

<!-- more -->

## Problem when specifying redis engine_version = 6.x

To build ElastiCache > Redis with the 6.x line, you need to specify `engine_version = "6.x"` as shown below.

```
resource "aws_elasticache_replication_group" "cache_store" {
    engine         = "redis"
    engine_version = "6.x"
  ...
```

Then, after building it, running `terraform plan` produces the following change.

```
~ resource "aws_elasticache_replication_group" "cache_store" {
    engine         = "redis"
  ~ engine_version = "6.0.5" -> "6.x"
```

An issue had been filed about this behavior.

https://github.com/hashicorp/terraform-provider-aws/issues/15625

As a workaround, I want to avoid adding `ignore_changes = [engine_version]` as much as possible.
https://github.com/hashicorp/terraform-provider-aws/issues/15625#issuecomment-727759811

For now, I handle it by specifying `engine_version = "6.0.5"` after creation, as shown below.

```
resource "aws_elasticache_replication_group" "cache_store" {
    engine         = "redis"
    engine_version = "6.0.5"
```

You might think, "Why not just specify `engine_version = "6.0.5"` at build time!" but that results in an error.

So leaving a comment at build time is kind to reviewers.

```
resource "aws_elasticache_replication_group" "cache_store" {
    engine         = "redis"
    # TODO: After building, change this to the version that was actually adopted.
    #       This is because a diff in engine_version appears in terraform plan after the build.
    # see: https://github.com/hashicorp/terraform-provider-aws/issues/15625
    engine_version = "6.x"
```

That's all.
I hope this is helpful.
