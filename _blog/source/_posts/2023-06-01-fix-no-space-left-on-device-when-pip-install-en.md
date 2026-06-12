---
title: 'fix: Could not install packages due to an EnvironmentError: [Errno 28] No space left on device'
date: 2023-06-01
lang: en
translation_id: fix-no-space-left-on-device-when-pip-install
permalink: en/2023/06/01/fix-no-space-left-on-device-when-pip-install/
cover: /img/cover/2023-06-01-fix-no-space-left-on-device-when-pip-install.svg
category: RaspberryPI
---

A memo for when I got stuck with the following error on an RPi 4B.

```
$ pip3 install xxx

Could not install packages due to an EnvironmentError: [Errno 28] No space left on device
```

Let's try to work around it by temporarily specifying a tmp directory and then running the installation again.

```
$ mkdir $HOME/tmp
$ export TMPDIR=$HOME/tmp

$ pip3 install xxx
```

This worked nicely ♪

That's all.
I hope you find it helpful.
