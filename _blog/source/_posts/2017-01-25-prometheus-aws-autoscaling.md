---
layout: post
title: Node Exporter 構築手順 + Prometheus からAWSオートスケール監視
date: 2017-01-25
tags:
  - Monitoring
  - Prometheus
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125144719.png
---

## 概要

前回 [Prometheus Server 構築](https://kenzo0107.hatenablog.com/entry/2017/01/20/233312)しました。

{% linkPreview https://kenzo0107.hatenablog.com/entry/2017/01/20/233312 _blank %}

今回は 監視対象サーバで Node Exporter 構築を実施します。

## 今回やること 3 行まとめ

- Node Exporter インストール
- Node Exporter 起動スクリプト作成
- Node Exporter 起動し Prometheus Server からモニタリング

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125144719.png" width="100%">
</div>

## 環境

- CentOS Linux release 7.1.1503 (Core)

## Node Exporter インストール

- パッケージインストール

```
$ cd /usr/local/src
$ sudo wget https://github.com/prometheus/node_exporter/releases/download/v0.14.0-rc.1/node_exporter-0.14.0-rc.1.linux-amd64.tar.gz
$ sudo tar -C /usr/local -xvf node_exporter-0.14.0-rc.1.linux-amd64.tar.gz
$ cd /usr/local
$ sudo mv node_exporter-0.14.0-rc.1.linux-amd64 node_exporter
```

- シンボリックリンク作成

```
$ sudo ln -s /usr/local/node_exporter/node_exporter /bin/node_exporter

$ node_exporter --version
node_exporter, version 0.14.0-rc.1 (branch: master, revision: 5a07f4173d97fa0dd307db5bd3c2e6da26a4b16e)
  build user:       root@ed143c8f2fcd
  build date:       20170116-16:00:03
  go version:       go1.7.4
```

## Node Exporter 起動

とりあえず起動するならこれだけ

```
$ sudo node_exporter
```

[http://node_exporter_server:9100/metrics](http://node_exporter_server:9100/metrics) にアクセスし
取得できる node_exporter で取得しているサーバのメトリクス情報が確認できます。

Prometheus 同様、Node Exporter も起動スクリプトを作成しそこで起動管理をします。

## 起動スクリプト作成

- Node Exporter 起動スクリプト

```
$ sudo cat << 'EOF' | sudo tee /usr/lib/systemd/system/node_exporter.service
[Unit]
Description=Node Exporter

[Service]
Type=simple
ExecStart=/bin/node_exporter
PrivateTmp=false

[Install]
WantedBy=multi-user.target
EOF
```

- 起動設定

```
$ sudo systemctl daemon-reload
$ sudo systemctl enable node_exporter.service
$ sudo systemctl start node_exporter.service
$ sudo systemctl status node_exporter.service -l
```

## アクセスしてみる

[http://node_exporter_server:9100/metrics](http://node_exporter_server:9100/metrics) にアクセスします。

以下のように表示されていれば Node Exporter 起動成功です。

<div style="text-align:center;">
<img src="http://i.imgur.com/Z4Juj0i.png" width="100%">
</div>

## Prometheus から監視

今回は AWS EC2 インスタンスで起動中の node_exporter によるメトリクス取得設定です。

※ 監視実施サーバに `AmazonEC2ReadOnlyAccess` をアタッチしたロール設定をする必要があります。
<span style="color: #ff5252">※ 監視対象サーバに 監視対象サーバから `9100 ポート` へアクセスできるようにセキュリティグループ設定します。 </span>

- /usr/local/prometheus-server/prometheus.yml 編集

以下設定は region 指定しアクセス権のある Instance のメトリクスを取得します。

```yml
# my global config
global:
  scrape_interval:     15s
  evaluation_interval: 15s

  external_labels:
      monitor: 'codelab-monitor'

rule_files:
  # - "first.rules"
  # - "second.rules"

scrape_configs:
  - job_name: 'prometheus'

    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    ec2_sd_configs:
      - region: ap-northeast-1
        access_key: ********************
        secret_key: ****************************************
        port: 9100
```

#### タグで監視対象を絞る

全インスタンスを監視であれば上記で問題ありません。

ですが、監視対象をある程度条件で絞りたいケースがあります。
そんな時、Prometheus では `relabel_configs` でインスタンスの設定タグで絞る方法があります。

- インスタンスのタグ設定

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125144948.png" width="100%">
</div>

- prometheus.yml 設定

```yml
# my global config
global:
  scrape_interval:     15s
  evaluation_interval: 15s

  external_labels:
      monitor: 'codelab-monitor'

rule_files:
  # - "first.rules"
  # - "second.rules"

scrape_configs:
  - job_name: 'prometheus'

    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    ec2_sd_configs:
      - region: ap-northeast-1
        access_key: ********************
        secret_key: ****************************************
        port: 9100
    relabel_configs:
      - source_labels: [__meta_ec2_tag_Stage]
        regex: production
        action: keep
      - source_labels: [__meta_ec2_tag_Role]
        regex: web
        action: keep
```

- prometheus.yml 編集後、再起動

```
$ sudo systemctl restart prometheus.service
```

## Prometheus から node_exporter 起動したサーバを監視できているか確認

[http://prometheus_server:9090/consoles/node.html](http://prometheus_server:9090/consoles/node.html)

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125153144.png" width="100%">
</div>

`Up : Yes` となっている Node のリンクをクリックすると CPU, Disck のグラフが確認できます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125154033.png" width="100%">
</div>

次回は 監視対象で [Alertmanager 構築](https://kenzo0107.github.io/2017/02/02/2017-02-02-prometheus-alertmanager)します。

## 参照

{% linkPreview https://www.robustperception.io/automatically-monitoring-ec2-instances/ _blank %}
