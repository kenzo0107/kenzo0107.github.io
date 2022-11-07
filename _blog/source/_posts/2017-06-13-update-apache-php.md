---
layout: post
title: Apache 2.2.15 → 2.4.25   PHP 5.6 → 7 へアップデート on CentOS 6.9
date: 2017-06-13
tags:
  - PHP
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170613/20170613223736.jpg
---

## 概要

PHP5 利用していますか？

PHP5.6 のセキュリティサポート期限は `31 Dec 2018` 迄
※ [Supported Versions](http://php.net/supported-versions.php) 参考

Apache/PHP アップデート、腰が重かったのですが
個人契約サーバなら誰にも迷惑かけないしいいか ♪

ということで
放置気味にされた Apache2.2.15/PHP5.6 の個人のサーバを
アップデートすべく実施した内容をまとめました。

## 三行まとめ

- SoftwareCollection を利用し現存 Apache/PHP を残したまま、アップデート版を共存させ切り替え。のち古い Apache/PHP 削除
- 必要モジュール (MySQLi, PHPRedis)インストール
- PHP 7 で廃止された PHP5.6 機能やシンタックスを修正

## SoftwareCollection とは？

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170613/20170613224451.png" width="100%">
</div>

[公式サイト](https://www.softwarecollections.org/en/) によると
以下の様に説明されています。

- 英語

  > Software Collections give you the power to build, install, and use multiple versions of software on the same system, without affecting system-wide installed packages.

- 日本語
  > ソフトウェアコレクションは、システム全体でインストールされたパッケージに影響を与えることなく、同じシステム上に複数のバージョンのソフトウェアを構築、インストール、使用する能力を提供します。

同じシステム上に複数バージョンのソフトウェアをインストールできる様になる、
ということです。

## SoftwareCollection インストール

```
$ sudo yum install centos-release-scl
```

## httpd24 関連のモジュールインストール

```
$ sudo yum-config-manager --enable rhel-server-rhscl-6-rpms
$ sudo yum install httpd24-httpd httpd24-httpd-devel httpd24-mod_proxy_html httpd24-mod_session httpd24-mod_ssl
$ sudo scl enable httpd24 bash
$ sudo service httpd graceful
```

```
$ httpd -v
Server version: Apache/2.4.25 (Red Hat)
Server built:   Apr 12 2017 06:35:50
```

## RHSCL リポジトリ利用可設定

```
$ sudo yum-config-manager --enable rhel-server-rhscl-7-rpms
```

## php7 関連モジュールをインストール

```
# yum install -y scl-utils
# yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
# yum install -y http://rpms.remirepo.net/enterprise/remi-release-7.rpm
# yum install -y php70
# yum install -y php70-php-mysqlnd
# yum install -y php70-php-curl
# yum install -y php70-php-simplexml
# yum install -y php70-php-devel php70-php-gd php70-php-json php70-php-mcrypt php70-php-mbstring php70-php-opcache php70-php-pear php70-php-pecl-apcu php70-php-pecl-geoip php70-php-pecl-imagick php70-php-pecl-json-post php70-php-pecl-memcache php70-php-pecl-xmldiff php70-php-pecl-zip php70-php-pspell php70-php-soap php70-php-tidy php70-php-xml php70-php-xmlrpc
```

## mysqli インストール

```
# yum --enablerepo=remi-php70 install php-mysqli
```

## PHP7 用 phpredis インストール

```
# cd /usr/local/src
# git clone https://github.com/phpredis/phpredis.git
# cd phpredis
# git checkout php7
# phpize
# ./configure
# make
# make install
# echo 'extension=redis.so' > /etc/opt/rh/rh-php70/php.d/redis.ini
```

## php-fpm 再起動

```
# /etc/init.d/php70-php-fpm restart
```

## httpd 再起動

```
# /etc/init.d/httpd24-httpd restart
```

ここまでで PHP7 で動作する環境が整っているかと思います。
エラーログを見ながら修正に当たってください。

## PHP 7 で廃止された構文を修正

### PHP Parse error: syntax error, unexpected 'new' (T_NEW)

- `&= new <クラス名>` の指定が不可となり、 `= new <クラス名>` にする必要があります。

```
&= new Class
↓
= new Class
```

### PHP Fatal error: Cannot use 'String' as class name as it is reserved

- PHP7 では class String, Int と型名の Class を作成できなくなりました。

自分は以下の様に修正しました。
※ 適宜プロジェクトのコーディングルールに則ってご変更ください。

```
class String {
↓
class Stringer {
```

```
class Int {
↓
class Intger {
```

プロジェクトによってはもっと色々出てくると思いますので
適宜修正ください。

## 総評

放置されがちになるミドルウェアのアップデートは小まめにやっておきたいですね。
脆弱性の定期的な棚卸しせねば

業務でアップデートするのであれば
アップデートする環境を別途用意してアップデートする、
そこでミドルウェア、アプリケーションのコードレベルでのアップデート手順をまとめ
本番環境で実施。

機能(url)毎に正しく動いたものだけプロキシで PHP7 へ流す
というのもアリかなと思います。

以上です。

## 参考

- [PHP 5.6.x から PHP 7.0.x への移行](http://php.net/manual/ja/migration70.php)
- [PHP5.6 から PHP ７にアップデートする上で気をつけるコト](https://itpropartners.com/blog/9235/)
