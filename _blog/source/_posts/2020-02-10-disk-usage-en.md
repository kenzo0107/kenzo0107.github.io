---
title: How to Investigate When Disk Usage Increases
tags:
- Linux
date: 2020-02-10
categories:
  - [AWS]
  - [Infrastructure]
lang: en
translation_id: disk-usage
permalink: en/2020/02/10/disk-usage/
cover: /img/cover/2020-02-10-disk-usage.svg
---


## Notes

An alert was raised for increasing disk usage, so I put together the steps I took to investigate it.

<!-- more -->

```sh
$ df -h

Filesystem      Size  Used Avail Use% Mounted on
devtmpfs        2.0G   60K  2.0G   1% /dev
tmpfs           2.0G     0  2.0G   0% /dev/shm
/dev/xvda1       20G  8.6G   11G  90% /   ★ ここ高い！
```

## Investigation Method

```sh
$ cd /

// ① Show the top 10 directories with the highest disk usage in the current directory
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

// ② Move into the directory with the highest usage
$ cd ./var
```

By repeating steps ① and ② above, I investigate which directory is consuming the most space.

The `du` options used are as follows:

* -m : Display in MB
* -s : Display the total

Normally I use `-h` to make the output easier to read, but during this investigation a mix of MB and kB gets displayed when sorting, which makes it harder to interpret intuitively, so I used `-ms`.
