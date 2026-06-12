---
layout: post
title: Detecting Slow Queries, Analyzing Them with EXPLAIN, and Notifying Slack
date: 2016-08-24
categories:
  - [Database]
  - [Infrastructure]
lang: en
translation_id: detect-slowquery-to-slack
permalink: en/2016/08/24/detect-slowquery-to-slack/
tags:
  - Monitoring
  - MySQL
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160824/20160824165806.png
---

This is a follow-up to [Notifying Slack of error logs with fluentd](http://kenzo0107.hatenablog.com/entries/2015/09/24).

{% linkPreview https://kenzo0107.github.io/2015/09/23/2015-09-24-errorlog-to-slack/ _blank %}

## Overview

I set this up so that I could check the slow query status of a MySQL DB server
in real time on Slack.

## Environment

- CentOS 6.5
- td-agent 0.12.26

## Installing the Fluent Plugins

Install the modules required this time.

```sh
# td-agent-gem install fluent-plugin-nata2
# td-agent-gem install fluent-plugin-mysql_explain
# td-agent-gem install fluent-plugin-sql_fingerprint
```

- fluent-plugin-nata2

  - Strips out `SET timestamp` in advance and also retains information about the DB being accessed
  - [https://github.com/studio3104/fluent-plugin-nata2]

- fluent-plugin-mysql_explain

  - Retrieves the EXPLAIN execution result for the `sql` attribute of the JSON obtained by `in_mysqlslowquery_ex`
  - [https://github.com/kikumoto/fluent-plugin-mysql_explain]
    [https://github.com/kikumoto/fluent-plugin-sql_fingerprint]

- fluent-plugin-sql_fingerprint
  - Masks the parameters of the SQL
  - [https://github.com/kikumoto/fluent-plugin-sql_fingerprint]

## Installing the Percona Toolkit

Install the fingerprint tool used by fluent-plugin-sql_fingerprint.

```sh
# rpm -Uhv http://www.percona.com/downloads/percona-release/percona-release-0.0-1.x86_64.rpm
# yum install -y percona-toolkit-2.2.5-2.noarch
```

## Creating the fluentd Configuration File

Let's configure the following file.

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

*Change the slow query path, the DB access account, and so on to match your own environment.

## Restarting td-agent

```
# service td-agent restart
```

## Verification

Issue a slow query and check whether it gets notified to Slack.

- We sleep for 3 seconds so that it exceeds the `long-query-time` threshold (in seconds) configured in my.cnf.

```
mysql > SELECT count(*), sleep(3) FROM <table>;
```

- Checking the Slack notification

It was notified to Slack!

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160824/20160824172320.png" width="100%">
</div>

When you click "show more", you can see that the EXPLAIN result is also notified.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160824/20160824172810.png" width="100%">
</div>

## Wrap-up

Real-time notifications were especially effective during new development.

Also, accumulating the data in ElasticSearch and analyzing it along a time axis is interesting, since you can see the correlation with site events.

You start to see the slow queries that occur depending on the environment and the situation.

That's all.
