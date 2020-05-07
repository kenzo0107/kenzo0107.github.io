---
layout: post
title: Raspberry Pi 3 B に Raspberry Jessie セットアップ
date: 2016-07-12
tags:
- RaspberryPI
---

## 概要

Amazon Prime 会員の無料体験版で
Raspberry Pi 3 B 買いました♪

開発 Ready な状態を作るべく
そのセットアップ方法をまとめました。

## 環境

- MacBook Pro : MacOSX 10.11.5
- Wifi 環境

## 買ったもの

以下最低限必要なものです。

計 8,459円

* Raspberry Pi 3 Model B (ケース付き): 5,980円

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B01CSFZ4JG/kenzo0107-22/ _blank %}

* SD カード (32GB) : 1,080円

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B008UR8TS0/kenzo0107-22/ _blank %}

* 電源 (2.5A対応): 1,399円

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B01E6YLFAO/kenzo0107-22/ _blank %}

電源はPCのUSBポートからでも良いかな、と思ってましたが
Pi3Bの推奨電流が 2.5 A となった為、2.5 A 対応電源が必要になりました。

その他

大体持ち合わせてるのでは、と思います。
会社のゴミ山に捨ててあるのではないでしょうか。

* HDMI ケーブル : 691円

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B00HQY7U56/kenzo0107-22/ _blank %}

* USBキーボード : 530円

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B005LL9J9G/kenzo0107-22/ _blank %}

* USBマウス : 698円

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B005EJH6RW/kenzo0107-22/ _blank %}


その他含めても 10,378円。こりゃやるっきゃない。



早速セットアップ手順へ

## SDカード フォーマット

### SD カードフォーマットアプリ インストール

以下サイトからSDカードフォーマッターアプリをダウンロードしフォーマットします。

[SD Memory Card Formatter](https://www.sdcard.org/downloads/formatter/)

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710180905.png" width="100%">
</div>

Macであれば `for Mac` を選択し
同意してダウンロードします。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710181230.png" width="100%">
</div>

### ファイルシステム確認

フォーマットするSDカードがどれか知る必要がある為、
SDカードを差し込む前にターミナルから以下実行

```shell
$ df -h
```

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710182258.png" width="100%">
</div>

#### SDカードをMacに差し込む

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710181732.jpg" width="100%">
</div>

※MacBook AirではSDカード差し込み口がないのでカードリーダで読込みます。

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B00WFTCE0I/kenzo0107-22/ _blank %}

もう一度 `df -h` すると
新たに追加されたのが SDカード のファイルシステムです。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710183107.png" width="100%">
</div>

### SDFormatter でフォーマット

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710184814.png" width="100%">
</div>

※ 自分は名前を「RASP3B」としました。

もう一度 `df -h`

ディスクイメージ名が変更されているのがわかります。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710185115.png" width="100%">
</div>

以上でSDカードフォーマット完了です。


## ディスクイメージに Raspbian Jessie (Latest OS) を書き込み

### Raspbian Jessie ダウンロード

オフィシャルサイトから最新 Raspbian OS をインストールします。
数分掛かります。

[Raspbian](https://www.raspberrypi.org/downloads/raspbian/)

```shell
$ cd ~/Downloads
$ unzip 2016-05-27-raspbian-jessie.zip
$ ls -al 2016-05-27-raspbian-jessie.*
-rw-r--r--@ 1 kenzo  staff  4019191808  5 27 20:50 2016-05-27-raspbian-jessie.img
-rw-r--r--@ 1 kenzo  staff  1393896178  7 10 19:27 2016-05-27-raspbian-jessie.zip
```

### アンマウント

先ほど確認した ファイルシステム名 `/dev/disk2s1` から `s1` を取り除いた、
イメージ対象をアンマウントする

```shell
$ diskutil umountDisk /dev/disk2
```

### ダウンロードしたイメージを書き込み

```shell
$ sudo dd if=/Users/<User>/Downloads/2016-05-27-raspbian-jessie.img of=/dev/rdisk2 bs=1m
```

* `disk2` に `r` を頭に足すとアンバッファモードで実行し速度アップします。
* bs=1m ... 1度に書き込むサイズ

257 秒かかった 汗

以上で Raspberry Pi に挿す SDカード が作成できました。

### SDカード取り出し

```
$ diskutil eject /dev/disk2
```

## Raspberry PI 3 に 各種接続

<span style="color:red">全て接続し終わるまでRaspberry Pi に電流を流さないでください。</span>

### SDカード挿入

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711220046.png" width="100%">
</div>

### USBキーボード・マウス、SDカード、電源 接続

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711220523.png" width="100%">
</div>

全てが深く刺さっているのを確認した後
いよいよ電源を電源アダプタに接続します。

ついた！

なにやら読み込みが始まった！

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711221146.jpg" width="100%">
</div>

※我が家はテレビがディスプレイ代わりです。

おぉ〜GUIのトップ画面がでてきた！

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711221153.jpg" width="100%">
</div>

まず成功♪

## Raspberry Pi 各種設定

#### Menu > Preferences > Raspberry Pi Configuration  クリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711230714.jpg" width="100%">
</div>

#### SDカードの全容量を利用可能にする

- `System` タブの `Expand Filesystem` ボタンクリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711231408.png" width="100%">
</div>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711231657.png" width="100%">
</div>

以上でSDカードの全容量を利用可能になります。

#### Locale設定

- `Localisation` タブの `Set Locale` ボタンをクリックします。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711231758.png" width="100%">
</div>

- `Language` : ja (Japanese) 選択
- `Country` : JP (Japan) 選択
- `Character Set` : UTF-8 選択

上記選択し `OK` ボタンクリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711232125.png" width="100%">
</div>

#### Timezone設定

- `Localisation` タブ > `Set Timezone` ボタン クリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711232531.png" width="100%">
</div>

再度 `Set Timezone` ボタンをクリックすると Asia/Tokyo が選択されています。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711232604.jpg" width="100%">
</div>

#### キーボード設定

- `Localisation` タブの `Set Keyboard` ボタンをクリック

- `Country` : `Japan` 選択
- `Variant` : `Japanese` 選択

以上選択し`OK` ボタンクリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711232741.jpg" width="100%">
</div>

#### Wifi 設定

- Wifi 選択しパスフレーズ入力し Wifi接続

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711233030.png" width="100%">
</div>

- Wifi 接続が確認できます

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711233304.png" width="100%">
</div>

### MacOS → Raspberry Pi SSH 接続

- Raspberry Pi で Terminal 起動

```shell
$ ifconfig
```

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160712/20160712000448.png" width="100%">
</div>

- Mac から raspberry pi に SSH接続

```shell
[MacOSX local]$ ssh pi@192.168.xxx.xxx
pi@192.168.11.18's password: <デフォルトパスワードは "raspberry">

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Mon Jul 11 23:08:51 2016
```

SSH ログインが確認できました！


## 追記 (2016-07-08)

あとあと気づいたのだけど
わざわざ画面をiPhoneで撮影せずとも
Remote Desktop して綺麗なものを取ればよかった。。

ということで
SSH ついでに Remote Desktop 機能を要する tightvncserver インストール

```
$ sudo apt-get install tightvncserver
$ vncserver

// 起動
$ vncserver :1
```

- 設定したホスト名を指定してRemote Desktop し画面共有

```shell
vnc://raspberrypi.local:5901
```

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160712/20160712002819.png" width="100%">
</div>


### ブラウザを開いてみる

インターネットに接続されているのがわかります。

ただし
日本語がもれなく豆腐。。

Zabbix でも以前日本語フォントがなくて同様の事象がありました。。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711233353.jpg" width="100%">
</div>

日本語フォントをインストールする必要があります。



## Raspberry Pi に日本語フォントインストール

```shell
$ sudo apt-get update
$ sudo apt-get install fonts-vlgothic
$ sudo apt-get install ibus-mozc

// 再起動
$ sudo shutdown -r now
```

## もう一度ブラウザを開いてみる

- 日本語がちゃんと表示されています。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711235220.jpg" width="100%">
</div>

- 日本語入力できるよう、`日本語 - Mozc` 選択

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711235039.png" width="100%">
</div>


以上でセットアップ完了です。

ご清聴ありがとうございました。


{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B0155WN7CK/kenzo0107-22/ _blank %}
