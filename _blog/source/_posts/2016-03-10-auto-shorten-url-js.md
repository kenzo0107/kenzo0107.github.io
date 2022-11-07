---
layout: post
title: inputボックスにURL打ち込むと自動URL短縮化されるjs
date: 2016-03-10
tags:
  - JavaScript
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160310/20160310115924.png
---

[f:id:kenzo0107:20160310115924p:plain]

## 概要

最近では URL に日本語を利用するケースが増えてきました。

SEO として価値がある作業かどうかは眉唾ではありますが
ネット利用率の低い方にとっては UI としては分かりやすいのかもしれません。

その点を論じているブログがありました。

{% linkPreview https://www.suzukikenichi.com/blog/should-urls-contain-japanese/ _blank %}

日本語を含む URL を Twitter へ投稿するようなソーシャル連携ツール等の開発の際、
文字数に厳密に注意する必要があり、短縮の自動化を bitly API で行いましたので
そのまとめです。

## 手順

- [bitly.com](https://bitly.com) に登録する

- [https://bitly.com/a/oauth_apps]にて `Access Token` を取得

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160310/20160310121138.png" width="100%">
</div>

- 以下 js を html 等でロードしてください。

{% gist kenzo0107/88af2f3e961324fac815 %}

以上
