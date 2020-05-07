---
layout: post
title: 「会員登録完了メールが迷惑メールに入っちゃいます」対策
date: 2016-12-02
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161202/20161202122453.png
tags:
- spam
---

## 概要

サイト作りにありがちな設定忘れ
「会員登録完了メールが迷惑メールに入っちゃいます」

SPFレコード設定とDNSの逆引き設定が必要です。


## まず DNS 正引きとは


> ドメイン --- 問合せ ---> IPアドレス

以下のようなメールアドレスがあるとします。

`info@hogehoge.jp`

この `hogehoge.jp` から IPアドレス を問い合わせるのが `正引き`

## DNS 逆引きとは


> IP アドレス --- 問合せ ---> ドメイン

IPアドレス から `hogehoge.jp` を問い合わせるのが `逆引き`

## SPFレコード

SPF = Sender Policy Framework

メールを送る側のポリシーを設定したフレームワークです。


## 何故こんなフレームワークがあるの？

送信元偽装なんて簡単にできるから！

```
$ echo "TEST" | sendmail -f aiueo@xxxx.jp -t kenzo.xxxxxx.0107@gmail.com
```

<div style="text-align:center;">
<img src="http://i.imgur.com/brOZazX.png" width="100%">
</div>



## SPFレコードを設定することの意味

SPFレコード設定する、ということは
送信元の IPアドレス, ドメイン を指定することで
受信先が 送信元メールアドレスとSPFレコード情報に設定している IP, ドメイン情報と一致しているか
わかるようになります。

## 逆引き設定することの意味

送信元のIPアドレスから割り出したドメインと
逆引き設定されたIPに紐づくドメインとを照合し
異なる場合は偽装と判断することができる為です。

Gmail などではこのフィルターが設定されていて
逆引き設定されていないと迷惑メールBOXに入っちゃいます。


## SPF レコード設定確認

```
$ dig -t TXT <メールドメイン>
```

- 例) gmail.com

```
$ dig -t TXT gmail.com

gmail.com.              300     IN      TXT     "v=spf1 redirect=_spf.google.com"
```

- 例) yahoo.co.jp

```
$ dig -t TXT yahoo.co.jp

yahoo.co.jp.            6       IN      TXT     "v=spf1 include:spf.yahoo.co.jp ~all"
```

## Gmail でSPFレコード設定確認

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161202/20161202121710.png" width="100%">
</div>

- SPF: NEUTRAL の場合、SPFレコードが正しく設定されていません。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161202/20161202121724.png" width="100%">
</div>

- SPF: PASS の場合、SPFレコードが正しく設定されています。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161202/20161202122051.png" width="100%">
</div>


以上です。
