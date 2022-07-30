---
title: fix the system should be configured for the legacy camera stack
date: 2022-07-30
category: RaspberryPI
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## 概要

Raspberry PI bullseye で `raspistill -o test.jpg` 実行時に掲題のエラーが発生しました。

```
$ raspistill -o test.jpg

the system should be configured for the legacy camera stack
```

以下公式にしっかりと bullseye 以降は libcamera ベースのスタックのみが含まれている、と記載されていました。

https://www.raspberrypi.com/documentation/accessories/camera.html

> Raspberry Pi OS images from Bullseye onwards will contain only the libcamera-based stack.

## libcamera を利用しよう

```
$ libcamera-still -o test.jpg
```

## legacy camera stack をサポートしても良し

```
sudo raspi-config

// Interface Options を選択
// Legacy Camera Enable/disable legacy camera support
```

![](https://i.imgur.com/pK0JFjt.png)
![](https://i.imgur.com/phPcr6m.png)

以上
参考になれば幸いです。
