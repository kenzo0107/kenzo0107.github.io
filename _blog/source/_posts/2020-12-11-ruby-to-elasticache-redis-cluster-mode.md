---
title: ruby で ElastiCache Redis クラスターモード有効 利用でハマった所
tags:
- AWS
- Ruby
date: 2020-12-11
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

# 概要

ruby で ElastiCache Redis （クラスターモード有効）を利用した際にハマったことをまとめます。

## まず結論

検証終わり、以下のコードにまとめました。

```ruby
require 'redis' # redis/redis-rb を利用

# 接続先は Configuration Endpoint のみ指定すれば、 cluster でよしなに、 node にアクセスしてくれた♪
# 通信時(in transit), 保管時(in rest) に暗号化する様にすると`rediss://｀を指定する必要がある。 (s が1つ多い)
redis = Redis.new(cluster: ["rediss://<elasticache configuration endpoint>:6379"])

redis.set('key1', 'hogehoge')
redis.set('key2', 'mogemoge')

p redis.get('key1') # => hogehoge
p redis.mget('key1', 'key2')  # => Redis::CommandError (CROSSSLOT Keys in request don't hash to the same slot)
```

<!-- more -->

Redis Client Library として [redis/redis-rb](https://github.com/redis/redis-rb) を使用しています。

## 接続設定

最終的に ElastiCache Redis クラスターモード有効化時に発行される `Configuration Endpoint` を `cluster:` で指定することで解決しました。

```ruby
redis = Redis.new(cluster: ["rediss://<elasticache configuration endpoint>:6379"])
```

ちなみに `rediss://` はミスでなく、ElastiCache Redis の設定にある通信時(in transit), 保管時(in rest) に暗号化した際に redis-rb の SSL/TLS Support 機能を使用しています。

参考: https://github.com/redis/redis-rb#ssltls-support

ElastiCache > Redis の暗号化設定
![](https://i.imgur.com/mESrwk7.png)

redis-rb 利用している限り、暗号化したことで利用しにくいということはなかったので、セキュリティ向上の恩恵を受けることを推奨します。


### Redis Cluster の接続でハマった。

https://github.com/redis/redis-rb#cluster-support を参照すると以下の様に `cluster:` に `<node endpoint>` を複数指定することで接続実装の例を示しています。

```ruby
nodes = [
	"rediss://<node endpoint 1>:6379",
	"rediss://<node endpoint 2>:6379",
]
redis = Redis.new(cluster: nodes)
```

ですが、この場合、node を増やして slot を再構成したら、増やした node にあるデータが取れなくなってしまいます。

上記の nodes に増やした `node endpoint` を追加しないといけなくなります。動的でありません。

以下 AWS ドキュメントにある、「スケーリングプロセス中でもリクエストを処理し続ける」恩恵を受けられなくなってしまうことになります。
https://docs.aws.amazon.com/ja_jp/AmazonElastiCache/latest/red-ug/scaling-redis-cluster-mode-enabled.html

> クラスターの需要の変化に応じて Redis (クラスターモードが有効) のクラスター内のシャード数を変更することで、パフォーマンスを向上させたりコストを削減したりできます。そのために、スケーリングプロセス中でもクラスターがリクエストを処理し続けることができる、オンライン水平スケーリングの使用をお勧めします

そこで、
ElastiCache Redis クラスターモード有効時に発行される Configuration Endpoint を利用したい。
でも以下はダメだった。。

```ruby
Redis.New(url: "rediss://<configuration endpoint>:6379")
```

そして、以下試した所いけた！嬉しかった！

```ruby
Redis.New(cluster: ["rediss://<configuration endpoint>:6379"])
```

## クラスターモード使用時の注意

クラスターモード有効時に `redis.mget` を使用した際に `CROSSSLOT Keys in request don't hash to the same slot` のエラーが確認されました。

```ruby
redis = Redis.new(cluster: ["rediss://<elasticache configuration endpoint>:6379"])

redis.set('key1', 'hogehoge')
redis.set('key2', 'mogemoge')

p redis.get('key1') # => hogehoge
p redis.mget('key1', 'key2')  # => Redis::CommandError (CROSSSLOT Keys in request don't hash to the same slot)
```

以下にサンプルもあり、呼び出しコマンドで クロススロットコマンドは避けてね、とあります。
https://github.com/redis/redis-rb#cluster-support
> The calling code is responsible for avoiding cross slot commands.

## スケーリング中のアクセスは本当に処理され続けるのか？

実際に以下実施しながら、 set, get を実行しましたが、特に問題なくリクエストは処理され続けられました。

* 水平スケール
  * シャード追加 `Add shards`
  * シャード削除 `Delete shards`
  * レプリカ追加 `Add Replicas`
  * レプリカ削除 `Delete Replicas`
* 垂直スケール
  * インスタンスのスペックアップ・ダウン

メンテに強い、Redis クラスターモード！


![](https://i.imgur.com/eXCDj88.png)

## sidekiq で利用するには

[sidekiq](https://github.com/mperham/sidekiq) は Cluster に適していない、Sentinel or failover サポートの Redis SaaS がおすすめです、とドキュメントにあります。

https://github.com/mperham/sidekiq/wiki/Using-Redis#architecture
> Cluster is designed for large-scale datasets, like caches, that can spread evenly across machines. Cluster is NOT appropriate for Sidekiq as Sidekiq has a few very hot keys which are constantly changing (aka queues). I recommend using Sentinel or use a Redis SaaS which has built-in support for failover.

redis-rb + ElastiCache Redis クラスターモード有効 だけの対処では、対応できないので、別途準備が必要です。

現状、 sidekiq 利用する際には、 クラスターモードは有効にせず、使用しています。

## 参考

https://made.livesense.co.jp/entry/2018/10/17/135245
