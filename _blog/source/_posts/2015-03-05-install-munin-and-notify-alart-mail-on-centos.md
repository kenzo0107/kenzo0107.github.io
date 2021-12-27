---
layout: post
title: CentOS にmuninインストール 監視しアラートメール受信
date: 2015-03-05
---

## 概要

- CentOSにmuninをインストールし死活監視します。
- warning, criticalを検知した際にアラートメール送信をします。
- MySQL, Redisの監視設定も記載しました。


## 環境
CentOS 5.11(Final)
CentOS 6.5(Final)
munin 2.0.21

## 手順

{% gist kenzo0107/29582fe37b8d29bf4192 %}



## 参考
* http://castor.s26.xrea.com/blog/2007/10/19
