---
layout: post
title: Install latest Git on CentOS.
date: 2016-02-23
tags:
  - git
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160223/20160223122153.png
---

## Environment Information

- CentOS release 6.6 (Final)

## Install required modules

```
# yum -y install curl-devel expat-devel gettext-devel openssl-devel zlib-devel perl-ExtUtils-MakeMaker
```

## Compile & Install

Please access the below url, get latest archive.
[Official Repository](https://www.kernel.org/pub/software/scm/git/)

```
# cd /usr/local/src
# wget https://www.kernel.org/pub/software/scm/git/git-2.7.2.tar.gz
# tar xvf git-2.7.2.tar.gz
# cd git-2.7.2
# make prefix=/usr/local all
# make prefix=/usr/local install
```

## Show git version.

```
# git --version

git version 2.7.2
```

Thank.
