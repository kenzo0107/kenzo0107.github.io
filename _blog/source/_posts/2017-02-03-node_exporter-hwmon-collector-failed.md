---
layout: post
title: node_expoter error occured ! hwmon collector failed
date: 2017-02-03
tags:
  - Monitoring
  - Prometheus
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170203/20170203141542.png
---

## 概要

Amazon Linux に node_exporter をインストールし起動した所以下のエラーが発生し、起動停止してしまいました。

```sh
ERRO[0007] ERROR: hwmon collector failed after 0.000011s: open /proc/class/hwmon: no such file or directory  source="node_exporter.go:92"
```

### hwmon とは？

> Hard Ware MONitoring. Linux カーネルのセンサーチップから Hard Ware の温度やファン回転数や電圧を取得できる。

環境情報は以下の通りです。

- Amazon Linux AMI release 2016.09
- node_exporter version 0.14.0-rc.1 (branch: master, revision:5a07f4173d97fa0dd307db5bd3c2e6da26a4b16e)

上記エラーですが issue として上がっていました。
そして解決されてました！

{% linkPreview https://github.com/prometheus/node_exporter/pull/427 _blank %}

タイミングが悪かったのかマージされる前の release を取得していた為
このエラーに遭遇していました。

最新のソースは master ブランチしてビルドするのが良さそうです。

以下に Amazon Linux で実施したインストール手順をまとめました。

## 手順

### Golang インストール

以下 Golang オフィシャルサイトにある標準的なインストール方法です。参考にしてください。

{% linkPreview http://kenzo0107.hatenablog.com/entry/2017/02/03/124808 _blank %}

### node_exporter をソースからインストールしビルド

```
$ mkdir -p $GOPATH/src/github.com/prometheus
$ cd $GOPATH/src/github.com/prometheus
$ git clone https://github.com/prometheus/node_exporter
$ cd node_exporter
$ make build

// version 確認
$ ./node_exporter --version
node_exporter, version 0.14.0-rc.1 (branch: master, revision: 428bc92b1c9b38f6de96bceb67bc5d9b3bdcf6e7)
```

### ついでに起動スクリプト

- 事前準備

```
// pid ファイル置き場 作成
$ sudo mkdir -p /var/run/prometheus

// log ファイル置き場 作成
$ sudo mkdir -p /var/log/prometheus

// daemonize インストール
$ cd /usr/local/src
$ sudo git clone https://github.com/bmc/daemonize
$ cd daemonize
$ sudo ./configure
$ sudo make
$ sudo make install

// PATHが通ってなかったらPATHに乗せる
$ sudo cp daemonize /bin/

$ which daemonize
/bin/daemonize
```

- 起動スクリプト作成

```
$ cd /etc/init.d
$ sudo git clone https://gist.github.com/kenzo0107/eebb6c1c06ba04b7073c171580cec445
$ sudo cp eebb6c1c06ba04b7073c171580cec445/node_exporter.init ./node_exporter
$ sudo chmod 0755 node_exporter
```

- 起動

```
$ sudo /etc/init.d/node_exporter start
```

無事エラーなく起動するようになりました ♪
