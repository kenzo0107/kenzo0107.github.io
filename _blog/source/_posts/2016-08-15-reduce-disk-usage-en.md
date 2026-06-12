---
layout: post
title: When du shows the device is almost full and you have to delete something
date: 2016-08-15
category: Infrastructure
lang: en
translation_id: reduce-disk-usage
permalink: en/2016/08/15/reduce-disk-usage/
cover: /img/cover/2016-08-15-reduce-disk-usage.svg
---

Oops!
It's completely full...

That's the situation I ran into.
When I tried to install a certain module, it filled up the disk all at once.

```sh
ファイルシス   サイズ  使用  残り 使用% マウント位置
/dev/xvda1       8.0G  8.0G  0M   100% /
devtmpfs         3.9G     0  3.9G    0% /dev
tmpfs            3.7G     0  3.7G    0% /dev/shm
tmpfs            3.7G   17M  3.7G    1% /run
tmpfs            3.7G     0  3.7G    0% /sys/fs/cgroup
```

## Checking file sizes within directories

- 1. Move to the target device and check file sizes
- 2. From there, check the locations where files are large

Repeating steps 1 and 2 above makes it easier to pin down the cause.

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

You could also search for archive files that are no longer needed after extraction, such as -name '*.tar.gz'.

Please also refer to my earlier post.
The yum cache can quietly grow huge before you even notice.

{% linkPreview https://kenzo0107.github.io/2015/11/25/2015-11-26-cleanup-yum-cache/ %}

After deleting various things,
I managed to free up about 30%. Phew.

I really need to keep a close eye on monitoring.
