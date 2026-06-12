---
layout: post
title: Zabbix Alert Notifications via LINE Notify
date: 2016-10-11
category: Monitoring
lang: en
translation_id: line-notify
permalink: en/2016/10/11/line-notify/
tags:
  - Monitoring
  - LINE Notify
  - Zabbix
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011142249.png
---

## Overview

I configured Zabbix alerts to send messages to LINE using LINE Notify.

## Steps

### Access LINE Notify

[https://notify-bot.line.me/ja/]

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011140750.png" width="100%">
</div>

### Sign up and log in

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011140920.png" width="100%">
</div>

### Register a service

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011141015.png" width="100%">
</div>

There didn't seem to be any actual review of this information, but I went ahead and registered with reasonably accurate details just in case.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011141027.png" width="100%">
</div>

### Select a talk room and issue a token

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011141314.png" width="100%">
</div>

### Copy the issued token

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011141349.png" width="100%">
</div>

### Configure the Zabbix script

{% linkPreview https://github.com/kenzo0107/Zabbix3-LineNotify _blank %}

## Env

- Zabbix 3.0
- CentOS Linux release 7.2.1511 (Core)

## Install Steps

```
[Zabbix-Server]$ cd /usr/lib/zabbix/alertscripts    # AlertScriptsPath
[Zabbix-Server]$ git clone https://github.com/kenzo0107/zabbix3-linenotify
[Zabbix-Server]$ mv zabbix3-slack/line_notify.sh .
[Zabbix-Server]$ rm -r zabbix3-linenotify
[Zabbix-Server]$ chmod 755 line_notify.sh
```

### Configure Media Types

<div style="text-align:center;">
<img src="http://i.imgur.com/mE5dEXI.png" width="100%">
</div>

### Configure Users > Media

<div style="text-align:center;">
<img src="http://i.imgur.com/ovDFnTq.png" width="100%">
</div>

### Notification test

In a test environment, I set up an alert to fire when the number of Nginx processes exceeds one, and here is the result.

<div style="text-align:center;">
<img src="http://i.imgur.com/6B554NX.png" width="100%">
</div>

## Thoughts

I found that some people feel uneasy about joining a talk room, since a LINE account is a private account and they would rather not have it known.

Use it wisely.

## What I'd like to see in the future

Personally, I'd be happy if LINE Notify could deliver notifications via phone call, like Twilio.

First and foremost, here's to a world without incidents. ♪

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161011/20161011213827.jpg" width="100%">
</div>

That's all.
