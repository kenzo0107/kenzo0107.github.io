---
layout: post
title: Ruby & gem インストール
date: 2015-10-22
tags:
- Ruby
---

備忘録です。

## 環境
- CentOS 5.8 (Final)

## ruby 2.1.2 インストール

```
# cd /usr/local/src
# wget http://cache.ruby-lang.org/pub/ruby/2.1/ruby-2.1.2.tar.gz
# tar xvfz ruby-2.1.2.tar.gz
# rm ruby-2.1.2.tar.gz
# cd ruby-2.1.2
# ./configure
# make; make install
```

## gem インストール

```
# wget http://production.cf.rubygems.org/rubygems/rubygems-2.2.2.zip
# unzip rubygems-2.2.2.zip
# cd rubygems-2.2.2
# ruby setup.rb
```

以上
