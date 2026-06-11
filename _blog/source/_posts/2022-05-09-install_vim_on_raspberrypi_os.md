---
title: Raspberry PI OS で vim インストール
date: 2022-05-09
cover: /img/cover/2022-05-09-install_vim_on_raspberrypi_os.svg
category: RaspberryPI
---

備忘録です。

Raspberry PI OS (32-bit) Bullseye で vim インストールした際のメモです。

```
sudo apt-get --purge remove vim-common vim-tiny
sudo apt-get install vim
```
