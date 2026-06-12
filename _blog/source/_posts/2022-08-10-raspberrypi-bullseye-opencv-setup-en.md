---
title: I Built a Camera That Detects Smiles with RPi OpenCV and Notifies Slack
date: 2022-08-10
lang: en
translation_id: raspberrypi-bullseye-opencv-setup
permalink: en/2022/08/10/raspberrypi-bullseye-opencv-setup/
cover: /img/cover/2022-08-10-raspberrypi-bullseye-opencv-setup.svg
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

Previously, I wrote about how the settings around the camera module changed on RPi bullseye.

{% linkPreview https://kenzo0107.github.io/2022/07/29/2022-07-30-fix-the-system-should-be-configured-for-the-legacy-camera-stack/ %}

I looked at several articles online about setting up OpenCV on RPi, but many of them targeted versions earlier than bullseye, and they often didn't work.

For that reason, I'm summarizing the setup for bullseye here.

<!-- more -->

## Choosing bullseye 64-bit with Desktop

I chose the `64-bit` version with `Desktop`.

Headless would have been fine too, but I wanted to use OpenCV while showing the detected faces on a monitor connected to the RPi, so I went with Desktop.

I'll note the OS information for the environment I used.

```console
$ lsb_release -a

No LSB modules are available.
Distributor ID: Debian
Description:    Debian GNU/Linux 11 (bullseye)
Release:        11
Codename:       bullseye

$ uname -a

Linux pi3b-smile 5.15.32-v8+ #1538 SMP PREEMPT Thu Mar 31 19:40:39 BST 2022 aarch64 GNU/Linux
```

## Procedure

Run the following commands.

```console
sudo raspi-config

// Select Interface Options
// Legacy Camera Enable/disable legacy camera support

// Enable Legacy Camera and reboot the RPi

// ↓↓↓ After reboot ↓↓↓

// Install the following packages used for face recognition
sudo apt install libatlas-base-dev libqt4-test libjasper1 libhdf5-dev

// Install OpenCV with the contrib modules included
$ sudo pip install opencv-contrib-python

// Verify that OpenCV was installed
$ python
// cv2 can be imported without errors
>>> import cv2
>>> cv2.__version__
'4.6.0'

// Get the Git repository that bundles OpenCV face detection/recognition samples
$ git clone https://github.com/Mjrovai/OpenCV-Face-Recognition
$ cd OpenCV-Face-Recognition/FaceDetection/
$ python faceDetection.py
```

## Conclusion

There were changes around the camera on bullseye, so getting OpenCV configured was quite a struggle, but in the end I found it could be done very simply.

That's all.
I hope this helps.
