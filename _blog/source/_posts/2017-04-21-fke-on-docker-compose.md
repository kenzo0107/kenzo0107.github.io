---
layout: post
title: docker-compose で開発環境構築 〜Nginx アクセスログ(ltsv) を fluentd + elasticsearch + kibana で可視化〜
date: 2017-04-21
tags:
- Docker
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170421/20170421221055.png
---


## 概要

前回構築した Vagrant 環境上で docker-compose による開発環境構築をします。

{% linkPreview http://kenzo0107.hatenablog.com/entry/2017/04/13/225610 _blank %}

今回は前回の続きで Nginx のアクセスログを Elasticsearch + Fluentd + Kibana で可視化してみます。
アプリ

## 簡単構築手順

```
macOS% $ git clone https://github.com/kenzo0107/vagrant-docker
macOS% $ cd vagrant-docker
macOS% $ vagrant up
macOS% $ vagrant ssh
vagrant% $ cd /vagrant/nginx-efk

// -d デタッチモードでないのは各コンテナの起動状況がログで見える為です。
vagrant% $ docker-compose up
...
...
```

## docker-compose 構成

Git にまとめています。

{% linkPreview https://github.com/kenzo0107/vagrant-docker/tree/master/docker/nginx-efk _blank %}

```
├── docker-compose.yml
├── fluentd
│   ├── conf
│   │   ├── conf.d
│   │   │   └── nginx.log.conf
│   │   └── fluent.conf
│   └── Dockerfile
└── nginx
    └── conf
        └── nginx.conf
```

### ポイント
* nginx のログ格納場所を `volume` 指定しホスト側とシンク。 それを fluentd 側でも `volume` 指定し tail するようにしました。

以下のようなイメージです。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170421/20170421221055.png" width="100%">
</div>

## ブラウザから Nginx 起動確認

ブラウザから `http://192.168.35.101/` にアクセスすると
Nginx の Welcome ページが確認できます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170421/20170421222343.png" width="100%">
</div>


先程の `docker-compose up` 後に以下のようなログが見え
fluentd が Nginx アクセスログを捕まえているのがわかります。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170421/20170421222937.png" width="100%">
</div>

## Kibana にアクセス

ブラウザから `http://192.168.35.101:5601` にアクセスすると
Kibana ページが表示されます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170421/20170421223008.png" width="100%">
</div>

1.  Index name or pattern
    - fluentd-* 指定

2. Time-field name
    - @timestamp 指定

3. Create ボタン押下

4. レフトメニューから `Discover` クリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170421/20170421223626.png" width="100%">
</div>

## macOS からログ確認

当然ながら macOS と vagrant とシンクしているので
macOS 上からもログが tail できます。

```
macOS%$ tail -f <path/to/vagrant-docker>/docker/nginx-efk/_log/nginx/access.log
```

以上です。
参考になれば幸いです。
