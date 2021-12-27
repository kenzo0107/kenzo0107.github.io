---
layout: post
title: Jenkins 死亡時の対策
date: 2016-08-15
---

スレッドが死亡するとこんな表示に...

![](https://i.imgur.com/qds0pDI.png)


原因は

```
No space left on device
```

デバイスの容量不足でした。。

## 対策

以下 cleanBuild.sh を作成しビルド掃除をするようにしました。

{% gist kenzo0107/45731991b6462dd56a93ee9895215129 %}

過去ビルド履歴が消去されてしまいますが
<span style="color:red">低コスト運用</span>の為、
背に腹は変えられない！

ビルド履歴はむしろ、Slackに通知してあげてるので
Slackで担保されている、
ということにしよう。
