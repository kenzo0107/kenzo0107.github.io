---
layout: post
title: 3分で出来る！ AWS EC2(CentOS7)に td-agent2インストール
date: 2015-09-19
tags:
- Fluentd
- Slack
---

## 環境
- AWS EC2
- CentOS Linux release 7.1.1503 (Core)

## td-agent2 インストール

```
$ sudo curl -L http://toolbelt.treasuredata.com/sh/install-redhat-td-agent2.sh | sh
```

## 起動/サービス登録

```
$ sudo systemctl start td-agent
$ sudo chkconfig td-agent on
```

`systemctl enable`するとchkconfig使ってと怒られます。

```
$ sudo systemctl enable td-agent

td-agent.service is not a native service, redirecting to /sbin/chkconfig.
Executing /sbin/chkconfig td-agent on
The unit files have no [Install] section. They are not meant to be enabled
using systemctl.
Possible reasons for having this kind of units are:
1) A unit may be statically enabled by being symlinked from another unit's
   .wants/ or .requires/ directory.
2) A unit's purpose may be to act as a helper for some other unit which has
   a requirement dependency on it.
3) A unit may be started when needed via activation (socket, path, timer,
   D-Bus, udev, scripted systemctl call, ...).
[root@ip-172-31-19-253 log]#

```

## 試験

設定ファイル (/etc/td-agent/td-agent.conf)を見ると
デフォルト設定では、
`httpプロトコル`で`port:8888`からLoggingしtd-agent.log(/var/log/td-agent/td-agent.log)に流すようにしています。

```
# HTTP input
# POST http://localhost:8888/<tag>?json=<json>
# POST http://localhost:8888/td.myapp.login?json={"user"%3A"me"}
# @see http://docs.fluentd.org/articles/in_http
<source>
  type http
  port 8888
</source>

## live debugging agent
<source>
  type debug_agent
  bind 127.0.0.1
  port 24230
</source>
```

以下のようにコマンドを実行してtd-agent.logを確認してみる。

```
$ curl -X POST -d 'json={"json":"TEST!!"}' http://localhost:8888/debug.test

$ sudo tail -f /var/log/td-agent/td-agent.log

2015-09-19 17:34:50 +0900 debug.test: {"json":"TEST!!"}
```

上記のように正しくロギングされていることが確認できました。
