---
layout: post
title: How to Hot-Deploy the Golang Revel Framework
date: 2015-08-12
lang: en
translation_id: go-revel-fw-hotdeploy
permalink: en/2015/08/21/go-revel-fw-hotdeploy/
cover: /img/cover/2015-08-21-go-revel-fw-hotdeploy.svg
category: Go
tags:
  - Go
---

## Overview

I tried out the deployment methods listed on the official Revel site.

[Revel Deployment](https://revel.github.io/manual/deployment.html)

1. Build the app locally and copy it to the server
2. Pull the updated code on the server, then build and start it
3. Use Heroku to manage the deployment

## 1. Local Build

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

This is the only way to deploy to an environment with the same architecture you develop on, or to configure your Go installation to build for the desired architecture by default.

## 2. Incremental Deployment

Since a statically linked binary bundled with the full asset set can become huge, incremental deployment is also supported.

```
# アプリを一時ディレクトリにビルド
$ revel build import/path/to/app /tmp/app

# サーバのhomeディレクトリにその一時ディレクトリにrsync
$ rsync -vaz --rsh="ssh" /tmp/app server

# サーバーに接続しアプリを再起動
...
```

Because rsync supports copying over ssh, you can deploy as follows, although it gets a bit more involved.

```
# カスタム証明書、ログイン名、対象ディレクトリを指定しrsync
$ rsync -vaz --rsh="ssh -i .ssh/go.pem" /tmp/myapp2 ubuntu@ec2-50-16-80-4.compute-1.amazonaws.com:~/rsync
```

## 3. Build on the Server

This method depends on a version control system. You need a server with Go installed. In return, you can avoid cross-compilation.

```
$ ssh server
... install go ...
... configure your app repository ...

# appディレクトリに移動し pullしサーバー起動する
$ cd gocode/src/import/path/to/app
$ git pull
$ revel run import/path/to/app prod
```

## Summary

Internally we currently use the `1. Local Build` deployment method.

With `2. Incremental Deployment`, the momentary disconnect on restart is a concern. I don't think it's well suited to Go, which we use to handle large-scale access.

With `3. Build on the Server`, depending on how you operate it, there is a concern that compilation could stop if a conflict occurs in the production environment.

We manage and operate the `1. Local Build` method with Jenkins, and so far we haven't run into any particular problems.

Once I've organized the Jenkins configuration and so on, I'd like to publish it.
