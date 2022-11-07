---
layout: post
title: 負荷監視とその原因調査
date: 2016-09-21
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160921/20160921223252.png
tags:
  - MachineLearning
---

## 概要

新卒向けの説明として簡単な備忘録です。

| -_Item_- | -_Explain_-                                       |
| -------- | ------------------------------------------------- |
| %user    | ユーザー空間での CPU 使用率                   |
| %system  | カーネル空間での CPU 使用率                     |
| %iowait  | I/O 待ち時間の割合                                |
| %idle    | I/O 待ち以外で CPU が何もしていない時間の割合 |

## ある日の Zabbix + Grafana の CPU 関連のグラフから原因を調査する。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160921/20160921223252.png" width="100%">
</div>

## ① %iowait が飛び抜けて高い

- %iowait 高
- %user 低
- %system 低

### 原因

スワップが大量に発生している可能性がある。

### 調査手順

#### 1. SwapIn & SwapOut 確認

```sh
$ sar -W
```

#### 2. システム全体のメモリ使用状況

```sh
$ free
```

#### 3. メモリ使用率順でソート後メモリを消費しているプロセスを特定する

```sh
$ top
```

- Shift+p: CPU 使用率順にソート
- Shift+m: メモリ使用率順にソート

##### 実際の原因

定期的に同時刻に発生した為
`crontab -l` でクーロン設定確認したら
誰も知らないバッチが動いていた汗

## ② %user が飛び抜けて高い

- %iowait 低
- %user 高
- %system 低

### 原因

CPU 使用率が高い。

### 調査手順

#### 1. CPU 使用率の高い順にソートしてプロセス特定

```
$ top
```

- Shift+p: CPU 使用率順にソート

ほんの一部分ですが参考になれば何よりです。
以上です。
