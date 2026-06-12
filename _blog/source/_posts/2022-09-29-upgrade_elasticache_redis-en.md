---
title: Things to Watch Out for When Upgrading the AWS ElastiCache Redis Version and Changing the Node Type
date: 2022-09-29
category: AWS
lang: en
translation_id: upgrade_elasticache_redis
permalink: en/2022/09/29/upgrade_elasticache_redis/
cover: https://i.imgur.com/6PU8EYE.png
---

AWS prompted me to upgrade from the cache.m3 family to the cache.m5 family.

> One or more of your Amazon ElastiCache clusters is running on our previous generation node type cache.m3.medium. We strongly recommend that you migrate to one of our latest generation node types, and with ElastiCache it is fast and easy to choose a new instance type for your cluster.
>
> Our latest generation node types offer benefits such as better price per compute performance, higher-performing CPUs, improved memory, network performance, and ElastiCache optimizations such as enhanced I/O that provides improved throughput per node.
>
> Migration to the latest generation node types is available via our scale-up feature. To scale up your cluster:
> First, determine the best upgrade path from your previous generation node type(s) to the latest generation, see https://aws.amazon.com/elasticache/previous-generation

Here I summarize the things to keep in mind when upgrading.

## Conclusion

<!-- more -->

1. Take a snapshot of Redis
2. Create a Redis instance with the desired version and node type from that snapshot
3. Change the application's endpoint

Since the upgrade may require recreation, I took the steps above.
* I discovered this when `terraform plan` reported that changing the version would trigger a recreation, and found that it could not be performed even when I tried it from the console.

Also, because data retention during a node type change is best effort, there is a possibility of data loss.
For that reason, I handled it by putting Redis into a state where it was not being accessed, taking a snapshot, and then creating a new Redis instance from it.

That's all.
I hope this is helpful.
