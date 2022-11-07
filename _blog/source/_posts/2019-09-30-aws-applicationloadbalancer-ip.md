---
layout: post
title: AWS ApplicationLoadBalancerリスナールールで特定 IP 以外をメンテナンスページ表示
date: 2019-09-30
tags:
  - AWS
  - ALB
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190929/20190929233947.png
---

## 概要

AWS で運用している Web サービスでメンテナンスが必要となり、ALB でメンテ切り替えをした際の対応をまとめました。

<!-- more -->

## 手順

ALB Listener 一覧からルール変更をします。

※ 今回 2 ポートのみ解放しており、80 は 443 に転送してるので、443 のみ対応しました。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190929/20190929232804.png" width="100%">
</div>

その後、

- 送信元 IP = 社内 IP (ex. `11.22.33.44/32` ) → default の TargetGroup へ転送 で「保存」
- 社内 IP 以外の送信元 IP 全て ( `0.0.0.0/0` ) → `503` `text/html` メンテ文言をレスポンス で 「保存」

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190929/20190929231656.png" width="100%">
</div>

以上で 社内 IP は、通常通りアクセス可、それ以外はメンテナンスページを表示させることができました。

まとめてルールを追加して保存が出来ず、1 つずつルール追加で保存になります。

## レスポンスできる Content-Type って何があるの？

Content-Type に `application/json` 等も返せるので、 API サーバのメンテ時にはこちらを利用して文言を渡しました。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190929/20190929232354.png" width="100%">
</div>

## ちょっとした注意

最大文字数が 1024 文字でした ♪

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190929/20190929232942.png" width="100%">
</div>

CSS を `レスポンス本文` に追加すると文字数 1024 を超えてしまいそうなので、S3 にアップロードし公開し、そちらを参照するようにしたりしました。
