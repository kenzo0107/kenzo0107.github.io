---
layout: post
title: LINE Notify で Zabbix Alert 通知
date: 2016-10-11
tags:
- Monitoring
- LINE Notify
- Zabbix
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011142249.png
---


## 概要

Zabbix アラート を LINE Notify を利用して
LINEにメッセージを送るように設定しました。


## 手順

### LINE Notify アクセス

[https://notify-bot.line.me/ja/]

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011140750.png" width="100%">
</div>


### 登録してログイン

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011140920.png" width="100%">
</div>

### サービス登録

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011141015.png" width="100%">
</div>

この情報が審査されるということは特になかったですが
ある程度精度の高い情報を入力して登録しときました

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011141027.png" width="100%">
</div>


### トークルーム選択しトークン発行

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011141314.png" width="100%">
</div>

### 発行したトークンコピー

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011141349.png" width="100%">
</div>


### Zabbix スクリプト設定

{% linkPreview https://github.com/kenzo0107/Zabbix3-LineNotify _blank %}

## Env
- Zabbix 3.0
- CentOS Linux release 7.2.1511 (Core)

## Install Steps

```
[Zabbix-Server]$ cd /usr/lib/zabbix/alertscripts    # AlertScriptsPath
[Zabbix-Server]$ git clone https://github.com/kenzo0107/zabbix3-linenotify
[Zabbix-Server]$ mv zabbix3-slack/line_notify.sh .
[Zabbix-Server]$ rm -r zabbix3-linenotify
[Zabbix-Server]$ chmod 755 line_notify.sh
```

### Media Types 設定
<div style="text-align:center;">
<img src="http://i.imgur.com/mE5dEXI.png" width="100%">
</div>

### Users > Media 設定
<div style="text-align:center;">
<img src="http://i.imgur.com/ovDFnTq.png" width="100%">
</div>


### 通知テスト

テスト環境などで
Nginx の process が1つ以上になったらアラート出すように設定してみた結果

<div style="text-align:center;">
<img src="http://i.imgur.com/6B554NX.png" width="100%">
</div>


## 所感

トークルームに参加するにも
LINE アカウントはプライベートアカウントなので
ちょっと知られたくないわ〜という時は
何とも言えない気持ちになる方もいることがわかりました。

ご利用は計画的に。

## 今後の期待

個人的に
Twilio みたいに LINE Notify で電話通知出来たら嬉しいです。

まずは障害がない世界を♪

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011213827.jpg" width="100%">
</div>

以上です。
