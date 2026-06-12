---
layout: post
title: Upgrading Apache 2.2.15 → 2.4.25 and PHP 5.6 → 7 on CentOS 6.9
date: 2017-06-13
lang: en
translation_id: update-apache-php
permalink: en/2017/06/13/update-apache-php/
tags:
  - PHP
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170613/20170613223736.jpg
---

## Overview

Are you still using PHP5?

The security support for PHP5.6 ends on `31 Dec 2018`.
* See [Supported Versions](http://php.net/supported-versions.php) for reference.

I had been reluctant to update Apache/PHP, but since it's a personally contracted server, it won't bother anyone, so why not ♪

So I put together a summary of what I did to update a personal server running the neglected Apache2.2.15/PHP5.6.

## Three-Line Summary

- Using SoftwareCollection, I kept the existing Apache/PHP in place while letting the updated versions coexist, then switched over. Afterwards, I removed the old Apache/PHP.
- Installed the required modules (MySQLi, PHPRedis).
- Fixed PHP5.6 features and syntax that were removed in PHP 7.

## What is SoftwareCollection?

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170613/20170613224451.png" width="100%">
</div>

According to the [official site](https://www.softwarecollections.org/en/), it is described as follows.

- English

  > Software Collections give you the power to build, install, and use multiple versions of software on the same system, without affecting system-wide installed packages.

- Japanese
  > ソフトウェアコレクションは、システム全体でインストールされたパッケージに影響を与えることなく、同じシステム上に複数のバージョンのソフトウェアを構築、インストール、使用する能力を提供します。

In other words, it lets you install multiple versions of software on the same system.

## Installing SoftwareCollection

```
$ sudo yum install centos-release-scl
```

## Installing httpd24-related modules

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

## Enabling the RHSCL repository

```
$ sudo yum-config-manager --enable rhel-server-rhscl-7-rpms
```

## Installing php7-related modules

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

## Installing mysqli

```
# yum --enablerepo=remi-php70 install php-mysqli
```

## Installing phpredis for PHP7

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

## Restarting php-fpm

```
# /etc/init.d/php70-php-fpm restart
```

## Restarting httpd

```
# /etc/init.d/httpd24-httpd restart
```

At this point, you should have an environment that runs on PHP7. Make your fixes while watching the error logs.

## Fixing syntax removed in PHP 7

### PHP Parse error: syntax error, unexpected 'new' (T_NEW)

- The `&= new <class name>` notation is no longer allowed; you need to change it to `= new <class name>`.

```
&= new Class
↓
= new Class
```

### PHP Fatal error: Cannot use 'String' as class name as it is reserved

- In PHP7, you can no longer create classes whose names are type names such as `String` or `Int`.

I fixed mine as follows.
* Please change them as appropriate according to your project's coding rules.

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

Depending on the project, many more issues may come up, so please fix them as needed.

## Wrap-up

It's something you want to keep on top of regularly: updating middleware, which tends to get neglected. I really need to take stock of vulnerabilities on a regular basis.

If you're doing the update as part of your job, it might be a good idea to prepare a separate environment for the update, perform the update there, summarize the update procedure at both the middleware and application code level, and then carry it out in the production environment.

Another viable approach would be to route only the features (URLs) that have been confirmed to work correctly to PHP7 via a proxy, on a per-feature basis.

That's all.

## References

- [Migrating from PHP 5.6.x to PHP 7.0.x](http://php.net/manual/ja/migration70.php)
- [Things to watch out for when upgrading from PHP5.6 to PHP 7](https://itpropartners.com/blog/9235/)
