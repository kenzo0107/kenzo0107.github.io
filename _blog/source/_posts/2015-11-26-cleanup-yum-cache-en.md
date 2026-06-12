---
layout: post
title: The yum cache was eating up more disk space than I expected
date: 2015-11-26
category: Infrastructure
lang: en
translation_id: cleanup-yum-cache
permalink: en/2015/11/26/cleanup-yum-cache/
cover: /img/cover/2015-11-26-cleanup-yum-cache.svg
tags:
- yum
---

## yum cache size

```
# du -sh /var/cache/yum
155M    /var/cache/yum
```

155 MB, yikes.


## Clearing the yum cache

```
# yum clean all
読み込んだプラグイン:fastestmirror
リポジトリーを清掃しています: base epel extras mysql-connectors-community mysql-tools-community mysql56-community nginx treasuredata updates
Cleaning up everything
Cleaning up list of fastest mirrors
```


## Checking the yum cache size again

```
# du -sh /var/cache/yum
8.0K    /var/cache/yum
```

All cleaned up!



This came in handy when I got a low-disk-space alert from a server and wanted to free up even a little bit of space.

Since you don't always get to work with clients who can provide generous server specs, I felt this is a piece of knowledge worth keeping in your back pocket.
