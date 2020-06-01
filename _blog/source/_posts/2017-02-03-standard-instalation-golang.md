---
layout: post
title: 標準的な Golang インストール方法
date: 2017-02-03
category: Go
tags:
- Go
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170203/20170203124749.png
---


## 概要

Golang オフィシャルサイトに書かれているそのままです。

{% linkPreview https://golang.org/doc/install#install _blank %}

他 Golang 関連記事説明の為に、また、備忘録として記述します。

## 環境

- CentOS Linux release 7.3.1611 (Core)

## 手順

[Golang Official - Downloads](https://golang.org/dl/) から環境に合わせ
最新バージョンをインストールすることをお勧めします。

- ソースからビルド

```
$ cd /usr/local/src
$ sudo wget https://storage.googleapis.com/golang/go1.7.5.linux-amd64.tar.gz
$ sudo tar -C /usr/local -xzf go1.7.5.linux-amd64.tar.gz
```

- PATH設定

```
$ sudo cat << 'EOF' | sudo tee /etc/profile.d/golang.sh
export GOPATH=$HOME/go
export PATH=$PATH:/usr/local/go/bin
EOF

$ sudo cp /etc/profile.d/golang.sh /etc/profile.d/golang.csh

$ source /etc/profile
```

- 確認

```
$ go version

go version go1.7.5 linux/amd64
```

以上で Golang のインストール完了です。
