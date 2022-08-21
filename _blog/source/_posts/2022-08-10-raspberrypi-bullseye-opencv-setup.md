---
title: RPi opencv で笑顔検知して Slack に通知するカメラを作った
date: 2022-08-10
category: RaspberryPI
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## 概要

以前 RPi bullseye でカメラモジュール周りの設定が変わったことについて記載させていただきました。

{% linkPreview https://kenzo0107.github.io/2022/07/29/2022-07-30-fix-the-system-should-be-configured-for-the-legacy-camera-stack/ %}

RPi で opencv をセットアップする記事をネット上でいくつか見ましたが
bullseye より前のバージョンでの場合が多く、うまくいかないということが多かったです。

その為、 bullseye での設定をまとめます。

## bullseye 64-bit with Desktop を選択

`64-bit` の `Desktop` ありを選択しました。

ヘッドレスでも良かったのですが、RPi に接続したモニターに検知する顔を写しながら opencv を使いたかったので Desktop にしました。

実施した環境として OS 情報を記載しておきます。

```console
$ lsb_release -a

No LSB modules are available.
Distributor ID: Debian
Description:    Debian GNU/Linux 11 (bullseye)
Release:        11
Codename:       bullseye

$ uname -a

Linux pi3b-smile 5.15.32-v8+ #1538 SMP PREEMPT Thu Mar 31 19:40:39 BST 2022 aarch64 GNU/Linux
```

## 手順

コマンドで以下実行します。

```console
sudo raspi-config

// Interface Options を選択
// Legacy Camera Enable/disable legacy camera support

// Legacy Camera を有効化し RPi を再起動します

// ↓↓↓再起動後↓↓↓

// 顔認識で使う以下パッケージをインストール
sudo apt install libatlas-base-dev libqt4-test libjasper1 libhdf5-dev

// contrib モジュール入り opencv インストール
$ sudo pip install opencv-contrib-python

// opencv インストールできたか確認
$ python
// cv2 呼び出しができエラーが出ないこと
>>> import cv2
>>> cv2.__version__
'4.6.0'

// OpenCV で顔検知・認識のサンプルがまとまっている Git リポジトリ取得
$ git clone https://github.com/Mjrovai/OpenCV-Face-Recognition
$ cd OpenCV-Face-Recognition/FaceDetection/
$ python faceDetection.py
```

## 総評

bullseye でカメラ周りの変更があったのでなかなか opencv の設定がうまくいかなかったのですが、最終的に非常にシンプルにできることがわかりました。

以上
参考になれば幸いです。
