---
layout: post
title: 顔検出 3分クッキング on MacOSX
date: 2018-08-01
tags:
- MachineLearning
---

## 概要

ラズパイ使って家族と判断したら
「こんにちはご主人様」
家族以外なら
「通報しまーす」
と話してくれるおもちゃを
作ろうと思ってます。

その前段の前段として
静止画で顔検出してみます。

ちなみに顔検出と顔認識は意味が全く異なります。


- 顔検出 ... 顔部分を検出すること。
- 顔認識 ... 特定の人物の顔と判断すること。


環境構築は前回記事を参照してください。

{% linkPreview https://kenzo0107.hatenablog.com/entry/2016/07/28/143429 _blank %}





## 環境

- MacOSX 10.11.5
- Python 3

## CV2 インストール

- homebrew で cv2 インストール

```shell
$ brew tap homebrew/science
$ brew install opencv3 --with-python3
```

- Python 3 を利用する

```
$ source ~/py3env/bin/active
(py3env)$
```

- cv2.so を pip の site-package へコピー

```
(py3env)$ cd ~/py3env/lib/python3.4/site-packages
(py3env)$ cp /usr/local/Cellar/opencv3/3.1.0_3/lib/python3.4/site-packages/cv2.so .
```

- cv2 import 確認

Version が表示されれば成功

```
(py3env)$ python -c 'import cv2; print(cv2.__version__)'
3.1.0
```

## スクリプトインストール

```
(py3env)$ cd ~/py3env
(py3env)$ git clone https://gist.github.com/kenzo0107/5d174797a5a222295b5a39f6fa435777
(py3env)$ cp ./5d174797a5a222295b5a39f6fa435777/trimming.py .
```

## スクリプト実行

```
(py3env)$ python trimming.py <img_path>
```

- Before
<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160801/20160801143015.png" width="100%">
</div>

- After
<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160801/20160801143033.png" width="100%">
</div>


革パンも顔認識されてしまう...

が、一応まずできました。


## 今回のスクリプト要点

- 正確な検知数を向上させるべく、スクリプト上の以下 detectMultiScale メソッドのパラメータを調整します。

```
facerect = cascade.detectMultiScale(image_gray, scaleFactor=1.02, minNeighbors=3, minSize=(7,7))
```

| *Item*       | *Value*                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| scaleFactor  | 画像解析する際に随時縮小し解析するその尺度                                                                        |
| minNeighbors | 最小<a href="http://opencv.jp/opencv-2.2/py/objdetect_cascade_classification.html" target="_blank">近傍矩形</a>数 |
| minSize      | 顔部分を認識するためのサイズ (縦,横)                                                                              |

まず最初の第一歩ができました♪
