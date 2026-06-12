---
title: Installing Go on a Raspberry Pi
date: 2022-05-15
lang: en
translation_id: install-golang-on-raspberrypios
permalink: en/2022/05/15/install-golang-on-raspberrypios/
cover: /img/cover/2022-05-15-install-golang-on-raspberrypios.svg
category: RaspberryPI
---

Here are the steps to install Go on a Raspberry Pi.
We'll install version 1.18.2, the latest as of 2022.05.15.

```console
wget https://golang.org/dl/go1.18.2.linux-armv6l.tar.gz
sudo tar -C /usr/local -xzf go1.18.2.linux-armv6l.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export PATH=$HOME/go/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

// Check the version
go version
```

* Verified with the Raspberry Pi OS Bullseye 2022.04.04 release.
