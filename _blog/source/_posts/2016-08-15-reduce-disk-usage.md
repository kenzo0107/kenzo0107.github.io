---
layout: post
title: du でデバイスの使用率が残り少ない、何か消さなきゃいけないというときに
date: 2016-08-15
---

あっ！
使い切ってる...

という事象が発生しました。
あるモジュールを導入しようとした際に一気に使い切ってしまった。。

```sh
ファイルシス   サイズ  使用  残り 使用% マウント位置
/dev/xvda1       8.0G  8.0G  0M   100% /
devtmpfs         3.9G     0  3.9G    0% /dev
tmpfs            3.7G     0  3.7G    0% /dev/shm
tmpfs            3.7G   17M  3.7G    1% /run
tmpfs            3.7G     0  3.7G    0% /sys/fs/cgroup
```

## ディレクトリ内のファイル容量チェック

- 1. 対象デバイスに移動し、ファイル容量チェック
- 2. そこでファイルのサイズが大きい箇所をチェック

上記 1,2 を繰り返していくと原因が特定がしやすい。

```
対象デバイスに移動し、ファイル容量チェック
$ cd /
$ sudo du -sh * | sort -nr

385M    root
267M    opt
117M    home
79M     boot
22M     etc
17M     run
3.1G    usr
2.7M    tmp
4.3G    var   ← /var がサイズが大きい
0       sys
0       srv
0       sbin
0       proc
0       mnt
0       media
0       lib64
0       lib
0       dev
0       bin

$ sudo find /var -size +100M -exec ls -lh {} \;
```

-name '*.tar.gz' など解凍後不要になったアーカイブファイルを検索するもよし。

以前の記事もご参照ください。
yum cache は知らず知らずのうちに大容量になっていることもあります。

{% linkPreview https://kenzo0107.github.io/2015/11/25/2015-11-26-cleanup-yum-cache/ %}

諸々削除して
30 % くらいは削れた汗

監視をしっかりせねば
