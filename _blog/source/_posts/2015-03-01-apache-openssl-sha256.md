---
layout: post
title: Apache + OpenSSL でSHA256対応CSR生成
date: 2015-03-01
tags:
- Apache
- OpenSSL
---

## ドメイン登録者情報確認

※特にドメイン登録者を明確に指定する必要がなければ、「手順」へ進んでください。

企業認証周りが必要な場合は
事前にWHOIS(フーイズ)でドメイン登録者情報を確認しておくとスムーズです。

[http://whois.jprs.jp/](http://whois.jprs.jp/)

検索ワードにドメイン入力して検索すると登録者情報を確認できます。



## CSR生成手順

{% gist kenzo0107/781b81a6916fbb2b8533 %}

{% gist kenzo0107/781b81a6916fbb2b8533 %}
