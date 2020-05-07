---
layout: post
title: "Ruby インストール on CentOS7"
date: 2015-08-06
tags:
- Ruby
---

## 環境
- AWS
- CentOS Linux release 7.0.1406 (Core)

## 必要モジュールインストール

```
$ sudo yum -y install git libffi libffi-dev gcc openssl-devel readline-devel zlib-devel
```

## rbenv, ruby-build ダウンロード

```
$ git clone https://github.com/sstephenson/rbenv.git ~/.rbenv
$ git clone https://github.com/sstephenson/ruby-build.git ~/.rbenv/plugins/ruby-build
```

## rbenv PATH指定

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
  2.0.0-p645 ← 2.0.0の最新 (※2015/08/06時点)
  2.1.0-dev
  2.1.0-preview1
  2.1.0-preview2
  2.1.0-rc1
   :
```

## ruby インストール

```
$ rbenv install -v 2.0.0-p645
```

## 再読込

```
$ rbenv rehash
```

## インストールしたバージョンに切り替え

```
$ rbenv global 2.0.0-p645
```

## 確認

```
$ ruby -v
ruby 2.0.0p645 (2015-04-13 revision 50299) [x86_64-linux]
```

以上
