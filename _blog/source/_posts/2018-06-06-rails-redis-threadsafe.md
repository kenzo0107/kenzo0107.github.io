---
layout: post
title: Rails × Redis でスレッドセーフなアクセス数ランキング実装
date: 2018-06-06
tags:
- Ruby
- Rails
- Rails
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180606/20180606115540.jpg
---

## 概要

メディアサイトで記事ページへアクセス数ランキングを実装しました。

* Rails 5.1
* Redis (AWS ElastiCache 3.2.10)

その際にマルチスレッド環境を考慮してスレッドセーフな実装を心がけました。

<!-- more -->

## スレッドセーフとは

スレッドセーフとは複数のスレッドが同時並行的に実行しても問題が発生しないことを意味します。
スレッドセーフでない場合は、あるスレッドで変更した共有データが、他のスレッドによって上書きされてしまう可能性があります。

Webサーバーやデータベースなどのサーバー用ソフトウェアは、マルチスレッド（マルチプロセス）で動作しているので、サーバー向けアプリケーションを開発するときは、マルチスレッドで動作するように実装することが望ましいです。

#### 参照

[スレッドセーフ](https://ja.wikipedia.org/wiki/%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89%E3%82%BB%E3%83%BC%E3%83%95)

[JavaのThreadLocalとスレッドセーフについて](https://qiita.com/naoyoshinori/items/507c5c3ea6027033f4bb)



## 仕様

メディアサイトで記事詳細ページへアクセスした際に
その記事 ID に対して閲覧数を +1 インクリメントします。

そして、
その閲覧数 TOP 10 のランキングを表示する、
というものです。

その際の Rails, Redis の設定についてまとめました。

## 実装方法検討

config/initializers/redis.rb((host, port は secrets.yml なり ENV で設定してください)) で Redis の初期設定の実装方法を検討しました。

### global 変数として設定

```ruby
require 'redis'

REDIS = Redis.new(host: host, port: port)
```

上記の場合、
グローバルで Redis クライアントを持っており
マルチスレッド環境では、複数のスレッドが上書きされる可能性があります。

### Thread.current

```ruby
require 'redis'

def redis
  Thread.current[:redis] ||= Redis.new(host: host, port: port)
end
```

現在実行中のスレッドを取得しスレッド毎のデータを担保します。

が、以下 2  点の問題があります。

1. 他人が上書いてしまう
2. 構造化されていない

### ActiveSupport::PerThreadRegistry

```ruby
require 'redis'

class RedisRegistry
  extend ActiveSupport::PerThreadRegistry
  attr_accessor :redis, :current_permissions
end

def redis
  RedisRegistry.redis ||= Redis.new(host: host, port: port)
end
```

redis をスレッドローカル変数として定義し、そのアクセスをカプセル化し上書きされるのを防止しています。

ですが、
Rails 5.2 で [deprecated](http://api.rubyonrails.org/classes/ActiveSupport/PerThreadRegistry.html) となっておりました (TへT)

### thread_mattr_accessor

以下を見てみると `thread_mattr_accessor` の挙動が Fix していました。
[Fix `thread_mattr_accessor` share variable superclass with subclass](https://github.com/rails/rails/pull/25681)

`thread_mattr_accessor` を利用して書き換えます。

* config/initializers/redis.rb

```ruby
require 'redis'

class RedisRegistry
  thread_mattr_accessor :redis
end

def redis
  RedisRegistry.redis ||= Redis.new(host: host, port: port)
end
```

## アクセス数インクリメント

`rescue` 設定は Redis に接続できなくなった場合でもサイト自体が落ちることはなく、ランキングだけが表示されなくなる様にする為に設定しました。

```ruby
    def increment_access_count(id)
      redis.zincrby "entries/daily/#{Time.zone.today}", 1, id
    rescue SocketError => e
      logger.error e
    end
```

### アクセスランキング取得

Redis の zrevrangebyscore によりスコアの大きい順に 10 個、ID を取得します。
もし取得できなかった場合、 `[]` を返します。
`decorate` で体良く整形して View に渡します。 ((decorate のコードは省略してます))

```ruby
    def access_ranking
      limit = 10
      ids = redis.zrevrangebyscore "entries/daily/#{Time.zone.today}", '+inf', 0, limit: [0, limit]
      if ids.any?
        where(id: ids).order(['field(id, ?)', ids]).limit(limit).decorate
      else
        []
      end
    rescue SocketError => e
      logger.error e
      []
    end
```

以上です。
