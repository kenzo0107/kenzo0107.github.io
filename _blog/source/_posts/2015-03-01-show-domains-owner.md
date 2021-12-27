---
layout: post
title: ドメインの所有者を確認する方法
date: 2015-03-01
---

## 概要

クライアント様所有のドメインにSSL証明書をインストールして欲しいという依頼について
thawteよりSGC SuperCertsから申請しSSL証明書発行する経緯となった。

その申請に必要なDUNSナンバー取得の為、
ドメインの所有者がクライアント様になっているかを確認する必要があった。

DUNSナンバーの確認方法は以下

{% linkPreview https://kenzo0107.github.io/2015/02/27/2015-02-28-show-duns-number/ %}


## 手順

WHOISというドメインの検索サービスで検索可能です。

http://whois.jprs.jp/

上記リンクからWHOISにアクセスし、
検索したいドメイン名を入力する。
「検索」ボタンをクリックすると所有者情報が表示されます。

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150301/20150301001641.png)

thawteのSSL発行時には
以上の情報をもとにCSR発行手続きします。


以上
