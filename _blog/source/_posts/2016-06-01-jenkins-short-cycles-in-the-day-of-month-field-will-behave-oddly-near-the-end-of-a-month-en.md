---
layout: post
title: Jenkins - Short cycles in the day-of-month field will behave oddly near the end of a month
date: 2016-06-01
lang: en
translation_id: jenkins-short-cycles-in-the-day-of-month-field-will-behave-oddly-near-the-end-of-a-month
permalink: en/2016/06/01/jenkins-short-cycles-in-the-day-of-month-field-will-behave-oddly-near-the-end-of-a-month/
tags:
  - Jenkins
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160601/20160601191107.png
---

This is purely a personal memo.

When I tried to schedule only the first Monday of every month in Jenkins, I got:

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160601/20160601191107.png" width="100%">
</div>

```
Short cycles in the day-of-month field will behave oddly near the end of a month
```

Splitting it up as follows makes the error go away.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160601/20160601191211.png" width="100%">
</div>

## Overview

In the United States,
there is a custom of thinking about sales results
in units of 4 or 5 weeks per month.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160601/20160601223531.gif" width="100%">
</div>

In that context, I needed this kind of processing
for cases like wanting a report at the beginning of the month.

That's all.
