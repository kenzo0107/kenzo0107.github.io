---
title: Running motion on Raspberry Pi bullseye and viewing it in a browser
date: 2022-07-16
lang: en
translation_id: raspberrypi-bullseye-motion
permalink: en/2022/07/16/raspberrypi-bullseye-motion/
cover: /img/cover/2022-07-16-raspberrypi-bullseye-motion.svg
category: RaspberryPI
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## Overview

We will start motion on Raspberry Pi bullseye and view it in a browser.

<!-- more -->

## Configuring the RPi

This can be done in just a few lines.

```console
$ wget https://github.com/Motion-Project/motion/releases/download/release-4.4.0/bullseye_motion_4.4.0-1_armhf.deb
$ sudo apt install -y ./bullseye_motion_4.4.0-1_armhf.deb

$ sudo vim /etc/motion/motion.conf
- stream_localhost on
+ stream_localhost off
```

## Working on a machine other than the RPi

```console
$ open <raspi ip>:8081
```

That's all.
I hope this is helpful.
