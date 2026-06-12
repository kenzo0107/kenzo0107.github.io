---
title: Pitfalls I Hit Using ElastiCache Redis (Cluster Mode Enabled) with Ruby
tags:
- AWS
- Ruby
date: 2020-12-11
lang: en
translation_id: ruby-to-elasticache-redis-cluster-mode
permalink: en/2020/12/11/ruby-to-elasticache-redis-cluster-mode/
cover: https://i.imgur.com/mESrwk7.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## Overview

This post sums up the pitfalls I ran into when using ElastiCache Redis (cluster mode enabled) with Ruby.

<!-- more -->

## Conclusion First

After all my testing, I boiled it down to the following code.

```ruby
require 'redis' # Using redis/redis-rb

# Specify only the Configuration Endpoint as the connection target, and the cluster nicely takes care of routing to the nodes for you♪
# When you encrypt in transit (in transit) and at rest (in rest), you need to specify `rediss://` (one extra s).
redis = Redis.new(cluster: ["rediss://<elasticache configuration endpoint>:6379"])

redis.set('key1', 'hogehoge')
redis.set('key2', 'mogemoge')

p redis.get('key1') # => hogehoge
p redis.mget('key1', 'key2')  # => Redis::CommandError (CROSSSLOT Keys in request don't hash to the same slot)
```

<!-- more -->

I'm using [redis/redis-rb](https://github.com/redis/redis-rb) as the Redis client library.

## Connection Settings

In the end, the solution was to specify the `Configuration Endpoint` that is issued when ElastiCache Redis has cluster mode enabled via `cluster:`.

```ruby
redis = Redis.new(cluster: ["rediss://<elasticache configuration endpoint>:6379"])
```

By the way, the `rediss://` is not a typo. Because I enabled encryption in transit (in transit) and at rest (in rest) in the ElastiCache Redis settings, I configured it this way so as to use redis-rb's SSL/TLS support.

Reference: https://github.com/redis/redis-rb#ssltls-support

ElastiCache > Redis encryption settings
![](https://i.imgur.com/mESrwk7.png)

While using redis-rb, enabling encryption didn't make anything harder to use, so I recommend taking advantage of the improved security.


### I Got Stuck on Connecting to a Redis Cluster

If you look at https://github.com/redis/redis-rb#cluster-support, it shows an example connection implementation that specifies multiple `<node endpoint>` values in `cluster:` like the following.

```ruby
nodes = [
	"rediss://<node endpoint 1>:6379",
	"rediss://<node endpoint 2>:6379",
]
redis = Redis.new(cluster: nodes)
```

However, in this case, once you add nodes and the slots get rebalanced, you can no longer retrieve the data that lives on the newly added nodes.

You'd have to add the newly added `node endpoint` to the `nodes` array above. That's not dynamic.

This means you can no longer enjoy the benefit described in the AWS documentation below of "continuing to serve requests even during the scaling process."
https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/scaling-redis-cluster-mode-enabled.html

> You can adjust the number of shards in your Redis (cluster mode enabled) cluster to improve performance or reduce costs in response to changes in your cluster's demand. To do so, we recommend using online horizontal scaling, which lets the cluster continue serving requests even during the scaling process.

So,
I wanted to use the Configuration Endpoint that is issued when ElastiCache Redis cluster mode is enabled.
But the following didn't work...

```ruby
Redis.New(url: "rediss://<configuration endpoint>:6379")
```

And then, when I tried the following, it worked! I was so glad!

```ruby
Redis.New(cluster: ["rediss://<configuration endpoint>:6379"])
```

## Caveats When Using Cluster Mode

When using `redis.mget` with cluster mode enabled, I observed the error `CROSSSLOT Keys in request don't hash to the same slot`.

```ruby
redis = Redis.new(cluster: ["rediss://<elasticache configuration endpoint>:6379"])

redis.set('key1', 'hogehoge')
redis.set('key2', 'mogemoge')

p redis.get('key1') # => hogehoge
p redis.mget('key1', 'key2')  # => Redis::CommandError (CROSSSLOT Keys in request don't hash to the same slot)
```

There's a sample below as well, and it says to avoid cross-slot commands in the commands you call.
https://github.com/redis/redis-rb#cluster-support
> The calling code is responsible for avoiding cross slot commands.

## Are Requests Really Served Continuously During Scaling?

I actually ran set and get while performing the following, and requests kept being served without any particular problems.

* Horizontal scaling
  * Adding shards `Add shards`
  * Deleting shards `Delete shards`
  * Adding replicas `Add Replicas`
  * Deleting replicas `Delete Replicas`
* Vertical scaling
  * Scaling instance specs up/down

Redis cluster mode is resilient to maintenance!


![](https://i.imgur.com/eXCDj88.png)

## Using It with Sidekiq

The documentation for [sidekiq](https://github.com/mperham/sidekiq) says that Cluster is not suited for it, and recommends Sentinel or a Redis SaaS that supports failover.

https://github.com/mperham/sidekiq/wiki/Using-Redis#architecture
> Cluster is designed for large-scale datasets, like caches, that can spread evenly across machines. Cluster is NOT appropriate for Sidekiq as Sidekiq has a few very hot keys which are constantly changing (aka queues). I recommend using Sentinel or use a Redis SaaS which has built-in support for failover.

Since this can't be handled with redis-rb + ElastiCache Redis cluster mode enabled alone, you need to prepare something separately.

For now, when using sidekiq, I leave cluster mode disabled.

## References

https://made.livesense.co.jp/entry/2018/10/17/135245
