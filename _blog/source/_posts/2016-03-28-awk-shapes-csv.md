---
layout: post
title: awk で CSV の特定列を整形 〜数値を文字列扱いする〜
date: 2016-03-28
tags:
  - awk
  - csv
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160328/20160328190207.png
---

## 概要

ある顧客データを抽出してレポートしたい、というときに
CSV ファイルで "090" などと携帯電話があると Excel で CSV ファイルを開いたときに
"90" になってしまうということがあるかと思います。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160328/20160328190207.png" width="100%">
</div>

そんなときの為に特定列のみ数値を文字列扱いにしたときの内容まとめです。

## Excel で数値を文字列扱いするには

```
"090"
```

とあったとすると

```
="090"
```

のように整形することで文字列扱いになります。

例)

```
"デミスハサビス",="09099999999","DeepMind"
```

## 整形してみる

- 例）以下のような tmp.csv があるとします。

```
"デミスハサビス","09099999999","DeepMind"
"いとうせいこう","08088888888","エムパイヤ・スネーク・ビルディング"
```

- 2 つ目のカラムのみ =を左端に追加します
  ※"(ダブルクォテーション)で囲まれた値の左側に「=」を追加します。
  ※あえて分かりやすく $1, $2, $3 の項目を明示的に指定してみました。

```
$ awk -F ',' '{print $1 ",="$2","$3}' tmp.csv
"デミスハサビス",="09099999999","DeepMind"
"いとうせいこう",="08088888888","エムパイヤ・スネーク・ビルディング"
```

上記のように 「=」 が追加されました。

- 出力先を指定

```
$ awk -F ',' '{print $1 ",="$2","$3}' tmp.csv > output.csv
$ cat output.csv
"デミスハサビス",="09099999999","DeepMind"
"いとうせいこう",="08088888888","エムパイヤ・スネーク・ビルディング"
```

output.csv を Excel で開いてみます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160328/20160328190448.png" width="100%">
</div>

できました ♪

## おまけ

Excel を開く際、Windows ではデフォルト SJIS なので文字コードが UTF8 の場合、文字化けします。
以下 CSV ファイルを SJIS に文字コード変換します。

```
$ nkf -sLw output.csv > output_sjis.csv
```

以上です。
