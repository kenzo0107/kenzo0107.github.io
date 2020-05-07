---
layout: post
title: toda-tocochan-bus flask on IBM Bluemix へ引っ越し
date: 2017-10-29
tags:
- Python
- flask
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171029/20171029095513.png
---

GCP から IBM Bluemix へ引っ越しました！

[toco ちゃんバス あと何分？](https://toda-tocochan-bus.mybluemix.net/)

## 概要

さくらVPS から GCP、
そして今度は GCP から IBM Bluemix に引越ししました。


以前 GCP 運用時の話はコチラ

{% linkPreview https://kenzo0107.github.io/2017/08/03/2017-08-03-tutorial-of-gke _blank %}


GCP は GKE に LB かましたら価格がバコッと上がってしまい
無料枠を逸脱してしまいました (>_<)

なんとか低価格で運用したいという目論見です。


## 何故 Heroku でなく IBM Bluemix ？

IBM Bluemix の良い所は機能が充実している所です。
無料・デフォルトで kibana が見れます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171029/20171029101148.png" width="100%">
</div>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171029/20171029101853.png" width="100%">
</div>

その他 Git との連携も可です。



以下 Mac で作業することを前提に手順まとめました。

## 事前準備

- IBM Bluemix に Sign Up しときます

[Signup IBM Bluemix](https://console.bluemix.net/registration/)

- clone

```sh
macOS%$ git clone https://github.com/kenzo0107/toda-tocochan-bus-on-ibmbluemix
macOS%$ cd toda-tocochan-bus-on-ibmbluemix
```

- cloudfoundry の CLI インストール

```sh
macOS%$ brew tap cloudfoundry/tap
macOS%$ brew install cf-cli
```

## デプロイ

```sh
macOS%$ cf api https://api.ng.bluemix.net
macOS%$ cf login
macOS%$ cf push <application name>
```

- API は Region によって変わります。

| Region   | API URL                       |
| -------- | ----------------------------- |
| 米国南部 | https://api.ng.bluemix.net    |
| 英国     | https://api.eu-gb.bluemix.net |



## 総評

Cloudfoundry の CLI のお陰で引っ越しも簡単でした♪

セキュリティとして特定 IP やドメインからアクセスさせないとか出来たら
商用のメソッドとして利用出来そうかなと思いました。

その点質問してみましたが2週間ほど連絡がないので再度連絡してみます。
↑質問は英語限定でした！

サポートが強化されると有難いなと思いました。

以上
ご参考になれば幸いです。
