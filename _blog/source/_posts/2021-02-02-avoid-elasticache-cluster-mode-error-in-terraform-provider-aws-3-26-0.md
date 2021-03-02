---
title: terraform-provider-aws 3.26.0 で ElastiCache ClusterMode でエラーになる件
category: Terraform
tags:
- AWS
date: 2021-02-02
thumbnail: https://i.imgur.com/xeRZLru.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

備忘録です。

terraform-provider-aws 3.26.0 で 以下設定ではエラーになります。

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


以下に修正する必要がある。

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

以上です。
