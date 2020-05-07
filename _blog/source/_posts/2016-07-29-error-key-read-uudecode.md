---
layout: post
title: "cat id_rsa.pub >> authorized_keys したつもりが error key_read: uudecode が出るエラー対応"
date: 2016-07-29
tags:
- ssh
---

```
$ tail -f /var/log/secure
```

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160729/20160729111616.png" width="100%">
</div>

## 結論

「/n」 が入ってしまっていました。
「/n」削除すれば問題なくなりました。

多少編集した際に混入させてしまったのかも。。
