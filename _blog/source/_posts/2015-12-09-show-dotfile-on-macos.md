---
layout: post
title: 今更ながらMacでドットファイルを表示する
date: 2015-12-09
tags:
- macos
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151209/20151209101926.png
---

## 概要

Finderでドットファイルを開きたいという際にやっておく設定

## 環境

- MacOSX Yosemite 10.10.3

## 手順

### ターミナルを開き以下コマンド実行

```
$ defaults write com.apple.finder AppleShowAllFiles -boolean true
```

### Finderアプリ再起動

```
$ killall Finder
```

これでドットファイルが反映されています。


## 元に戻したい場合

### ターミナルで以下コマンド実行

```
$ defaults delete com.apple.finder AppleShowAllFiles
```

### 再起動

```
$ killall Finder
```

以上です
