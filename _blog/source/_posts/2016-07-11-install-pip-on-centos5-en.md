---
layout: post
title: Installing pip on CentOS 5
date: 2016-07-11
categories:
  - [Python]
  - [Infrastructure]
lang: en
translation_id: install-pip-on-centos5
permalink: en/2016/07/11/install-pip-on-centos5/
tags:
  - Python
  - pip
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711114558.jpg
---

CentOS 5 reaches its end of support in March 2017,
but I imagine there are still plenty of servers running it.

## Goal of this article

The goal here is to install Python 2.6 while keeping the default-installed
Python 2.4.3 in place, so that we can use a newer version of pip.

## Add the EPEL repository

```
$ sudo rpm -Uvh http://ftp.iij.ad.jp/pub/linux/fedora/epel/5/x86_64/epel-release-5-4.noarch.rpm
```

## Configure it to avoid upgrading from EPEL during normal updates

```
$ sudo vi /etc/yum.repos.d/epel.repo

[epel]
...
enabled=0
```

## Install python26 from the EPEL repository

```
$ sudo yum install python26 -y --enablerepo=epel
```

## Check the versions

```shell
$ python26 -V
Python 2.6.8

$ python -V
Python 2.4.3
```

We are keeping python26 alongside the existing Python purely so that we can use pip.

## Install pip

```shell
$ wget --no-check-certificate https://bootstrap.pypa.io/ez_setup.py
$ sudo python26 ez_setup.py --insecure
$ sudo easy_install-2.6 pip
```

```
$ pip --version
pip 8.1.2 from /usr/lib/python2.6/site-packages/pip-8.1.2-py2.6.egg (python 2.6)
```
