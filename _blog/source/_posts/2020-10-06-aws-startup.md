---
title: You are not subscribed to this service
tags:
- AWS
date: 2020-10-06
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## 概要

「AWS アカウント開設完了しました！」と言われ、terraform 流してみたら以下の様なエラーが発生。
その時対処した内容を備忘録としてまとめます。

<!-- more -->

```
Error: Error fetching Availability Zones: OptInRequired: You are not subscribed to this service. Please go to http://aws.amazon.com to subscribe.
```

## 結論

AWS のサインアップが完了していなかったことが原因でした。

メニューから [マイ Service Quotas](https://console.aws.amazon.com/servicequotas/home) にアクセスし、
本人確認をしたら解決できました。

![](https://i.imgur.com/CWMs1IV.png)
