---
layout: post
title: CentOS で Python バージョンアップ
date: 2015-02-17
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160223/20160223123929.jpg
---

## 経緯

pysftp を利用したかったが
元々インストール済みの 2.4 系が古く、動作しなかったため、
動作可能なバージョンを 2.7 系にアップする

## 環境

CentOS5.8(Final)

## インストールする Python Version

Python2.7.6

## インストール手順

yum でインストールすると他の不要なモジュールまでインストールしてしまい
依存関係を上書いてしまうので、ソースからビルドします。

{% gist kenzo0107/5433674dd4e54ec5edfe %}

- pip インストール

{% gist kenzo0107/1524267337a7b1f2a478 %}

- paramiko, pysftp インストール

{% gist kenzo0107/10bddf345c47302e8bc1 %}

## 総評

Apache の再起動なし。既存 Python バージョンも残しで出来ました。
