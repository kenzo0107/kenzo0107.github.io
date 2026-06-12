---
layout: post
title: Nginx ssl.conf設定 特定ページのみhttpsへリダイレクトさせる設定
date: 2015-09-14
category: Infrastructure
lang: ja
translation_id: nginx-redirect-https
cover: /img/cover/2015-09-14-nginx-redirect-https.svg
tags:
- Nginx
---

## 概要
Go RevelフレームをNginx上で利用しています。

その際に設定したssl設定、及び、
特定ページのみhttpsへリダイレクトする様な
設定をする必要があったので以下まとめました。

{% gist kenzo0107/bab265d0e8c761576e24 %}


### https通信したいのページは以下です。

   - /register
   - /mypage
   - /login
   - /logout

https通信したいページをlocationの正規表現(~)でprefixを引っ掛けて
http通信の場合、https通信に301リダイレクトさせてます。

以上
