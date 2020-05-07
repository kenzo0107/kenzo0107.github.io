---
layout: post
title: Alertmanager 構築手順
date: 2017-02-02
tags:
- Monitoring
- Prometheus
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170202/20170202095647.png
---

## 概要

前回 [Node Exporter 構築](http://kenzo0107.hatenablog.com/entry/2017/01/25/154144)しました。

{% linkPreview https://kenzo0107.hatenablog.com/entry/2017/01/25/154144 _blank %}

今回は監視実施サーバで Alertmanager 構築を実施します。

## 今回やること 3行まとめ

- Alertmanager インストール & 起動スクリプト作成
- Prometheus 通知条件設定
- Alertmanager でSlack通知

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170202/20170202095647.png" width="100%">
</div>

## Alertmanager の役割

アラートのレベルによって通知先をどの程度の頻度で送信するかを管理します。
あくまで、通知先の管理をします。

実際のアラート条件の設定は Prometheus Server でします。

## 環境

- CentOS Linux release 7.3.1611 (Core)

## Alertmanager インストール

- パッケージインストール

```
$ cd /usr/local/src
$ sudo wget https://github.com/prometheus/alertmanager/releases/download/v0.5.1/alertmanager-0.5.1.linux-amd64.tar.gz
$ sudo tar -C /usr/local -xvf alertmanager-0.5.1.linux-amd64.tar.gz
$ cd /usr/local
$ sudo mv alertmanager-0.5.1.linux-amd64 alertmanager
```

- シンボリックリンク作成

```
$ sudo ln -s /usr/local/alertmanager/alertmanager /bin/alertmanager

$ alertmanager --version

alertmanager, version 0.5.1 (branch: master, revision: 0ea1cac51e6a620ec09d053f0484b97932b5c902)
  build user:       root@fb407787b8bf
  build date:       20161125-08:14:40
  go version:       go1.7.3
```

## Alert 通知先設定

以下 Slack へ通知設定です。

```
$ cd /usr/local/alertmanager
$ git clone https://gist.github.com/kenzo0107/71574c2d4d70ba7a9efaa88b4ff1be1b
$ mv 71574c2d4d70ba7a9efaa88b4ff1be1b/alertmanager.yml .
```

- alertmanager.yml

slack  通知箇所を適宜変更して下さい。

{% gist kenzo0107/71574c2d4d70ba7a9efaa88b4ff1be1b %}

## Alertmanager 起動

とりあえず起動するならこれだけ

```
$ sudo alertmanager -config.file alertmanager.yml
```

`http://alertmanager_server:9093/#/alerts` にアクセスすると以下のような画面が表示されます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170126/20170126194507.png" width="100%">
</div>


Prometheus 同様、Alertmanager も起動スクリプトを作成しそこで起動管理をします。

## 起動スクリプト作成

- オプションファイル作成

```
$ cat << 'EOF' > /usr/local/alertmanager/option
OPTIONS="-config.file /usr/local/alertmanager/alertmanager.yml"
EOF
```

- Alertmanager 起動スクリプト

```
$ sudo cat << 'EOF' | sudo tee /usr/lib/systemd/system/alertmanager.service
[Unit]
Description=Prometheus alertmanager Service
After=syslog.target prometheus.alertmanager.service

[Service]
Type=simple
EnvironmentFile=-/usr/local/alertmanager/option
ExecStart=/bin/alertmanager $OPTIONS
PrivateTmp=false

[Install]
WantedBy=multi-user.target
EOF
```

- 起動設定

```
$ sudo systemctl daemon-reload
$ sudo systemctl enable alertmanager.service
$ sudo systemctl start alertmanager.service
$ sudo systemctl status alertmanager.service -l
```

## アラート通知条件設定

アラート通知条件は Prometheus Server 側で設定します。

[Prometheus Official - ALERTING RULES](https://prometheus.io/docs/alerting/rules/)

サンプルとして以下設定します。

```
$ cd /usr/local/prometheus-server
$ cat << 'EOF' > alerts.rules

# インスタンスに 5分以上(FOR) アクセスできない場合(IF up == 0)
# severity = "critical" とラベル付けし通知
ALERT InstanceDown
  IF up == 0
  FOR 5m
  LABELS { severity = "critical" }
  ANNOTATIONS {
    summary = "Instance {{ $labels.instance }} down",
    description = "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 5 minutes.",
  }

// Prometheus 設定ファイルチェック
$ promtool check-config prometheus.yml

Checking prometheus.yml
  SUCCESS: 1 rule files found

Checking alerts.rules
  SUCCESS: 1 rules found
```

## Prometheus Server でAlertmanager URL設定

Prometheus の起動オプションで Alertmanager URL 設定します。
```
-alertmanager.url=http://localhost:9093
```

```
$ cd /usr/local/prometheus-server
$ cat << 'EOF' > option
OPTIONS="-config.file=/usr/local/prometheus-server/prometheus.yml -web.console.libraries=/usr/local/prometheus-server/console_libraries -web.console.templates=/usr/local/prometheus-server/consoles -alertmanager.url=http://localhost:9093"
EOF

// Prometheus 再起動
$ sudo systemctl restart prometheus.service
```

#### 注意

今回 Alertmanager は Prometheus Server と同サーバ上に設定しているので
```
http://localhost:9093
```
となっていますが、ドメインが異なる場合は適宜設定してください。

## Prometheus Alerts ページアクセス

設定した通知条件が表示されています。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170126/20170126195628.png" width="100%">
</div>

## 通知試験

監視対象サーバの node_exporter を停止してみます。

```
$ sudo systemctl stop node_exporter
```

すると...

Slack に通知が届きました！

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170126/20170126200326.png" width="100%">
</div>


`http://alertmanager_server:9093/#/alerts` にアクセスすると通知内容一覧が表示されます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170126/20170126200742.png" width="100%">
</div>

以上で簡単ながら
Prometheus からリモートサーバを監視しアラート通知するところまでを
まとめました。



1. [Prometheus でサーバ監視](http://kenzo0107.hatenablog.com/entry/2017/01/20/233312)
2. [Node Exporter 構築手順 + Prometheus からAWSオートスケール監視](http://kenzo0107.hatenablog.com/entry/2017/01/25/154144)
3. [Alertmanager 構築手順](http://kenzo0107.hatenablog.com/entry/2017/02/02/101011)


## 補足

### フロントエンド
Grafana 3.x以降でデフォルトプラグインで Prometheus をサポートしていたりと
Prometheus のフロントは Grafana が導入しやすく相性が良かったです。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170202/20170202100116.png" width="100%">
</div>

メトリクスを自作したり、Prometheus 独自のクエリを駆使して
様々なメトリクス監視が実現できます。

### My alerts.rules

{% gist kenzo0107/6bca3225abd763ed4ec614dbaaec2c00 %}

### Learning

改めて自身で構築してみて
Line Casual Talks #1, #2 を見直すと非常に理解が深まると思います。

- [Prometheus Casual Talks #1を開催しました](http://d.hatena.ne.jp/wyukawa/20160615/1465962814)

一助になれば何よりです。

以上です。
ご静聴ありがとうございました。
