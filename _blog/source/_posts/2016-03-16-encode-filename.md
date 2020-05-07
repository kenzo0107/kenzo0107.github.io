---
layout: post
title: ファイルの中身でなくファイル名の文字コードを変更する
date: 2016-03-16
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160408/20160408142205.jpg
---

## 概要

ECサイトの売上のレポートなどを送信したい、というとき
ファイル名に日本語を指定せざるを得ないとき(クライアントさんが「絶対に日本語！」)
がときたまあります。

- クライアント様の環境はWindows。
- Windows デスクトップのデフォルト文字コードは Shift JIS。

Linux で作成したファイルのデフォルト文字コードがUTF-8だった場合
メールに添付し送信し、受信したWindows PCでダウンロードすると
ファイル名が文字化けしてる、
なんてことがあります。

そんなとき、ファイルの中身でなくファイル名自体の文字コードを変更したので
その対応まとめです。

## 環境

- CentOS release 5.11 (Final)
- convmv 1.10

convmv を利用します。

- CentOSならyumでインストール

```
# yum install -y convmv
```

## 手順

- デフォルト文字コードUTF-8とします。

```
// UTF-8 でファイル名「ほげほげ」作成
$ touch ほげほげ

// ファイル名の文字コードを UTF-8 から ShiftJIS に変換
$ convmv -r -f utf8 -t sjis ほげほげ --notest
mv "./ほげほげ" "./ق°ق°"
Ready!

$ ls -al
-rw-rw-r-- 1 user group     0  3月 16 16:45 ?ق??ق?
```

全く読み取れないような文字になります。

ごく稀に「絶対日本語で！」という方の一助になれば何よりです。
