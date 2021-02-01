---
title: Backlog API in Go 作りました
category: Go
tags:
- Go
date: 2020-06-06
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## Backlog API in Go 作りました

{% linkPreview https://github.com/kenzo0107/backlog _blank %}

只今、サポートする API を増やしております。

## Backlog API を作る経緯

とあるナレッジマネジメントシステムから Backlog へ移行するお仕事があり migration tool を作ろう！
と思い API が必要となりました。

以前、Backlog でコメントに「お知らせしたいユーザ」に Slack DM をする、
というのを SAM で作ったときは [griffin-stewie/go-backlog](https://github.com/griffin-stewie/go-backlog) で API を扱っていました。

{% linkPreview https://kenzo0107.github.io/2020/02/25/2020-02-25-backlog-comment-slack-dm/ _blank %}

ですが、
[griffin-stewie/go-backlog](https://github.com/griffin-stewie/go-backlog) は 2018年1月を最後に更新されていませんでした。。

例えば、ファイルをアップロードして Backlog の Wiki に追加する、という API がありません。

それならば！と思い、自作することとしました。

{% linkPreview https://github.com/kenzo0107/backlog _blank %}

是非、コミット & スポンサーお待ちしております m(_ _)m
