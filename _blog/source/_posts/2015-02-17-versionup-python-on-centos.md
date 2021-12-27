---
layout: post
title: CentOS で Python バージョンアップ
date: 2015-02-17
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160223/20160223123929.jpg
---

## 経緯

pysftpを利用したかったが
元々インストール済みの2.4系が古く、動作しなかったため、
動作可能なバージョンを2.7系にアップする

## 環境

CentOS5.8(Final)

## インストールするPython Version

Python2.7.6

## インストール手順

yumでインストールすると他の不要なモジュールまでインストールしてしまい
依存関係を上書いてしまうので、ソースからビルドします。

{% gist kenzo0107/5433674dd4e54ec5edfe %}

* pip インストール

{% gist kenzo0107/1524267337a7b1f2a478 %}

* paramiko, pysftpインストール

{% gist kenzo0107/10bddf345c47302e8bc1 %}


## 総評

Apacheの再起動なし。既存Pythonバージョンも残しで出来ました。
