---
layout: post
title: Prometheus2.0 remote storage 検証
date: 2016-08-10
tags:
- Prometheus
thumbnail: https://i.imgur.com/zFciewX.png
---

いよいよ出ました Prometheus 2.0 ！

[Announcing Prometheus 2.0 | Prometheus](https://prometheus.io/blog/2017/11/08/announcing-prometheus-2-0/)




先日[モニタリング勉強会](https://mackerel-ug.connpass.com/event/68478/)でも Paul Taylor さんの LT を拝聴させて頂き
パフォーマンス向上とストレージフォーマット変更による圧縮・バックアップがしやすくなった等、
良い話がたくさん出ていました。

[Operating Prometheus](https://www.slideshare.net/PaulTraylor/20171027-81281205)


中でも最も期待していた機能が Remote Long-Term Storage、
長期保存機能には歓喜しました♪

1系以下では、短期間用と長期間用の Prometheus を別途用意する等、対策が必要で
冗長な作りを余儀なくされたところがありましたが
2.0 リリースでついに！

早速試してみたく使用感をまとめました。


## 今回やりたかったことまとめ

* Prometheus 2.0 リリースに際して期待の長期保存機能 (Remote long-term storage) を早速試す！
* 実際にローカル環境で構築してみて1系からの変更箇所を確認
* DB 側にどんなデータが入るのか確認

## システム概要

あくまで使用感の検証をしたかったので docker-compose でお手軽に作れる環境にしました。

<div style="text-align:center;">
<img src="https://i.imgur.com/zFciewX.png" width="100%">
</div>

## 前提条件

以下を Vagrant にインストール

* Ubuntu 16.04.3 LTS \n \l
* Docker version 17.09.0-ce, build afdb6d4
* docker-compose version 1.12.0, build b31ff33

## 起動する Docker Container

* Prometheus 2.0.0
* Node Exporter 0.15.1
* AlertManager 0.9.1
* cAdvisor 0.28.0
* Prometheu Adapter
* PostgreSQL 9.6.3
* Grafana 4.6.1
* Nginx 1.13.6
* Adminer

## 使い方

以下手順通りです。

[kenzo0107/vagrant-docker/tree/vagrant-docker-ubuntu16.04/docker/prometheus-grafana-on-ubuntu](https://github.com/kenzo0107/vagrant-docker/tree/vagrant-docker-ubuntu16.04/docker/prometheus-grafana-on-ubuntu)

```sh
macOS%$ git clone https://github.com/kenzo0107/vagrant-docker
macOS%$ cd vagrant-docker
macOS%$ vagrant up

// Install docker, docker-compose
macOS%$ vagrant provision
macOS%$ vagrant ssh
vagrant%$ cd /vagrant/prometheus-grafana-on-ubuntu
vagrant%$ sudo docker-compose up -d

Name                             Command                            State                             Ports
-------------------------------------------------------------------------------------------------------------------------------------
adapter                           /prometheus-postgresql-ada ...    Up
adminer                           entrypoint.sh docker-php-e ...    Up                                8080/tcp
alertmanager                      /bin/alertmanager -config. ...    Up                                9093/tcp
cadvisor                          /usr/bin/cadvisor -logtost ...    Up                                8080/tcp
grafana                           /run.sh                           Up                                3000/tcp
nginx                             nginx -g daemon off;              Up                                0.0.0.0:18080->18080/tcp,
                                                                                         0.0.0.0:3000->3000/tcp, 80/tcp,
                                                                                         0.0.0.0:8080->8080/tcp,
                                                                                         0.0.0.0:9090->9090/tcp
node-exporter                     /bin/node_exporter                Up                                9100/tcp
pgsql                             docker-entrypoint.sh -csyn ...    Up                                5432/tcp
prometheus                        /bin/prometheus --config.f ...    Up                                9090/tcp
```

## アクセスしてみる

### Prometheus

* [http://192.168.35.101:9090](http://192.168.35.101:9090).

<div style="text-align:center;">
<img src="https://i.imgur.com/rg53Xa1.png" width="100%">
</div>

### Grafana

* [http://192.168.35.101:13000](http://192.168.35.101:13000).
* ユーザアカウントが `./grafana/env` にあります.

```sh
GF_SECURITY_ADMIN_USER=admin-user
GF_SECURITY_ADMIN_PASSWORD=admin-pass
```

<div style="text-align:center;">
<img src="https://i.imgur.com/fDXVySw.png" width="100%">
</div>

* Datasource 設定

<div style="text-align:center;">
<img src="https://i.imgur.com/8SKvdxJ.png" width="100%">
</div>

Datasource 設定フォームに以下情報を入力し `Add` ボタンをクリックします。

| *Item* | *Value*                |
| ------ | ---------------------- |
| Name   | Prometheus             |
| Type   | Prometheus             |
| URL    | http://prometheus:9090 |
| Access | proxy                  |

<div style="text-align:center;">
<img src="https://i.imgur.com/6Cr4WTn.png" width="100%">
</div>

* Dashboard.json インポート

<div style="text-align:center;">
<img src="https://i.imgur.com/cew58vF.png" width="100%">
</div>

グラフが表示されます。

<div style="text-align:center;">
<img src="https://i.imgur.com/IicXL5e.png" width="100%">
</div>


### cAdvisor

* [http://192.168.35.101:8080](http://192.168.35.101:8080).

<div style="text-align:center;">
<img src="https://i.imgur.com/ZDH3zmI.png" width="100%">
</div>

## Adminer

<div style="text-align:center;">
<img src="https://i.imgur.com/uWT7sDC.png" width="100%">
</div>

ログインフォームに以下情報を入力します。

| *Item*   | *Value*    |
| -------- | ---------- |
| Server   | pgsql      |
| Username | prometheus |
| Password | password   |
| Database | postgres   |

* PostgreSQL に保存されているメトリクス情報が確認できます。

PostgreSQL >> pgsql >> postgres >> prometheus >> Select: metrics

<div style="text-align:center;">
<img src="https://i.imgur.com/cyPrvqC.png" width="100%">
</div>


## AlertManager でアラート通知してみる

例として node-exporter を停止

```
vagrant%$ sudo docker-compose stop node-exporter
```

`./alertmanager/config.yml` で設定した Slack Channel にちゃんと通知がきました。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171113/20171113021331.png" width="100%">
</div>


## 所感

* 2.0 になって設定の仕方が諸々変わり、公式サイトじっくり見る必要あります。
    * と思ったら、早速まとめ出てました！ありがとうございます！
        - [Prometheus 2.0 の変更点と移行](https://qiita.com/tkusumi/items/293174826a8a5d47d186)

* 今回は Prometheus ×1 台構成ですが、2台以上で冗長化する構成も試してみたい。

## 余談

* バグなのか google/cadvisor で検出するメトリクスが重複表示されて grafana で絞るのに困りました。
    * Issue これ？
        - [Inconsistent container metrics in prometheus route #1704](https://github.com/google/cadvisor/issues/1704)


## あとがき

Mackerel の様なマネージドな監視サービスで運用コストを削減する以上に
Prometheus をマネージドすれば、さらにトータルコストを抑えられる様になる、
と睨んでます。

ですが、Datadog は APM 付きプランも適度なコスト感で提供しておりマネージドサービスの魅力は尚大きいです。

モニタリングの棲み分けをできる様にするにも、
選択肢の一つにするにも Prometheus 挑戦しがいがあるのでは？
と思っています。

Prometheus、今後さらに広まることを期待しています。

## 参考

* [Configuration | Prometheus](https://prometheus.io/docs/prometheus/2.0/configuration/configuration/)
* [prometheus/config/testdata/conf.good.yml](https://github.com/prometheus/prometheus/blob/release-2.0/config/testdata/conf.good.yml)
