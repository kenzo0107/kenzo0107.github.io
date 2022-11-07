---
layout: post
title: CentOS5 系 に pip インストール
date: 2016-07-11
tags:
  - Python
  - pip
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711114558.jpg
---

2017 年 3 月にサポート終了する CentOS5 ですが
今なお利用されているサーバは多々あるかと思います。

## 今回の目的

デフォルトインストールされている Python 2.4.3 を残した状態で
Python 2.6 をインストールし、pip の上位バージョンを利用できるようにする、
ことを目的とします。

## EPEL リポジトリ追加

```
$ sudo rpm -Uvh http://ftp.iij.ad.jp/pub/linux/fedora/epel/5/x86_64/epel-release-5-4.noarch.rpm
```

## 通常アップデートで EPEL からアップグレードするのを避ける様設定

```
$ sudo vi /etc/yum.repos.d/epel.repo

[epel]
...
enabled=0
```

## EPEL リポジトリから python26 インストール

```
$ sudo yum install python26 -y --enablerepo=epel
```

## バージョン確認

```shell
$ python26 -V
Python 2.6.8

$ python -V
Python 2.4.3
```

あくまで python26 は pip を利用するようにする為に共存させています。

## pip インストール

```shell
$ wget --no-check-certificate https://bootstrap.pypa.io/ez_setup.py
$ sudo python26 ez_setup.py --insecure
$ sudo easy_install-2.6 pip
```

```
$ pip --version
pip 8.1.2 from /usr/lib/python2.6/site-packages/pip-8.1.2-py2.6.egg (python 2.6)
```
