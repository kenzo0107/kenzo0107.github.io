---
layout: post
title: Android Studio AVD (エミュレータ) からデスクトップのローカルホストに接続させる設定
date: 2016-03-09
tags:
  - Android
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160309/20160309222944.png
---

## 概要

MacOSX 上で Android Studio で Android アプリ開発中です。

AVD(Android Virtual Device) から Volley で API の繋ぎこみ先を
MAMP や Vagrant、Docker 等ローカル環境で構築したサーバに
接続するようにしています。

単純に emulator 上で 地球儀マークの Web ブラウザ開いて
ローカルホスト を指定しても接続できません。

その際に一手間必要でしたので以下手順です。

## 設定

- AndroidStudio で<span style="color: #ff0000">AVD 起動中</span>に以下 Shell を実行してください。

{% gist kenzo0107/7a51b8055e32ebcf87df %}

以上です。
