---
layout: post
title: Collecting Samples by Detecting Faces in Multiple Image Files and Trimming the Face Regions
date: 2016-08-04
category: AI
lang: en
translation_id: detect-face-triming-sample
permalink: en/2016/08/04/detect-face-triming-sample/
tags:
  - MachineLearning
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160809/20160809105400.gif
---

## Previously

I implemented a feature that detects faces
in a specified image file.

{% linkPreview http://kenzo0107.hatenablog.com/entry/2016/08/01/215648 _blank %}

## This Time

First, let's collect sample images.
I scraped and downloaded them from the web using BeautifulSoup.
(I'll publish the script once I've cleaned it up.)

Roughly 13 images.
Since I eventually want to do machine learning I'd like to have more,
but this time the main focus is introducing the script,
so this many will do.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160804/20160804142005.png" width="100%">
</div>

## Trimming the Face Regions

Here's the script. (for Python 3)

{% gist kenzo0107/517258ab06715f73c4a3457e87fd25a5 %}

```
// clone
$ git clone https://gist.github.com/kenzo0107/517258ab06715f73c4a3457e87fd25a5
$ cd 517258ab06715f73c4a3457e87fd25a5

// スクリプト実行
$ python collect_face_samples.py -p <サンプル画像が格納されているディレクトリ>
```

Here's what running the script actually looks like.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160804/20160804143008.png" width="100%">
</div>

You can see that the trimmed images are stored in the `_trimming` folder.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160804/20160804142513.png" width="100%">
</div>

They are stored in the following order by No.

| No  | Item       | Explain                                                                                                                                   |
| --- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | \_resize   | Resizes images of various sizes uniformly to a height of 500 or less.                                                                     |
| 2   | \_addbox   | Stores images with a box drawn around the face. This is for verifying where in each image the face was detected.                          |
| 2   | \_trimming | Stores images where the face region from the files in \_addbox has been trimmed and resized to 64×64,<br/>and additionally rotated by a few degrees. |

I hope this helps make collecting samples easier.
