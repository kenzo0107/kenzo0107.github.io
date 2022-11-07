---
layout: post
title: CSVエンコード問題解決
date: 2016-09-09
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160909/20160909105642.jpg
tags:
  - csv
---

## 概要

Linux サーバで DB で集計して CSV ファイルをレポートする
なんてことがあるかと思います。

CSV ファイルを Linux サーバで作成し
Windows, Mac にメール添付して送信すると
どちらも CSV ファイルを開くと文字化けしてしまう問題に遭遇しました。

この問題を解決すべく調査しました。

## そもそも何で文字化け？

CSV ファイルは Windows, Mac では基本 Excel が起動し開きますが
<span style="color:red">デフォルト Shift_Jis として開こうとします。</span>

テキストファイルに一旦開いてコピーしてエクセルに貼り付ける対策を紹介しているブログもありましたが
クライアント様がお相手となる場合やファイルサイズが非常に大きい場合は
一手間かける方法は NG です。

## 調査 1 文字コードを変更してから mutt でメール添付送信

1. 文字エンコードは nkf : Network Kanji Filter Version 2.0.7 (2006-06-13)
2. メール送信は mutt 1.4.2.2i
3. mutt の設定ファイルをいじりましたがうまくいかなかったです。

### Shift_JIS

```sh
$ echo '大崎,yoshi,浜田,moto,松本' > sjis.csv
$ nkf -g sjis.csv
UTF-8

$ nkf -s --overwrite sjis.csv
$ nkf -g sjis.csv
Shift_JIS

$ echo "Shift_JIS だよ" | mutt -n -s "Shift_JIS CSV 添付" "kenzo.tanaka0107@gmail.com" -a sjis.csv
```

- メール受信し添付ファイルをダウンロードし文字コードチェック

```sh
$ nkf -g sjis.csv
UTF-8
```

あれ？ Shift_JIS にエンコードして送ったんだけど UTF-8 になってる

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160909/20160909102427.png" width="100%">
</div>

### JIS (ISO-2022-JP)

```sh
$ echo '大崎,yoshi,浜田,moto,松本' > jis.csv
$ nkf -j --overwrite jis.csv
$ nkf -g jis.csv
ISO-2022-JP

$ echo "JIS だよ" | mutt -n -s "JIS CSV 添付" "kenzo.tanaka0107@gmail.com" -a jis.csv
```

- メール受信し添付ファイルをダウンロードし文字コードチェック

```
$ nkf -g jis.csv
ISO-2022-JP
```

ISO-2022-JP で文字コードが変更されず送信されたけど...
やっぱり文字化け...

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160909/20160909102720.png" width="100%">
</div>

### UTF-8

```sh
$ echo '大崎,yoshi,浜田,moto,松本' > utf8.csv
$ nkf -w --overwrite utf8.csv
$ nkf -g utf8.csv
UTF-8

$ echo "UTF-8 だよ" | mutt -n -s "UTF-8 CSV 添付" "kenzo.tanaka0107@gmail.com" -a utf8.csv
```

- メール受信し添付ファイルをダウンロードし文字コードチェック

```
$ nkf -g utf8.csv
UTF-8
```

当然文字化け...

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160909/20160909102942.png" width="100%">
</div>

### UTF-8 BOM 付き

```sh
$ echo '大崎,yoshi,浜田,moto,松本' > utf8-bom.csv
$ nkf --overwrite -oc=UTF-8-BOM utf8-bom.csv
$ nkf -g utf8-bom.csv
ISO-2022-JP

$ echo "UTF-8-BOM だよ" | mutt -n -s "UTF-8-BOM CSV 添付" "kenzo.tanaka0107@gmail.com" -a utf8-bom.csv
```

- メール受信し添付ファイルをダウンロードし文字コードチェック

```sh
$ nkf -g utf8-bom.csv
ISO-2022-JP
```

JIS と同様の結果...

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160909/20160909103228.png" width="100%">
</div>

### EUC

```sh
$ echo '大崎,yoshi,浜田,moto,松本' > euc.csv
$ nkf -e --overwrite euc.csv
$ nkf -g euc.csv
EUC-JP

$ echo "EUC だよ" | mutt -n -s "EUC CSV 添付" "kenzo.tanaka0107@gmail.com" -a euc.csv
```

- メール受信し添付ファイルをダウンロードし文字コードチェック

```sh
$ nkf -g euc.csv
EUC-JP
```

ファイルエンコードではうまくいきませんでした。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160909/20160909110133.png" width="100%">
</div>

## 調査 2 BINARY ファイルにしてみる

もっと具体的にいうと 圧縮ファイルを送ってみる

Shift_JIS で CSV が開かれるので Shift_JIS にエンコードします。

```
$ echo '大崎,yoshi,浜田,moto,松本' > sjis.csv
$ nkf -s --overwrite sjis.csv
$ zip sjis.zip sjis.csv
$ nkf -g sjis.zip
BINARY

$ echo "ZIP だよ" | mutt -n -s "ZIP 添付" "kenzo.tanaka0107@gmail.com" -a sjis.zip
```

- メール受信し添付ファイルをダウンロードし文字コードチェック

```sh
$ nkf -g sjis.zip
BINARY

$ unzip sjis.zip
$ nkf -g sjis.csv
Shift_JIS
```

Shift_JIS のままダウンロードできてる！
これは期待できそう！

うまくいった！

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160909/20160909104652.png" width="100%">
</div>

## 総評

- Windows, Mac で送られてきた CSV ファイルで文字化けせず開くことができました。
- 圧縮した方が容量を下げて通信が行えるのでよくなりました。
