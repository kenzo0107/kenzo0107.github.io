---
layout: post
title: とにかくシンプルにPHPでLineBotApiを書きました
date: 2016-04-28
tags:
  - PHP
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160428/20160428003806.png
---

## 概要

話題の Line bot Api 用スクリプトを PHP で書きました。

とにかくシンプルに = カスタマイズしやすさ

という所で
修正する場所を限って利用できるようにしたつもりです。

## 作ったもの

適当に文字を打つと →「hello」
perfect と打つと → 「human」

と返すようにした本当にシンプルなものです。

そのロジック部分をカスタマイズすれば
マイ bot ができますね。

## 環境

- さくらレンタルサーバ VPS CentOS release 6.7 (Final)
- PHP 5.6.16

SSL は無料の StartSSL を利用しました。取得・設定は以下参照してください。

{% linkPreview http://kenzo0107.hatenablog.com/entry/2016/02/25/112253 _blank %}

## スクリプト

{% gist kenzo0107/9cc3245b57308aeadff61d3c76413f6b %}

###

`function getMessage` で bot に返信させたいメッセージを決定しています。

そこで他 API を呼んだり、サイトからスクレイプしたり情報をとってきて返してあげると
簡易的なメッセージ返信 Line bot できあがりです。

## こんな感じです！

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160428/20160428003454.png" width="100%">
</div>
