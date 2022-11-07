---
layout: post
title: PHP+OpenSSLバージョンアップ
date: 2016-02-23
tags:
  - PHP
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160222/20160222184453.jpg
---

## 概要

ベリトランスモジュールのバージョンアップに際して
<font color='red'>2016 年以内に</font>SSL v3.0/TLS 1.0 無効化処理が必須となりました。

世界的なセキュリティ対策の一環として必須事項なので
ベリトランス以外の決済も、また決済以外でもシステムの対策必須です。

[Google、SSL 3.0 の脆弱性「POODLE」を公表、SSL 3.0 は今後サポート廃止の意向](http://internet.watch.impress.co.jp/docs/news/20141015_671482.html)

EC-CUBE でベリトランスの決済モジュールでは
PHP から OpenSSL ライブラリを利用して決済へ通信を実施しています。

その PHP の OpenSSL ライブラリを 1.0.1i 以上(最新が推奨)に
バージョンアップする必要があります。

対応する ToDo としては以下になります。

> TLS1.1 以上を利用するには openssl 1.0.1i 以上を利用する必要アリ
> → openssl バージョンアップ (1.0.1i 以上)
> → PHP の再コンパイルし OpenSSL ライブラリ(1.0.1i 以上)をバージョンアップ

上記対応をまとめました。

※ Apache の SSL v3.0/TLS1.0 利用不可設定は別途
ググればすぐ出てきます ♪

## 環境

- CentOS release 6.6 (Final)
- PHP 5.3.9
- openssl 1.0.1g

## 手順

### PHP で利用している OpenSSL のライブラリバージョン確認

これから PHP をコンパイルし直すので
OpenSSL support が disable でも問題ないです。

※今回では既にインストール済みであるというケースを想定しています。

```
# php -i | grep OpenSSL

OpenSSL support => enabled
OpenSSL Library Version => OpenSSL 1.0.1g  28 Jan 2016
OpenSSL Header Version => OpenSSL 1.0.1g  28 Jan 2016
OpenSSL support => enabled
```

PHP でで利用される OpenSSL Library, Header Version が `1.0.1g` であることが確認できました。

### 既存 openssl バックアップ

既にインストール済みかと思いますので
現行バージョンを一旦退避します。

```
# openssl version
1.0.1g

# which openssl
/usr/local/bin/openssl

// 名前変更でバックアップとして残す
# mv /usr/local/bin/openssl /usr/local/bin/openssl1.0.1g
```

何か不具合が発生した場合にまきもどせるように、念のためバックアップをとりました。

## openssl バージョンアップ

ソースからビルドします。

```
# cd /usr/local/src
# wget http://www.openssl.org/source/openssl-1.0.2f.tar.gz
# tar xzvf openssl-1.0.2f.tar.gz
# cd openssl-1.0.2f
# ./config --prefix=/usr/local shared -fPIC
# make
# make install
```

-fPIC は 動的共有オブジェクト(DSO)として mod_ssl をビルドし
PHP のバイナリ実行ファイルからフックして利用する為に必要、
と言ったところでしょうか。

## openssl バージョンアップ確認

正しくバージョンアップされていることを確認しました。

```
# openssl version

OpenSSL 1.0.2f  28 Jan 2016
```

## PHP 再コンパイル

- 既存 PHP がどのように configure されているか確認

```
# php -i | grep config

Configure Command =>  './configure'  '--enable-mbstring' '--enable-zend-multibyte' '--with-mysql' '--with-mysqli' '--enable-mbregex' '--with-gd' '--with-jpeg-dir=/usr/lib' '--with-png-dir=/usr/lib' '--with-freetype-dir=/usr/lib' '--with-zlib-dir' '--with-libdir=lib64' '--enable-soap' '--with-apxs2=/etc/httpd/bin/apxs' '--with-openssl=/usr/local'
```

`--with-openssl` がない場合は上記のように追加します。
今回は既に指定済みです。

上記の conigure 情報を利用して
--with-openssl があることを確認した上で
再コンパイルします。

- 再コンパイル

```
# cd /usr/local/src/php-5.3.9
# ./configure --enable-mbstring --enable-zend-multibyte --with-mysql --with-mysqli --enable-mbregex --with-gd --with-jpeg-dir=/usr/lib --with-png-dir=/usr/lib --with-freetype-dir=/usr/lib --with-zlib-dir --with-libdir=lib64 --enable-soap --with-apxs2=/etc/httpd/bin/apxs --with-openssl=/usr/local
# make
# make install
```

以下のようなエラーが出る場合は、手順)「openssl バージョンアップ」をご確認下さい。
新たに openssl をソースからコンパイルしてビルドしたときなどに出るエラーです。

```
configure: error: Cannot find OpenSSL's <evp.h>
```

## PHP で利用する OpenSSL ライブラリのバージョン確認

```
# php -i | grep OpenSSL

OpenSSL support => enabled
OpenSSL Library Version => OpenSSL 1.0.2f  28 Jan 2016
OpenSSL Header Version => OpenSSL 1.0.2f  28 Jan 2016
OpenSSL support => enabled
```

OpenSSL Library, Header Version が共に指定通りとなりました。

以上です。
