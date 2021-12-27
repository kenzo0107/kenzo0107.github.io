---
layout: post
title: クライアント受注のWebサイト構築時のSSL証明書インストールする為にしたこと
date: 2015-06-16
---

## 概要

クライアントより受注したWebサイト構築時にSSL証明書をインストールする必要が生じ、その際に行った手続きをまとめます。

## 前提

無料SSLや自作SSLではセキュリティ面で不安な為、
シェアの高いSSL証明書発行しているthawteより取得することとしました。
費用面についてもクライアントに了承を得ています。

[thawte](http://www.jp-thawte.com/)

世界第2位のシェアを誇る認証機関であり、各種サーバー認証及びコードさイニング認証を世界各国のお客様へ提供している。

## ToDo

1. WHOIS(フーイズ)でドメインの所有者情報確認
2. クライアント所持のDUNS(ダンズ)ナンバー確認
3. CSR発行
4. SGC Super Certs申請
5. SSL証明書インストール

## 手順

### 1. WHOIS(フーイズ)でドメインの所有者情報確認

{% linkPreview https://kenzo0107.github.io/2015/02/28/2015-03-01-show-domains-owner/ %}

WHOISで検索したドメインの所有者情報が表示されます。
この情報を保管します。
後にCSR発行時に利用します。


### 2. クライアント所持のDUNS(ダンズ)ナンバー確認

{% linkPreview https://kenzo0107.hatenablog.com/entry/2015/02/28/231623 %}


### 3. CSR発行

{% linkPreview https://kenzo0107.hatenablog.com/entry/2015/03/01/010130 %}



### 4. SGC Super Certs申請

{% linkPreview https://kenzo0107.github.io/2015/06/15/2015-06-16-sgc-supercerts/ %}


### 5. SSL証明書インストール

{% linkPreview https://kenzo0107.github.io/2015/06/15/2015-06-16-install-ssl-certificate/ %}
