---
layout: post
title: 3-Minute Face Detection Cooking on macOS X
date: 2018-08-01
categories:
  - [AI]
  - [Infrastructure]
lang: en
translation_id: face-detector
permalink: en/2018/08/01/face-detector/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160801/20160801143015.png
tags:
- MachineLearning
---

## Overview

I'm planning to build a toy that uses a Raspberry Pi so that when it decides you're a family member, it says "Welcome home, master," and when you're not family, it says "I'm calling the cops."

As a preliminary step to a preliminary step, let's try detecting a face in a still image.

By the way, face detection and face recognition mean completely different things.


- Face detection ... detecting the part of an image that is a face.
- Face recognition ... determining that a face belongs to a specific person.


For setting up the environment, please refer to my previous article.

{% linkPreview https://kenzo0107.hatenablog.com/entry/2016/07/28/143429 _blank %}




## Environment

- MacOSX 10.11.5
- Python 3

## Installing CV2

- Install cv2 with homebrew

```shell
$ brew tap homebrew/science
$ brew install opencv3 --with-python3
```

- Use Python 3

```
$ source ~/py3env/bin/active
(py3env)$
```

- Copy cv2.so into pip's site-packages

```
(py3env)$ cd ~/py3env/lib/python3.4/site-packages
(py3env)$ cp /usr/local/Cellar/opencv3/3.1.0_3/lib/python3.4/site-packages/cv2.so .
```

- Verify the cv2 import

If the version is displayed, it worked.

```
(py3env)$ python -c 'import cv2; print(cv2.__version__)'
3.1.0
```

## Installing the Script

```
(py3env)$ cd ~/py3env
(py3env)$ git clone https://gist.github.com/kenzo0107/5d174797a5a222295b5a39f6fa435777
(py3env)$ cp ./5d174797a5a222295b5a39f6fa435777/trimming.py .
```

## Running the Script

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


The leather pants got recognized as a face too...

but for now, it basically works.


## Key Points of This Script

- To improve the accuracy of the detection count, we tune the parameters of the following detectMultiScale method in the script.

```
facerect = cascade.detectMultiScale(image_gray, scaleFactor=1.02, minNeighbors=3, minSize=(7,7))
```

| *Item*       | *Value*                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| scaleFactor  | The scale by which the image is progressively shrunk during analysis                                             |
| minNeighbors | The minimum number of <a href="http://opencv.jp/opencv-2.2/py/objdetect_cascade_classification.html" target="_blank">neighbor rectangles</a> |
| minSize      | The size for recognizing the face part (height, width)                                                            |

And there we have it: the very first step is done ♪
