---
layout: post
title: Datadog Agent 6系にアップデートして Logging 機能を試す！
date: 2018-01-10
tags:
- Datadog
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180110/20180110145104.png
---

Datadog Agent 6系にアップデートして Logging 機能を試す！

2017年末にβ版ですが、Datadog の Log 可視化ツールの利用が発表されました。

* Unifying the views でグラフの高負荷時刻付近のログを参照する機能があったり
* Elasticsearch+Fluentd の代替として期待できそう

と思い早速導入してみました。

## datadog-agent インストール方法

2018年1月10日時点では 5系がインストールされます。

## 5系、6系とで主に変わった点

* Datadog 設定ファイルパス変更

|                    | *5系*                           | *6系*                                  |
| ------------------ | ------------------------------- | -------------------------------------- |
| ベースディレクトリ | /etc/dd-agent                   | /etc/datadog-agent                     |
| 各種設定ファイル   | /etc/dd-agent/conf.d/nginx.yaml | /etc/dd-agent/conf.d/nginx.d/conf.yaml |
| メトリクス情報     | dd-agent info                   | datadog-agent status                   |

6系では dd-agent コマンドがありませんでした。

* dd-agent configcheck に該当するコマンドが見当たらない？
どこにあるのか教えてください(;>_<)

## 5系からのアップグレード方法

https://github.com/DataDog/datadog-agent/blob/master/docs/beta.md


自身の環境は Ubuntu 16.04.2 LTS だったので以下方法でアップグレードしました。

```sh
$ DD_UPGRADE=true bash -c "$(curl -L https://raw.githubusercontent.com/DataDog/datadog-agent/master/cmd/agent/install_script.sh)"

...
Error: /etc/datadog-agent/datadog.yaml seems to contain a valid configuration, run the command again with --force or -f to overwrite it
Automatic import failed, you can still try to manually run: datadog-agent import /etc/dd-agent /etc/datadog-agent
```

Error と出るので一瞬ハッとしましたが、Error Message をよく見ると
6系の `/etc/datadog-agent/datadog.yaml` は問題ない設定となっている様に見えますが、上書きしたい場合は --force を使ってね、
とあります。

datadog-agent のアップグレードは無事完了していました。

```sh
$ sudo datadog-agent status

Getting the status from the agent.

===================
Agent (v6.0.0-rc.2)
===================
...
...
```

また各種設定(/etc/datadog-agent/conf.d, checks.d)ファイルも問題なく移行できていました。


## 5系の設定ファイルを 6系へオーバーライド

特に上記の手法で問題ないですが強制的にオーバーライドする方法を明記しておきます。

```sh
// /etc/dd-agent/conf.d 以下のファイルを 6系へ移行
$ /opt/datadog-agent/bin/agent/agent import /etc/dd-agent /etc/datadog-agent --force

Success: imported the contents of /etc/dd-agent/datadog.conf into /etc/datadog-agent/datadog.yaml
Copied conf.d/http_check.yaml over the new http_check.d directory
Copied conf.d/network.yaml over the new network.d directory
Copied conf.d/nginx.yaml over the new nginx.d directory
Copied conf.d/process.yaml over the new process.d directory
Copied conf.d/process_check.yaml over the new process_check.d directory
Copied conf.d/ssl_check_expire_days.yaml over the new ssl_check_expire_days.d directory
Copied conf.d/unicorn_check.yaml over the new unicorn_check.d directory
Error: unable to list auto_conf files from /etc/dd-agent: open /etc/dd-agent/conf.d/auto_conf: no such file or directory

// /etc/dd-agent/checks.d/ 以下のファイルを 6系へ移行
$ sudo -u dd-agent -- cp /etc/dd-agent/checks.d/*.py /etc/datadog-agent/checks.d/
```

## nginx log を Logging へ送付

- `/etc/datadog-agent/conf.d/nginx.d/conf.yaml`

```yml
init_config:

instances:
  - nginx_status_url: http://localhost/nginx_status/

logs:
  - type: file
    service: hogehoge
    path: /var/log/nginx/access.log
    source: nginx
    sourcecategory: nginx_access

  - type: file
    service: hogehoge
    path: /var/log/nginx/error.log
    source: nginx
    sourcecategory: nginx_error
```

基本的に logs ディレクティブを記述することで OK

- `/etc/datadog-agent/conf.d/fluentd.d/conf.yaml`

```yml
init_config:

instances:
    -  monitor_agent_url: http://localhost:24220/api/plugins.json
       tag_by: type

logs:
    - type: file
      service: hogehoge
      path: /var/log/td-agent/td-agent.log
      source: td-agent
      sourcecategory: td-agent
```

## datadog.conf 修正

`/etc/datadog-agent/datadog.yaml` に以下設定を加えます。

```
log_enabled: true
```


## 設定反映

```
$ sudo systemctl restart datadog-agent
```

## うまく Datadog に反映されないときは

ログを見てみます。

```
$ sudo tail -f /var/log/datadog/agent.log

...
2018-01-07 11:01:58 JST | INFO | (logs-agent.go:75 in func1) | open /var/log/nginx/access.log: permission denied
...
```

パーミッションエラーが発生しており
`datadog-agent` を起動している `dd-agent` ユーザからアクセスできない状態となっていました。

### 対処

単純に `/var/log/nginx/access.log` に 0644 (-rw-r--r--) を付与するだけでなく、
logrotate で生成される新たな log のパーミッションにも注意します。

```
/var/log/nginx/*.log {
        daily
        missingok
        rotate 14
        compress
        delaycompress
        notifempty
        create 0644 www-data adm
        sharedscripts
        prerotate
                if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
                        run-parts /etc/logrotate.d/httpd-prerotate; \
                fi \
        endscript
        postrotate
                invoke-rc.d nginx rotate >/dev/null 2>&1
        endscript
}
```

元々 0640 でしたが 0644 で生成するようにしました。
これにて解決♪

## Datadog Logging で確認

ログが流れてくるのを確認できました。
Kibana の Discover ページのような作りです。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180110/20180110155520.png" width="100%">
</div>

今後フィルタリングしてグラフを作ったりできたりしてくるのか、
Pro版なら無料で使わせてもらえないかな、
なんて期待が高まっております

お願い、Datadog さん(-人-)
