---
layout: post
title: SGC SuperCerts 購入手順
date: 2015-06-16
---

## 概要
クライアントより指定ドメインにSSL証明書をインストールして欲しいとの依頼があり、
比較的安価なthawteによりSSL証明書発行するよう手配しました。
その手順を以下に記載します。

<span style="color: #ff0000">※2015年4月時点で値上げした模様です。SSL比較サイト等で改めて検討してください。</span>

SSL料金比較サイト

* http://serverkurabe.com/ssl-matome/
* http://www.ssl-concier.com/products/


## 前提
対象ドメインに対して以下が完了していること。

+ CSR生成済みであること。
+ DUNSナンバー取得済みであること。
+ クライアント担当者の氏名・役職・連絡先・会社住所を把握していること。

## 手順

https://products.thawte.com/orders/thawte_sgc.do?ref=5480204MED80655&contract=REF98555&language_id=9&change_lang=9:title

必要項目を選択し「次へ」ボタン押下する。

![](https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150226/20150226185547.png)


[CSRの入力](https://products.thawte.com/orders/enrollment/OrderInfo.do)

![](https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150616/20150616002737.png)


補足サーバ名入力
「Common Name」項目が対象のドメインになっていることを確認する。

![](https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150615/20150615235757.png)


サーバURLの確認

![](https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150616/20150616001757.png)


組織情報確認

<span style="color: #ff0000">赤枠</span>に入力していきます。

![](https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150616/20150616002052.png)


連絡先情報入力
こちらで登録したメールアドレスへ、購入完了メールが送信されます。
クライアント窓口を確認し、記入する情報を貰い登録すること。

![](https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150616/20150616002431.png)



クレジット情報入力
※クレジットのみの購入になります。

![](https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150616/20150616002820.png)



注文確認
改めて全て再確認してください。
問題なければ「注文を送信」で購入完了です。

数日すると問題なければSSL証明書がメールに添付されて届きます。

![](https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150616/20150616003641.png)

以上
