---
layout: post
title: Elasticsearch curatorで不要Indexをまとめて削除
date: 2015-11-13
tags:
- Elasticsearch
---

## 概要

fluentd + ElasticSearch + kibana を運用していますが
ある日ElasticSearchが動作しなくなる事象が発生しました。

過去indexが溜まりに溜まってメモリ不足というエラー。

logはS3にアップロードしているし、
不要なIndexは適宜削除して対策しました。

## 環境

- CentOS Linux release 7.0.1406 (Core)
- ElasticSearch 1.7.1
- Python 2.7.5
- pip 7.1.0




## curator インストール

- ElasticSearchをインストールしているサーバにて以下実施

```
# pip install curator
```

## curator コマンド実行

- ElasticSearchをインストールしているサーバにて以下実施

```
# 14日(2週間)経過でclose
curator --host localhost close indices --prefix logstash --older-than 14 --time-unit days --timestring %Y.%m.%d

# 35日(4週間)経過でdelete
curator --host localhost delete indices --prefix logstash --older-than 35 --time-unit days --timestring %Y.%m.%d

# 2日経過でbloom filter無効化
curator --host localhost bloom indices --prefix logstash --older-than 2 --time-unit days --timestring %Y.%m.%d
```

上記をjenkinsで [SSH plugin](https://wiki.jenkins-ci.org/display/JENKINS/SSH+plugin) で
リモートサーバにログインして実行するよう、
設定して定期ポーリングで1日1回実行させてます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151112/20151112142836.png" width="100%">
</div>

以上
