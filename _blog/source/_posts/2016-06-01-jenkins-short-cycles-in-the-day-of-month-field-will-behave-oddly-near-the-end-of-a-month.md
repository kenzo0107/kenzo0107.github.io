---
layout: post
title: Jenkins - Short cycles in the day-of-month field will behave oddly near the end of a month
date: 2016-06-01
tags:
  - Jenkins
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160601/20160601191107.png
---

完全なる備忘録です。

Jenkins で 毎月第 1 月曜日のみ設定しようとしたら

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160601/20160601191107.png" width="100%">
</div>

```
Short cycles in the day-of-month field will behave oddly near the end of a month
```

次の様に分けるとエラーが消えます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160601/20160601191211.png" width="100%">
</div>

## 概要

アメリカでは
月間の期間を 4,5 週間の単位で
売り上げの結果を考える慣習があります。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160601/20160601223531.gif" width="100%">
</div>

その際に月初にレポートが欲しい
なんてときに今回このような処理をする必要がありました。

以上です。
