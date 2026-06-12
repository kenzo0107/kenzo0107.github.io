---
layout: post
title: Configuring Android Studio AVD (Emulator) to Connect to the Desktop's localhost
date: 2016-03-09
category: Infrastructure
lang: en
translation_id: android-studio-avd-from-desktop-to-localhost
permalink: en/2016/03/09/android-studio-avd-from-desktop-to-localhost/
tags:
  - Android
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160309/20160309222944.png
---

## Overview

I'm developing an Android app with Android Studio on Mac OS X.

I'm using Volley from an AVD (Android Virtual Device) to hook up the API to a server built in a local environment such as MAMP, Vagrant, or Docker.

Simply opening the web browser (the globe icon) on the emulator and specifying localhost won't let you connect.

That required a little extra step, so here is the procedure.

## Configuration

- While the <span style="color: #ff0000">AVD is running</span> in Android Studio, run the following shell command.

{% gist kenzo0107/7a51b8055e32ebcf87df %}

That's all.
