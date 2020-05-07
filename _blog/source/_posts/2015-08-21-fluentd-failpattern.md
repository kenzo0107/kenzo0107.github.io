---
layout: post
title: fluentd設定ハマった所あるある
date: 2015-08-21
tags:
- Fluentd
---

以下随時追加。

## 環境

- CentOS Linux release 7.1.1503 (Core)
- Fluentd 0.12.12
- Nginx 1.8.0


## Permission denined

- パーミッションエラー！

```
# tail -f /var/log/td-agent/td-agent.log

2015-08-19 14:17:14 +0900 [error]: Permission denied @ xxxxxxx - /var/log/nginx/error.log
  2015-08-19 14:17:14 +0900 [error]: suppressed same stacktrace
```

### 対策

td-agent実行ユーザを`root`に変更する。

```
$ sudo vim /etc/init.d/td-agent

- TD_AGENT_USER=td-agent
- TD_AGENT_GROUP=td-agent

+ TD_AGENT_USER=root
+ TD_AGENT_GROUP=root
```

デーモンリロード

```
sudo systemctl daemon-reload
```

### 動作確認

以下のように`tail`が正しく実行できていることが確認できます。

```
# tail -f /var/log/td-agent/td-agent.log

2015-08-19 14:17:15 +0900 [info]: following tail of /var/log/nginx/access.log
2015-08-19 14:17:15 +0900 [info]: following tail of /var/log/nginx/error.log
```


## [warn]: pattern not match

これかなりハマりました。

Nginxのlogを流すときに以下のようにfomatするように書かれている記事を多く見たので
設定してみたらエラー発生(; >_<)

- /etc/td-agent/td-agent.conf

```
<source>
  type tail
  format nginx
  path /var/log/nginx/access.log
  pos_file /var/log/td-agent/nginx-access.pos
  tag nginx.access
</source>
```

### 対策

以下のように修正

- /etc/td-agent/td-agent.conf

```
<source>
  type tail
  format /^(?<remote>[^ ]*) (?<host>[^ ]*) (?<user>[^ ]*) \[(?<time>[^\]]*)\] "(?<method>\S+)(?: +(?<path>[^ ]*) +\S*)?" (?<code>[^ ]*) (?<size>[^ ]*)(?: "(?<referer>[^\"]*)" "(?<agent>[^\"]*)" "(?<forwarder>[^\"]*)")?/
  time_format %d/%b/%Y:%H:%M:%S %z
  path /var/log/nginx/access.log
  pos_file /var/log/td-agent/nginx-access.pos
  tag nginx.access
</source>
```

td-agent再起動

```
$ sudo systemctl restart td-agent
```

これで大丈夫。

## buffer_path 重複

```
[error]: failed to configure sub output redshift: Other '' plugin already use same buffer_path: type = , buffer_path = *
```

元々の設定は以下の様にしていました。
td-agent の送信先にトラブルがあり buffer が溜まり重複しエラーとなっていました。

```
buffer_path /logs/td-agent/nginx/logs
```

例）以下の様な tag があった場合、buffer_path は同じく `/logs/td-agent/nginx/logs` となってしまう

hogehoge.20170101.log
hogehoge.20170102.log

### 対策

tag_parts を用い、以下の様に tag 毎に buffer_path をユニークにすることで解決

```
buffer_path /logs/td-agent/nginx/logs_${tag_parts[0]}_${tag_parts[1]}
```


引き続き何か発生したら追記していきます。
