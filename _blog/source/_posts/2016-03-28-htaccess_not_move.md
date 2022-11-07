---
layout: post
title: .htaccessが効かない、動かないときの対処
date: 2016-03-28
tags:
  - .htaccess
  - Apache
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160408/20160408141839.jpg
---

## 概要

.htaccess に設定した通りに動作しない、そもそも読み込んでいないように見える場合の対策です。

http だと mod_rewrite でリダイレクトするけど、 https だとしない、とか
ありがちな設定ミスパターンは以下基本的なことを確認して解決できます。

## 検証環境

- CentOS 6.6 (Final)
- Apache/2.2.15(Unix)

## そもそも .htaccess を利用するには

`/etc/httpd/conf/httpd.conf` 等設定ファイル内で以下の記述が必要です。

```
AllowOverride All
```

## mod_rewrite を利用するには

利用頻度の多い mod_rewrite を利用するには以下が必要です。

#### 1. mod_rewrite.so インストール

#### 2. mod_rewrite.so を Apache 設定ファイルからロード

まずは上記の確認です。

## 1. mod_rewrite.so インストール確認

Apache の場合、大抵 modles ディレクトリ以下に格納されてます。

```sh
$ ls -al /etc/httpd/modules/mod_rewrite.so
-rwxr-xr-x 1 root root 60464 10月 16 23:49 2014 /etc/httpd/modules/mod_rewrite.so
```

## 2. mod_rewrite.so を Apache 設定ファイルからロードされているか確認

Apache 設定ファイル
`/etc/httpd/conf/httpd.conf` や `/etc/httpd/conf.d/*.conf` で以下を設定している。

※環境によっては `/etc/httpd/conf/httpd.conf` に設定ファイルを置いてない場合もあるので
　あくまで一般的な例とします。

```sh
LoadModule rewrite_module modules/mod_rewrite.so
```

## 補足

モジュール読み込み設定は大抵、
以下のように <Directory> ディレクティブ で AllowOverride All が設定されているかと思います。

以下例では「/var/www/html」ディレクトリ以下では 配置した .htaccess を優先して設定されることになります。

```sh
<Directory "/var/www/html">
    AllowOverride All
    Options -Indexes FollowSymLinks Includes ExecCGI
    Order allow,deny
    Allow from all
</Directory>
```

万が一 mod_rewrite.so モジュールが存在しない場合は Apache の再コンパイルが必要になります。

## Apache に mod_rewrite をインストールしリコンパイル

- リコンパイルして Apache 再起動します。

```sh
$ sudo su -
# cd <path to httpd source>
# ./configure –enable-ssl=shared –enable-rewrite –enable-deflate –enable-headers –enable-so
# make & make install
# service httpd restart
```

以上です。
