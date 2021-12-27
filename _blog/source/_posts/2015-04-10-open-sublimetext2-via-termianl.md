---
layout: post
title: ターミナルからファイル指定しSublime Text 2で開く
date: 2015-04-10
---

## 環境

* MacOSX 10.10.2
* SublimeText2 2.0.2

## シンボリックリンク

```console
$ sudo ln -s /Applications/Sublime\ Text\ 2.app/Contents/SharedSupport/bin/subl /usr/bin/subl
```

## 指定ファイルをsublimetextで開く

```console
$ subl filename
```
