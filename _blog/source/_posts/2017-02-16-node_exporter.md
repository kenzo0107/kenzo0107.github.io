---
layout: post
title: node_exporter シェルでクエリ自作
date: 2017-02-16
tags:
  - Monitoring
  - Prometheus
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170216/20170216225748.png
---

## 概要

node_expoter のオプション `--collector.textfile.directory` で指定したディレクトリに `*.prom` という拡張子を配置することで
そこに記述したメトリクス情報を prometheus server が読み取ってくれます。

この `*.prom` ファイルを一定時間毎に更新すればメトリクスが自作できる、というものです。

## 手順

- node_exporter 自体のインストール・セットアップは以下ご参照ください。

{% linkPreview http://kenzo0107.hatenablog.com/entry/2017/01/25/154144 _blank %}

上記手順では以下に node_exporter を配置しています。
環境によって適宜書き換えてください。

```
/usr/local/node_exporter/node_exporter
```

## text_collector ディレクトリ作成

```
$ cd /usr/local/node_exporter
$ mkdir text_collector
```

## shell 作成

今回は httpd の process count のメトリクス追加することとします。

- /usr/local/node_exporter/text_collector/httpd.sh 作成

{% gist kenzo0107/cf245d3ba1d2f0faea7f0134414a8c81 %}

## cron 設定

```
# node_exporter httpd 5分毎更新
*/5 * * * * /usr/local/node_exporter/text_collector/httpd.sh
```

## httpd.prom 作成確認

- /usr/local/node_exporter/text_collector/httpd.prom

```
node_httpd_count 24
```

上記の `node_httpd_count` がメトリクス名になります。

## node_expoter 再起動

以下のようにディレクトリ指定します。

```
node_expoter --collector.textfile.directory /usr/local/node_exporter/text_collector
```

## 作成したメトリクスを指定し確認する。

無事できました！

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170216/20170216225202.png" width="100%">
</div>

これを利用してるとシェル芸で色々事足りることもあります ♪

一助になれば何よりです。
