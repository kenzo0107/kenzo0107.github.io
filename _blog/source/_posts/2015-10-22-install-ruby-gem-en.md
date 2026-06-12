---
layout: post
title: Installing Ruby & gem
date: 2015-10-22
category: Infrastructure
lang: en
translation_id: install-ruby-gem
permalink: en/2015/10/22/install-ruby-gem/
cover: /img/cover/2015-10-22-install-ruby-gem.svg
tags:
- Ruby
---

Just a memo for myself.

## Environment
- CentOS 5.8 (Final)

## Installing ruby 2.1.2

```
# cd /usr/local/src
# wget http://cache.ruby-lang.org/pub/ruby/2.1/ruby-2.1.2.tar.gz
# tar xvfz ruby-2.1.2.tar.gz
# rm ruby-2.1.2.tar.gz
# cd ruby-2.1.2
# ./configure
# make; make install
```

## Installing gem

```
# wget http://production.cf.rubygems.org/rubygems/rubygems-2.2.2.zip
# unzip rubygems-2.2.2.zip
# cd rubygems-2.2.2
# ruby setup.rb
```

That's all.
