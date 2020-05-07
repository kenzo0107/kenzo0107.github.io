---
layout: post
title: 意外と容量食ってた yum cache
date: 2015-11-26
tags:
- yum
---

## yum cache 容量

```
# du -sh /var/cache/yum
155M    /var/cache/yum
```

155MByteある汗


## yum cache 削除

```
# yum clean all
読み込んだプラグイン:fastestmirror
リポジトリーを清掃しています: base epel extras mysql-connectors-community mysql-tools-community mysql56-community nginx treasuredata updates
Cleaning up everything
Cleaning up list of fastest mirrors
```


## yum cache容量確認

```
# du -sh /var/cache/yum
8.0K    /var/cache/yum
```

スッキリ！



サーバから容量不足のアラートで少しでも容量減らしたいときに
役立ちました。

潤沢にサーバスペックを用意できるクライアントでない場合もあるので
地道に必要な知識だと感じました。
