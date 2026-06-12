---
title: On the Abnormal Spike in AWS ElastiCache CPU Utilization Around Noon on 2022-01-15
date: 2022-01-15
lang: en
translation_id: aws-elasticache-redis-cpu-utilization-unnormally-up
permalink: en/2022/01/15/aws-elasticache-redis-cpu-utilization-unnormally-up/
cover: https://i.imgur.com/JHvTN3N.png
category: AWS
---

Around 11:40 on 2022-01-15, an event was observed in which several nodes of AWS ElastiCache (ap-northeast-1) recorded CPU utilization values well in excess of 100%.

![](https://i.imgur.com/JHvTN3N.png)

After assessing the situation, we confirmed that there was no particular impact on users.

## Summary of the situation during the CPU utilization spike

* Nothing in particular was recorded on the [Service Health Dashboard](https://status.aws.amazon.com/)
* The cache hit rate temporarily dropped by roughly 92% → 78% (-14%)
* No 5xx errors occurred in the parts of the application that use Redis
* The worker jobs that use Redis were also unaffected
* Since the Engine CPU Utilization (= the CPU utilization of the Redis engine thread) was low, it seems there was no impact on the Redis processing itself
* Because the CPU Utilization (the CPU utilization of the entire host other than Redis) surged, it appears that AWS made some update to the host
    - Could this be related?
        https://aws.amazon.com/jp/about-aws/whats-new/2022/01/amazon-elasticache-streaming-storing-redis-engine-logs/

Reference: https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/CacheMetrics.Redis.html

TODO: I will contact support and add the findings here.

## Result of contacting AWS Support

It turned out to be a bug in the metrics. (Phew.)
