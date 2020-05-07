---
title: ディスク使用量が増加した際の調査方法
tags:
- Linux
date: 2020-02-10
---


## 備忘録

ディスク使用量増加のアラートが上がったので調査した際の手順をまとめました。

<!-- more -->

```sh
$ df -h

Filesystem      Size  Used Avail Use% Mounted on
devtmpfs        2.0G   60K  2.0G   1% /dev
tmpfs           2.0G     0  2.0G   0% /dev/shm
/dev/xvda1       20G  8.6G   11G  90% /   ★ ここ高い！
```

## 調査法

```sh
$ cd /

// ① 現ディレクトリで ディスク使用率の高いベスト 10 を発表
$ sudo du -ms ./* | sort -nr | head -10

5047    ./var
1355    ./usr
1249    ./home
642     ./opt
194     ./lib
70      ./boot
42      ./tmp
20      ./lib64
13      ./etc
12      ./sbin

// ② 使用率の一番高いディレクトリへ移動
$ cd ./var
```

以上の ①, ② の繰り返しによってどのディレクトリが高いか調査してます。


`du` の option は以下

* -m : MB 表示
* -s : 総計表示

普段は `-h` で見やすくしてますが、 今回の調査時には sort した際に MB や kB が混ざって表示され、直感的にわかり辛くなるので、 -ms にしてます。
