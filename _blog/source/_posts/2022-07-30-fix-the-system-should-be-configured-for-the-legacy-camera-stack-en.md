---
title: 'Fix: the system should be configured for the legacy camera stack'
date: 2022-07-30
lang: en
translation_id: fix-the-system-should-be-configured-for-the-legacy-camera-stack
permalink: en/2022/07/30/fix-the-system-should-be-configured-for-the-legacy-camera-stack/
cover: /img/cover/2022-07-30-fix-the-system-should-be-configured-for-the-legacy-camera-stack.svg
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

When I ran `raspistill -o test.jpg` on Raspberry Pi Bullseye, I got the error in the title.

```
$ raspistill -o test.jpg

the system should be configured for the legacy camera stack
```

As clearly stated in the official documentation below, from Bullseye onwards only the libcamera-based stack is included.

https://www.raspberrypi.com/documentation/accessories/camera.html

> Raspberry Pi OS images from Bullseye onwards will contain only the libcamera-based stack.

<!-- more -->

## Use libcamera

```
$ libcamera-still -o test.jpg
```

## Or you can enable support for the legacy camera stack

```
sudo raspi-config

// Select Interface Options
// Legacy Camera Enable/disable legacy camera support
```

That's it.
I hope this helps.
