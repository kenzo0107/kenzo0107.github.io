---
layout: post
title: docker build 時に Text file busy で shell が実行できない対策
date: 2018-04-18
tags:
- Docker
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180418/20180418215217.jpg
---

## 概要

Dockerfile 内に以下のように shell の実行を記述していました。

```
RUN chmod +x hoge.sh \
  && hoge.sh
```

上記記述のある状態で `docker build` 実行した所、以下のようなエラーに遭遇しました。

```
/bin/sh: hoge.sh: Text file busy
```

## What is Text file busy ?

書き込みのために現在開いている手続きのみの (共用テキスト) ファイルを実行しようとした場合や、実行中の手続きのみのファイルを書き込みのために開こうとしたり、削除しようとしたりする場合に発生します。

上記鑑みると
`chmod +x hoge.sh` 実行中に `hoge.sh` を実行しようとしたが為に発生しているということ？？
と推測。

## 環境情報

* Ubuntu 14.04.5 LTS \n \l
* Docker version 17.05.0-ce, build 89658be
* Base Image: ruby:2.5-alpine

## 対策

以下 sync 処理を追加し無事問題解決できました。

```
RUN chmod +x hoge.sh \
  && sync \
  && hoge.sh
```


## What is sync command ?

{% linkPreview http://kazmax.zpp.jp/cmd/s/sync.8.html _blank %}



## 参考

{% linkPreview https://github.com/moby/moby/issues/9547#issuecomment-77547893 _blank %}

{% linkPreview https://qiita.com/todanano/items/05570fac310d56758888 _blank %}
