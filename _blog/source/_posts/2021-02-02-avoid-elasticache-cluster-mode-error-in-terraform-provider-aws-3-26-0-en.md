---
title: ElastiCache ClusterMode Error in terraform-provider-aws 3.26.0
category: Terraform
tags:
  - AWS
date: 2021-02-02
lang: en
translation_id: avoid-elasticache-cluster-mode-error-in-terraform-provider-aws-3-26-0
permalink: en/2021/02/02/avoid-elasticache-cluster-mode-error-in-terraform-provider-aws-3-26-0/
cover: https://i.imgur.com/xeRZLru.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

Just a memo.

With terraform-provider-aws 3.26.0, the following configuration results in an error.

```redis.tf
resource "aws_elasticache_replication_group" "cache_store" {
  automatic_failover_enabled    = true

  # NOTE: 商用環境以外でコストを抑えるべく必要最低限のリソースの起動にする
  cluster_mode {
    replicas_per_node_group = 0
    num_node_groups         = 1
  }
  ...
}
```

```sh
Error: if automatic_failover_enabled is true, number_cache_clusters must be greater than 1

  on redis_cache.tf line 12, in resource "aws_elasticache_replication_group" "cache_store":
  12: resource "aws_elasticache_replication_group" "cache_store" {
```

You need to fix it as follows.

```redis.tf
resource "aws_elasticache_replication_group" "cache_store" {
-  automatic_failover_enabled    = true
+  automatic_failover_enabled    = false
  cluster_mode {
    replicas_per_node_group = 0
    num_node_groups         = 1
  }
  ...
}
```

That's all.
