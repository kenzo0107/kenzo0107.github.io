---
layout: post
title: Linux に rbenv をセットアップして ruby バージョンを切り替える
date: 2018-03-07
tags:
  - Ruby
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180307/20180307225204.png
---

## 概要

サーバの ruby のバージョンが古かった為、
rbenv で ruby のバージョンを切り替える様にした際の設定メモです。

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

## rbenv 経由で Ruby 2.5.0 インストール

```sh
$ rbenv install 2.5.0

// 現 version は system. まだ 2.5.0 に切り替わっていない
$ rbenv versions
* system (set by /home/vagrant/.rbenv/version)
  2.5.0

// 2.5.0 へ切り替え
$ rbenv global 2.5.0

// 切り替え確認
$ rbenv versions
  system
* 2.5.0 (set by /home/vagrant/.rbenv/version)

$ ruby -v
ruby 2.5.0p0 (2017-12-25 revision 61468) [x86_64-linux]

// リフレッシュしないと .rbenv/versions/2.5.0/bin 以下のパスを通らない
$ rbenv rehash
```
