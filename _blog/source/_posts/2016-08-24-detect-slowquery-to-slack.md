---
layout: post
title: SlowQuery を検知して Explain で解析し Slack へ通知
date: 2016-08-24
tags:
  - Monitoring
  - MySQL
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160824/20160824165806.png
---

[fluentd でエラーログを Slack へ通知](http://kenzo0107.hatenablog.com/entries/2015/09/24) の続きです。

{% linkPreview https://kenzo0107.github.io/2015/09/23/2015-09-24-errorlog-to-slack/ _blank %}

## 概要

MySQL DB サーバ の SlowQuery 状況を
リアルタイムに Slack で確認できるようにする為に導入しました。

## 環境

- CentOS 6.5
- td-agent 0.12.26

## Fluent Plugin インストール

今回必要モジュールをインストールします。

```sh
# td-agent-gem install fluent-plugin-nata2
# td-agent-gem install fluent-plugin-mysql_explain
# td-agent-gem install fluent-plugin-sql_fingerprint
```

- fluent-plugin-nata2

  - SET timestamp をあらかじめ除外しアクセスしている DB 情報も保持してくれる
  - [https://github.com/studio3104/fluent-plugin-nata2]

- fluent-plugin-mysql_explain

  - in_mysqlslowquery_ex で取得した JSON の sql 属性に EXPLAIN 実行結果を取得
  - [https://github.com/kikumoto/fluent-plugin-mysql_explain]
    [https://github.com/kikumoto/fluent-plugin-sql_fingerprint]

- fluent-plugin-sql_fingerprint
  - SQL のパラメータにマスクをする
  - [https://github.com/kikumoto/fluent-plugin-sql_fingerprint]

## Percona Tool Kit インストール

fluent-plugin-sql_fingerprint で利用する fingersprint をインストールします。

```sh
# rpm -Uhv http://www.percona.com/downloads/percona-release/percona-release-0.0-1.x86_64.rpm
# yum install -y percona-toolkit-2.2.5-2.noarch
```

## fluentd 設定ファイル作成

以下ファイル設定するとします。

- /etc/td-agent/conf.d/mysql.conf

```
<source>
  type mysqlslowquery_ex
  read_from_head
  path /var/lib/mysql/mysql-slow.log
  pos_file /var/log/td-agent/mysql-slow.pos
  tag mysqld.slow_query.bp
  last_dbname_file /tmp/slowquery.log.lastdb
</source>

<filter mysqld.slow_query.**>
  type record_transformer
  <record>
    hostname ${hostname}
  </record>
</filter>

<filter mysqld.slow_query.**>
  type     mysql_explain
  host     127.0.0.1
  port     3306
  database <DB_NAME>
  username <DB_USER>
  password <DB_PASSWORD>
  sql_key  sql
  added_key explain
</filter>

<filter mysqld.slow_query.**>
  type sql_fingerprint
  fingerprint_tool_path /usr/bin/pt-fingerprint
</filter>

<match mysqld.slow_query.**>

  type copy

  <store>
    type slack
    webhook_url <Slack Webhook URL>
    channel <Slack Channel>
    username xxx DB1 [MySQL] Slow Query
    icon_emoji :ghost:
    color danger
    message "*[User]* %s\r\n *[Host]* %s\r\n *[Query Time]* %s\r\n *[Lock Time]* %s\r\n *[Rows sent]* %s\r\n *[Rows Examined]* %s\r\n *[SQL]* %s \r\n *[Explain]* %s \r\n"
    message_keys user,host,query_time,lock_time,rows_sent,rows_examined,fingerprint,explain
    flush_interval 1m
  </store>

</match>
```

※slowquery のパス、DB のアクセスアカウントなどは各環境により変更してください。

## td-agent 再起動

```
# service td-agent restart
```

## 確認

SlowQuery を発行し、Slack に通知されるか確認します。

- 3 秒 sleep させ、my.cnf に設定されている long-query-time の閾値の秒数を超えるようにしています。

```
mysql > SELECT count(*), sleep(3) FROM <table>;
```

- Slack 通知確認

Slack に通知されました！

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160824/20160824172320.png" width="100%">
</div>

show more をクリックすると Explain が通知されているのがわかる。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160824/20160824172810.png" width="100%">
</div>

## 総評

リアルタイム通知は
特に新規開発時に効果的でした。

また
ElasticSearch へ蓄積し時間軸で分析するのは
サイトのイベントとの相関性が見え面白いです。

その環境と状況により発生するスロークエリが見えてきます。

以上です。
