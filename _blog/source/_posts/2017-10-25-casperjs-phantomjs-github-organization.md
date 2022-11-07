---
layout: post
title: CasperJS+PhantomJS で Github Organization 移行
date: 2017-10-25
tags:
  - casperjs
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171025/20171025214738.png
---

## 概要

Github Enterprise の Organization 移行を実施した際に CasperJS と PhantomJS でヘッドレスブラウザより操作し移行しました。
Github 上で API がない（はず？）為、この様な対応をしました。

どちらかというと CasperJS+PhantomJS でブラウザ上の試験作りを楽しんでいたこともあり
試してみてすんなりできたので採用した経緯になります。

## ヘッドレスブラウザとは？

GUI なしのブラウザを CLI で利用するというもの。
ページ描画や画像ロード、ログインしたりとフロントの試験で期待される機能を持っています。

## 三行まとめ

- CasperJS + PhantomJS でログイン認証はじめブラウザ操作で Transfer する工程を実行
- 移行後、元の URL が移行先にリダイレクトされるか確認
- 期待する要素が時間内に取得できないときはページをキャプチャ

## やってみる

[Get Started](https://github.com/kenzo0107/transfer-repository-on-ghe#get-started) ご参照ください。

{% linkPreview https://github.com/kenzo0107/transfer-repository-on-ghe _blank %}

以下にも手順まとめてます。

## Clone

```sh
macOS%$ git clone https://github.com/kenzo0107/ghe-org-transfer
macOS%$ cd ghe-org-transfer
```

## scripts/ghe-org-transfer.js の <your \*\*\*\*> 編集

```js
var config = {
  // site root.
  siteRoot: 'https://<your github domain>',
  // Github Login path
  loginPath: '/login',
  // Github Login Account
  loginParams: {
    email: '<your email>',
    password: '<your password>',
  },
  viewportSize: {
    width: 3000,
    height: 2500,
  },
  paths: ['<your owner>/<your repository>'],
  destOrganization: '<your destination of organization>',
  reason: 'transfer this repository to new oragnization',
};
```

### 移行イメージ

- ex) hoge/mywonderfulrepo ---> moge/mywonderfulrepo

```js
paths: [
  "hoge/mywonderfulrepo"
],
destOrganization: 'moge',
```

paths は複数指定しても問題ありません。

## 移行実施

```
macOS%$ make run
```

- 実行結果

※ 移行後に元の URL でリダイレクトされるか試験しています。

```sh
[url] https://github.aiueo.com/hoge/mywonderfulrepo/settings
[step] fill '#transfer_confirm > form'
[step] input checkbox #team-59
[step] click the button labeled "Transfer"
(^-^) redirect ok:https://github.aiueo.co.jp/hoge/mywonderfulrepo to https://github.aiueo.co.jp/moge/mywonderfulrepo
```

## 総評

以前 Grafana のグラフのスナップショットを撮る Grafana API がうまく動作しなかったのも
CasperJS+PhantomJS で取得する様にできました。

いやはや便利 ♪

全然別件ですが、サイトの認証に利用される reCAPTCHA の突破など挑戦してましたがうまく行かず...
うまくいったぜ！という方、是非教えてください m(\_ \_)m
