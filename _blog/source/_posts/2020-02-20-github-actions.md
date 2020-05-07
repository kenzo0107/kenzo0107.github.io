---
title: GitHub Actions で job を 直列 と 並列 実行どっちにしよう？
date: 2020-02-20
tags:
- GitHub Actions
---

## 概要

GitHub Actions で go の errcheck や lint 等、静的解析を実行していますが、
その job の直列構成と並列構成、どちらがいいんだろう？
と悩んだ時の話です。

<!-- more -->

## 悩んだポイント

* 並列構成だと、各 job でコンテナロードが発生し、実行時間は短いが、トータルの実行時間は長くなる。
* 直列構成だと、コンテナロードは 1 回で済み、実行時間は長くなるが、トータルの実行時間は短くなる。

あまりお金かけず実行したいな、というとやはり直列だろうか。

## 実際の構成

### job 直列

```yml
name: static check
on: push

jobs:
  imports:
    name: Imports
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: check
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: imports
        token: ${{ secrets.GITHUB_TOKEN }}

  errcheck:
    name: Errcheck
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: check
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: errcheck
        token: ${{ secrets.GITHUB_TOKEN }}

  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: check
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: lint
        token: ${{ secrets.GITHUB_TOKEN }}

  shadow:
    name: Shadow
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: check
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: shadow
        token: ${{ secrets.GITHUB_TOKEN }}

  staticcheck:
    name: StaticCheck
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: check
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: staticcheck
        token: ${{ secrets.GITHUB_TOKEN }}

  sec:
    name: Sec
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: check
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: sec
        token: ${{ secrets.GITHUB_TOKEN }}
```

### job 並列

```yml
name: static check
on: push

jobs:
  imports:
    name: Imports
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: imports
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: imports
        token: ${{ secrets.GITHUB_TOKEN }}
    - name: errcheck
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: errcheck
        token: ${{ secrets.GITHUB_TOKEN }}
    - name: lint
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: lint
        token: ${{ secrets.GITHUB_TOKEN }}
    - name: shadow
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: shadow
        token: ${{ secrets.GITHUB_TOKEN }}
    - name: staticcheck
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: staticcheck
        token: ${{ secrets.GITHUB_TOKEN }}
    - name: sec
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: sec
        token: ${{ secrets.GITHUB_TOKEN }}
```

## 実際に計測してみた

各構成で 10 回実行してみると 平均時間は以下の通り。

* 並列構成では 1分30秒/job * 6 job = 9分
* 直列構成だと 1分50秒/job * 1 job = 1分50秒

実行速度としては 20 秒くらいの差しかなかった。

トータルでは、 7分50秒の差！

## どっちにしよう？

* GitHub Actions の料金は job のトータル実行時間の従量課金制度なので、直列の方がお金に優しい。
* だが、コミット頻度の少ないプロジェクトなら、並列 で時間を大事にでも良さそう。

今回は実行時間の差が 20 秒程度なので、直列でも全然問題ないレベルですが、
お金との兼ね合いで 直列・並列の使い分けは変わってきそう、と思った話でした。
