---
layout: post
title: DUNSナンバー確認手順
date: 2015-02-28
---

## 概要

thawteにて「SGC Super Certs」の申請する際
DUNSナンバーが必要となる為
クライアント様がDUNS(ダンズ)ナンバーを
所持されているか確認する必要がありました。

http://www.tsr-net.co.jp/service/product/get_a_duns_number/


DUNSナンバー確認手順を以下に記載します。

<span style="color: #ff0000">尚、以下手続きはクライアント様ご自身が実施する必要があります。</span>
理由としては、クライアント実行した場合、無料で問い合わせできるからです。
他社からは3000円になります。 2015/02/23 現在


## DUNSナンバー確認手順

### https://duns-number-jp.dnb.com/search/jpn/login.asp:title=東京商工リサーチページ へアクセスします。
中央の赤いボタン「DUNS Numberを検索する」をクリックします。

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228215352.png)



### クライアントの企業名や住所で検索します。

WHOIS(フーイズ)で検索したドメイン所有者で検索する。

例として、アメブロ「ameblo.jp」の所有者情報を使用します。

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228223332.png)



### 検索結果にて該当項目の「DUNS」画像ボタンをクリックします

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228224451.png)



### 使用許諾契約書ページが表示されます

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228225036.png)



### ページフッター付近にて「同意する」ボタンをクリックします

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228225224.png)



### 申し込みフォームが表示されるので必要情報を入力し「確認」ボタンをクリックします

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228230551.png)



### 「送信」ボタンをクリックします

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228230922.png)

上記入力のメール宛にDUNSナンバー通知を確認します。





以下クライアント様より報告いただいたDUNSナンバー情報フォーマットになります。

```
[受付番号]　***
[対象企業]　***
[ DUNS# ]　***
[ 自／他 ]　自社
```

上記を元にthawteではSSL証明書発行手続きをします。

クライアント様登録の電話番号が誤っている、もしくは現在使われていない場合は、
SSL申請手続きでリジェクトされるという事態が起きます。

実際起きました汗

クライアント様へ確認依頼する際はお電話番号が後使用可能であるかを
不躾ではありますが、確認しておくのが良いかと思います。

以上
