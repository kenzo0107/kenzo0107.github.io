---
layout: post
title: Setting Up rbenv on Linux to Switch Ruby Versions
date: 2018-03-07
category: Infrastructure
lang: en
translation_id: change-ruby-version-via-rbenv
permalink: en/2018/03/07/change-ruby-version-via-rbenv/
tags:
  - Ruby
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180307/20180307225204.png
---

## Overview

The Ruby version on the server was outdated, so these are my setup notes from when I switched the Ruby version using rbenv.

## setup rbenv

```sh
$ git clone https://github.com/sstephenson/rbenv.git ~/.rbenv
$ git clone https://github.com/sstephenson/ruby-build.git ~/.rbenv/plugins/ruby-build

$ echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bash_profile
$ echo 'eval "$(rbenv init -)"' >> ~/.bash_profile

$ source ~/.bash_profile
$ rbenv --version
rbenv 1.1.1-30-gc8ba27f
```

## Install Ruby 2.5.0 via rbenv

```sh
$ rbenv install 2.5.0

// The current version is system. It hasn't switched to 2.5.0 yet
$ rbenv versions
* system (set by /home/vagrant/.rbenv/version)
  2.5.0

// Switch to 2.5.0
$ rbenv global 2.5.0

// Confirm the switch
$ rbenv versions
  system
* 2.5.0 (set by /home/vagrant/.rbenv/version)

$ ruby -v
ruby 2.5.0p0 (2017-12-25 revision 61468) [x86_64-linux]

// Without a refresh, the paths under .rbenv/versions/2.5.0/bin won't be picked up
$ rbenv rehash
```
