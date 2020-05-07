---
layout: post
title: Prometheus でサーバ監視
date: 2017-01-20
tags:
- Monitoring
- Prometheus
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125140715.png
---

## 概要

以前 Ansible + Vagrant でPrometheusモニタリング環境構築について書きました。

{% linkPreview http://kenzo0107.hatenablog.com/entry/2016/06/21/003544 _blank %}


今回は具体的によくある設定ユースケースを順追って設定していきます。

1. [Prometheus Server 構築](http://kenzo0107.github.io/2017/01/20/2017-01-20-prometheus-monitoring)
2. [監視対象で Node Exporter 構築](http://kenzo0107.github.io/2017/01/25/2017-01-25-prometheus-aws-autoscaling)
3. [Alertmanager 構築](http://kenzo0107.github.io/2017/02/02/2017-02-02-prometheus-alertmanager)

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125134654.png" width="100%">
</div>

## 今回やること 3行まとめ

- Prometheus Server モジュールインストール
- Prometheus Server 起動スクリプト作成
- Prometheus Server 起動し自身のサーバモニタリング

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125140715.png" width="100%">
</div>

Prometheus の設定ファイルについては
全体像を理解した後が良いと思いますので
Node Exporter の設定の後に実施したいと思います。

## 環境

- CentOS Linux release 7.3.1611 (Core)

## Prometheus インストール

- パッケージインストール
[最新のバージョン](https://github.com/prometheus/prometheus/releases)をチェックしダウンロードしてください。

```
$ cd /usr/local/src
$ sudo wget https://github.com/prometheus/prometheus/releases/download/v1.4.1/prometheus-1.4.1.linux-amd64.tar.gz
$ sudo tar -C /usr/local -xvf prometheus-1.4.1.linux-amd64.tar.gz
$ cd /usr/local
$ sudo mv prometheus-1.4.1.linux-amd64 prometheus-server
```

- シンボリックリンク作成

```
$ sudo ln -s /usr/local/prometheus-server/prometheus /bin/prometheus
$ sudo ln -s /usr/local/prometheus-server/promtool /bin/promtool

$ prometheus --version
prometheus, version 1.4.1 (branch: master, revision: 2a89e8733f240d3cd57a6520b52c36ac4744ce12)
  build user:       root@e685d23d8809
  build date:       20161128-09:59:22
  go version:       go1.7.3

$ promtool version
promtool, version 1.4.1 (branch: master, revision: 2a89e8733f240d3cd57a6520b52c36ac4744ce12)
  build user:       root@e685d23d8809
  build date:       20161128-09:59:22
  go version:       go1.7.3
```

## Prometheus 起動

とりあえず起動するならこれだけ

```
$ sudo prometheus -config.file=/usr/local/prometheus-server/prometheus.yml
```

ただ↑これを毎回実行するのは辛いので起動スクリプトを作成して
サーバ再起動時に自動起動したり
`systemctl start ...` と実行したい。

## 起動スクリプト作成

- Prometheus オプションファイル作成

```
$ cat << 'EOF' > /usr/local/prometheus-server/option
OPTIONS="-config.file=/usr/local/prometheus-server/prometheus.yml -web.console.libraries=/usr/local/prometheus-server/console_libraries -web.console.templates=/usr/local/prometheus-server/consoles"
EOF
```

- Prometheus 起動スクリプト

```
$ sudo cat << 'EOF' | sudo tee /usr/lib/systemd/system/prometheus.service
[Unit]
Description=Prometheus Service
After=syslog.target prometheus.service

[Service]
Type=simple
EnvironmentFile=-/usr/local/prometheus-server/option
ExecStart=/bin/prometheus $OPTIONS
PrivateTmp=false

[Install]
WantedBy=multi-user.target
EOF
```

- 起動設定

```
$ sudo systemctl daemon-reload
$ sudo systemctl enable prometheus.service
$ sudo systemctl start prometheus.service
$ sudo systemctl status prometheus.service -l
```

## アクセスしてみる

`<IP Address>:9090` にアクセスします。
以下のように表示されていれば Prometheus 起動成功です。

![Imgur](http://i.imgur.com/1gchGrW.png)

オプション設定でも設定した、 `/usr/local/prometheus-server/consoles` の各htmlにもアクセスしてみてください。

`<IP Address>:9090/consoles/prometheus-overview.html?instance=localhost%3a9090`

<div style="text-align:center;">
<img src="http://i.imgur.com/1gchGrW.png" width="100%">
</div>

次回は [監視対象で Node Exporter 構築](http://kenzo0107.github.io/2017/01/25/2017-01-25-prometheus-aws-autoscaling) します。
