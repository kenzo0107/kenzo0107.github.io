---
layout: post
title: Handling ElastiCache Maintenance ~Rainy Season 2018~
date: 2018-06-24
category: AWS
lang: en
translation_id: maintenance_aws_elasticache
permalink: en/2018/06/24/maintenance_aws_elasticache/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180624/20180624213819.png
tags:
- AWS
- ElastiCache
---

This is a memo from around June 2018 when a large number of AWS ElastiCache maintenance notifications came in all at once.

{% twitter https://twitter.com/fujiwara/status/1008956888086503425 %}

<!-- more -->

## Links I referred to during maintenance

[Amazon ElastiCache for Redis](https://docs.aws.amazon.com/ja_jp/AmazonElastiCache/latest/red-ug/CacheNodes.html#ReplaceStandalone)

Basically, replacing the node is required.

Below are the steps for doing it manually.

### When node = 1

For a standalone ElastiCache:

1. Take a backup
2. Add a read replica
3. Promote the replica to become the primary
4. Delete the former node that has become the replica

This completes the node replacement.

### node = N (>=2)

When there are multiple nodes:

1. Take a backup
2. Perform a failover

According to AWS Support:
> The failover API simulates a failure, so the node is also replaced after the failover.

So that's how it works.


## How to confirm that maintenance is complete

<b>I think there is no way to check the status accurately other than asking Support.</b>

The events keep an operation log, but no log indicating that maintenance was actually performed is left behind at all.

Also, the alert does not disappear immediately. I'm not exactly sure, but it had disappeared after a few hours had passed.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180624/20180624213819.png" width="100%">
</div>

## What happens if you leave it alone without running it manually

The maintenance was performed during the time window specified in the maintenance window.

By the way, the event log when leaving it alone looked like the following.

n = 1
<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180624/20180624220417.png" width="100%">
</div>

n = 2
<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180624/20180624220358.png" width="100%">
</div>

You can see that for n = 2, the failover is executed automatically.

The elapsed time of the maintenance itself depends on the amount of data, so it cannot be stated uniformly. Therefore, I think it's a good idea to do a rehearsal once before production to get a rough estimate.

That's all.
I hope this is helpful.
