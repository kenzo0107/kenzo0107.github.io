---
layout: post
title: MAMPにMemcacheをインストールしphpで動かすまで
date: 2015-02-20
---

## 概要
ローカル開発環境にMemcacheをインストールしたい。

## 環境
MacOSX Yosemite 10.10.1
MAMP3.0.7.3

## 注意
インストールするのはMemcacheです。Memcache<span style="color: #d32f2f">d</span>ではないです。

## ToDo

+ Memcacheのソースダウンロードしコンパイル
+ memcache.soをphp.iniから呼び出し
+ MAMP再起動

## 手順

- Memcacheのソースダウンロードしコンパイル
- memcache.soをphp.iniから呼び出し

{% gist kenzo0107/dbcb15cbda2f3f85da27 %}

- php から利用 サンプル

{% gist kenzo0107/365890fe3fd6e44c1fc2 %}

以上
