---
layout: post
title: Go+Revelフレームワーク 非同期でS3へ画像リサイズ/アップロード
date: 2017-08-09
tags:
- Go
---

備忘録です。

## 概要

AWS向けのgoライブラリが乱立していて
どれ使ったらいい？という感じだったので
本家の `launchpad.net/goamz/aws` を利用して
実装することにしました。


## Controller

- app/controllers/img.go

{% gist kenzo0107/e27a7efa27d11ceab8f6 %}

## Component

画像アップロード部分をcomponent化しました。

- app/utility/aws.go

{% gist kenzo0107/a36c52f019ce75411a3f %}

## Views

- Views/Img/Index.html

{% gist kenzo0107/871a8dc41105209ee38c %}

- public/js/ajax.js

{% gist kenzo0107/260b7ff637fd58229824 %}

- public/js/jquery.uploadThumbs.js

{% gist kenzo0107/66609140fe7c144040fa %}
