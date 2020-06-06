---
title: go.uber.org/multierr で error をまとめる
category: Go
category: Go
tags:
- Go
date: 2020-03-31
---

こんなツイートを見つけた！

{% twitter https://twitter.com/tenntenn/status/1239750083815411712 %}

これはやってみたい！

と早速取り掛かって、これは知って良かった！という内容の一つがコチラ！

<!-- more -->

複数のエラーをまとめる処理！

{% gist kenzo0107/f886b4d8e273e4337c9a38eecb5ffff4 %}

for 内で発生したエラーをまとめて後で表示する、という処理を自前で用意してたけど、体系的にパッケージとして整備していたのがあったとは♪

知識のアップデート完了

## 参考

[Golangのエラー処理とpkg/errors](https://deeeet.com/writing/2016/04/25/go-pkg-errors/)
