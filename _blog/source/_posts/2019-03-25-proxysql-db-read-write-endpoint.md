---
layout: post
title: ProxySQL で DB の Read/Write Endpoint スイッチング
date: 2019-03-25
tags:
- ProxySQL
---

docker-compose 上で ProxySQL で primary DB と secondary DB への SQL 毎にアクセス先をスイッチングする環境を構築し、試験してみました。

[kenzo0107/proxysql-mysql-group-replication](https://github.com/kenzo0107/proxysql-mysql-group-replication)

## ProxySQL とは？

ProxySQL はハイパフォーマンスな MySQL の SQL プロキシです。

MySQLのフォークである Percona Server や MariaDB だけでなく、Galera Cluster にも対応しています。

## 今回やってみようと思ったのは

今回注目したのは ProxySQL の SQL プロキシの機能です。

ProxySQL は SQL によって、Read/Write エンドポイントをスイッチングしてくれます。

<!-- more -->

* SELECT なら Read エンドポイントへ
* INSERT, UPDATE, DELETE なら Write エンドポイントへ



という感じです。

## 使おうと思った経緯

Rails に関わらず、アプリケーション側の問題で、Read/Write のスイッチングができない場合があります。


* Rails で特定の gem に依存して switch_point が効かないところがあるとか。。
* 独自フレームワークで DB 側の処理が複雑すぎて手が出せないとか。。



なまじっか、サービスが成長していくと、アプリケーション側で DB のスイッチングができないことが、直接的に DB のボトルネックへ繋がることになりかねません。

この解決の為に ProxySQL を利用しようと思いました。

## 実際に試してみる。

冒頭のリポジトリを `git clone` して `docker-compose up` して頂ければ、起動します。

README の通りに実施してみてください。


* UPDATE で primary DB へ
* SELECT で secondary DB へ



アクセスしているのがわかります。

## TODO


* Rails 等フレームワークで Transaction 処理がどう扱われるか調査



むしろここが肝心ですね。すでにお調べいただいている方、ご教示くださいましたら幸いです。

以上
参考になれば幸いです。
