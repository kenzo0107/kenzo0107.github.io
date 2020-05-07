---
layout: post
title: Redis - (error) NOAUTH Authentication required への対応
date: 2015-12-12
tags:
- Redis
---

## 概要

経年運用し特にメモリも問題なかったRedisが突如接続エラーが発生したので
その際の対応をまとめました。

## エラー内容

```
PHP Fatal error:  Uncaught exception 'RedisException' with message 'Failed to AUTH connection'
```

認証接続に失敗して Exception になっている。

Redisの設定周りで特にrequirepass を設定していないし
何故突然？という感じでした。

各環境でRedisの設定パスは異なると思いますが、自環境の場合以下です。
/etc/redis/6379.conf

以下のようにrequirepassはコメントアウトされている。

```
# requirepass
```


## 対応

- process を kill する
※ `service redis restart` のように redisを再起動しても状況は変わりませんでした。

```
# ps aux | grep 'redis' | grep -v 'grep'

root     12743  0.1  0.2  40604  2124 ?        Ssl  10:50   0:00 /usr/local/bin/redis-server *:6379
```

- 再度 redis を起動させる。
```
# service redis start
```

- requirepass 設定

運用中でアプリケーション自体のソースをいじりたくなかったので
空のrequirepass を設定しました。

```
redis-cli> CONFIG SET REQUIREPASS ''
```

上記で取り急ぎ対応は問題なかったです。

## 総評

改めて利用する際には
認証設定をしてアプリケーションからも
passwordを指定して接続する仕組みが良いですね。

ただ何故急に発生したかは引き続き調査をしていきます。

理由がわかる方はコメントなどいただけましたら幸いです。
