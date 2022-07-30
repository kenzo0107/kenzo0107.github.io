---
title: Raspberry PI bullseye で motion を起動しブラウザで表示する
date: 2022-07-16
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

Raspberry PI bullseye で motion 起動しブラウザで表示します。

## RPi の設定

数行で完了します。

```console
$ wget https://github.com/Motion-Project/motion/releases/download/release-4.4.0/bullseye_motion_4.4.0-1_armhf.deb
$ sudo apt install -y ./bullseye_motion_4.4.0-1_armhf.deb

$ sudo vim /etc/motion/motion.conf
- stream_localhost on
+ stream_localhost off
```

## RPi 外のマシンの作業

```console
$ open <raspi ip>:8081
```

以上
参考になれば幸いです。
