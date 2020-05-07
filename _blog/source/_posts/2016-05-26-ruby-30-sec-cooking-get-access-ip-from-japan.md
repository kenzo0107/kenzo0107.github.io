---
layout: post
title: 日本国内からアクセスされるIP取得スクリプト Ruby 30秒クッキング
date: 2016-05-26
tags:
- Ruby
---


## まずスクリプト

{% gist kenzo0107/714ece62cf6450386ff0fb16fd5b777a %}

```sh
$ git clone https://gist.github.com/kenzo0107/714ece62cf6450386ff0fb16fd5b777a
$ cd 714ece62cf6450386ff0fb16fd5b777a
$ ruby getJapanIP.rb

1.0.16.0
1.0.64.0
1.1.64.0
1.5.0.0
...
中略
...
223.223.164.0
223.223.208.0
223.223.224.0
```

## 概要

作った経緯は
日本版・海外版URLがあり、
海外版に日本からアクセスした場合は
日本版サイトにリダイレクトさせたい、
という依頼があった為です。

このスクリプトを利用して
海外版サイト .htaccess等でリダイレクト設定をしました。

以上です。
