---
layout: post
title: Golang Revelフレームワーク ホットデプロイ方法
date: 2015-08-12
category: Go
category: Go
tags:
- Go
---

## 概要

Revel Officialサイトにあるデプロイ方法を検証しました。

[Revel Deployment](https://revel.github.io/manual/deployment.html)

1. ローカルでアプリをビルドしサーバにコピーする
2. サーバーで更新したコードをpullし、ビルド・起動する
3. Heroku を利用しデプロイ管理する



## 1. ローカルビルド

```
# アプリを実行しテストする
$ revel run import/path/to/app

# パッケージ化
$ revel package import/path/to/app
Your archive is ready: app.tar.gz

# 対象マシンへコピー
$ scp app.tar.gz target:/srv/

# ターゲットマシンで起動
$ ssh target
$ cd /srv/
$ tar xzvf app.tar.gz
$ bash run.sh
```

開発しているアーキテクチャと同じ環境へデプロイする場合、
もしくは go インストールを設定し、デフォルトで希望するアーキテクチャへビルドするための唯一の方法です。



## 2. 追加デプロイメント

フルセットアセット付きの静的にリンクされたバイナリが巨大になる可能性があるので、
追加デプロイをサポートしています。

```
# アプリを一時ディレクトリにビルド
$ revel build import/path/to/app /tmp/app

# サーバのhomeディレクトリにその一時ディレクトリにrsync
$ rsync -vaz --rsh="ssh" /tmp/app server

# サーバーに接続しアプリを再起動
...
```

rsyncはsshでのコピーをサポートしているので、以下のように複雑にはなりますがデプロイ可能です。

```
# カスタム証明書、ログイン名、対象ディレクトリを指定しrsync
$ rsync -vaz --rsh="ssh -i .ssh/go.pem" /tmp/myapp2 ubuntu@ec2-50-16-80-4.compute-1.amazonaws.com:~/rsync
```

## 3. サーバでビルド

この方法はバージョンコントロールシステムに依存します。
Goをインストールしているサーバーが必要です。
その代わり、クロスコンパイルを回避することができます。

```
$ ssh server
... install go ...
... configure your app repository ...

# appディレクトリに移動し pullしサーバー起動する
$ cd gocode/src/import/path/to/app
$ git pull
$ revel run import/path/to/app prod
```

## 総評

現在社内では、`1. ローカルビルド` のデプロイ方法を選択しています。

`2. 追加デプロイメント` は、再起動時の瞬断が懸念されます。
大規模アクセスを捌く目的で利用するGoには向いていないと思います。

`3. サーバでビルド` は、運用方法にもよりますが、
本番環境でコンフリクトが起きてしまったらコンパイルもストップしてしまう懸念があります。

`1. ローカルビルド`方法をJenkinsで管理して運用しており
現状特に問題ないです。


Jenkinsの設定等まとめてから公開したいと思います。
