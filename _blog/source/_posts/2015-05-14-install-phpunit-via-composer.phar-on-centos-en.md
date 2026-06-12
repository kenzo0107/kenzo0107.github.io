---
layout: post
title: Installing PHPUnit on CentOS via Composer.phar
date: 2015-05-14
category: Infrastructure
lang: en
translation_id: install-phpunit-via-composer.phar-on-centos
permalink: en/2015/05/14/install-phpunit-via-composer.phar-on-centos/
cover: /img/cover/2015-05-14-install-phpunit-via-composer.phar-on-centos.svg
---

## Overview

To install with yum, run the following command.

```console
$ sudo yum install php-xml php-pear php-phpunit-PHPUnit --enablerepo=epel
```


With yum, your existing php modules may get overwritten, which can affect your current environment.
For that reason, I have summarized below the steps to install via composer without any such impact.


## Steps

{% gist kenzo0107/15bbe40aa6d596feb355 %}
