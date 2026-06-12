---
layout: post
title: "Installing Ruby on CentOS 7"
date: 2015-08-06
lang: en
translation_id: install-ruby-on-centos7
permalink: en/2015/08/06/install-ruby-on-centos7/
cover: /img/cover/2015-08-06-install-ruby-on-centos7.svg
tags:
- Ruby
---

## Environment
- AWS
- CentOS Linux release 7.0.1406 (Core)

## Install required modules

```
$ sudo yum -y install git libffi libffi-dev gcc openssl-devel readline-devel zlib-devel
```

## Download rbenv and ruby-build

```
$ git clone https://github.com/sstephenson/rbenv.git ~/.rbenv
$ git clone https://github.com/sstephenson/ruby-build.git ~/.rbenv/plugins/ruby-build
```

## Set the rbenv PATH

```
$ echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bash_profile
$ echo 'eval "$(rbenv init -)"' >> ~/.bash_profile
$ exec $SHELL
$ source ~/.bash_profile
```

```
$ rbenv install -list

Available versions:
   :
   :
  2.0.0-p643
  2.0.0-p645 ← latest 2.0.0 (as of 2015/08/06)
  2.1.0-dev
  2.1.0-preview1
  2.1.0-preview2
  2.1.0-rc1
   :
```

## Install Ruby

```
$ rbenv install -v 2.0.0-p645
```

## Reload

```
$ rbenv rehash
```

## Switch to the installed version

```
$ rbenv global 2.0.0-p645
```

## Verify

```
$ ruby -v
ruby 2.0.0p645 (2015-04-13 revision 50299) [x86_64-linux]
```

That's all.
