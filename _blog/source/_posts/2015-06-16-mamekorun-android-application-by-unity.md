---
layout: post
title: UnityでAndroidアプリ「マメコラン！」公開♪
date: 2015-06-16
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150616/20150616004701.png
---

## アプリ公開しました♪

[Google Play 『マメコラン！』](https://play.google.com/store/apps/details?id=com.mameko.jp&hl=ja)


## アンドロイダー紹介VTR
種ちゃんに紹介してもらいました♪

{% linkPreview https://www.youtube.com/watch?v=XdxubQsPs6M %}

## アンドロイダー詳細ページ

{% linkPreview https://androider.jp/official/app/0e098734256fe037/ %}

## 種ちゃん

http://idol.lecre.jp/

## アプカジュさんにご紹介いただきました！

{% linkPreview http://www.appcasual.net/2015/03/11/shortreview-mameko/ %}



### ポイント

基本走りゲーですが、世の中には面白い走りゲーはいっぱいあるので
さらに泳いだり、飛んだり、
また、ストーリー重視で作りました♪

進めば進むほどストーリーが明らかになっていく、
実はあいつが...なんて感じに作りました。

笑いあり、涙ありです。ぜひプレイしてみてください(^-^)


## 環境

- Unity 4.6
- MacOSX Yosemite 10.10.2
- さくらレンタルサーバ (¥1,000/月) - AnsibleでLAMP構築。

## 5rocks (現tapjoy) - クライアントサイド

- Unity用SDKあり
- リアルタイムでKPI測定可能。リモートプッシュ付き。月のActiveUser数で有料or無料に。
- 2015年5月28日時点 TapJoyになって若干Documentに誤記等あり、ちょっと心配。

** fluentd + ElasticSearch + kibana でログ解析 - サーバサイド
- アイテムの利用率等を知る為導入しました。


## 工夫点

マップはオブジェクトプールしてプレイヤーが進む毎に生成する、カメラから外れたら再度プールに戻す、
という風に効率化しシーン間移動を素早くするようにしました。



## アンドロイダー公認アプリになりました♪

{% linkPreview https://androider.jp/official/app/0e098734256fe037/ %}
