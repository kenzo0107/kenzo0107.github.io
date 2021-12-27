---
layout: post
title: CentOSにPHPUnitをComposer.phar経由でインストールする。
date: 2015-05-14
---

## 概要

yum でインストール場合、以下コマンド実行します。

```console
$ sudo yum install php-xml php-pear php-phpunit-PHPUnit --enablerepo=epel
```


yumの場合、既存phpモジュールを上がいて既存環境に影響を与える可能性があります。
その為、composer経由で影響なくインストールする手順を以下にまとめました。


## 手順

{% gist kenzo0107/15bbe40aa6d596feb355 %}
