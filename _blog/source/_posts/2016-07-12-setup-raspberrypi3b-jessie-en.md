---
layout: post
title: Setting Up Raspbian Jessie on the Raspberry Pi 3 B
date: 2016-07-12
category: RaspberryPI
lang: en
translation_id: setup-raspberrypi3b-jessie
permalink: en/2016/07/12/setup-raspberrypi3b-jessie/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710180905.png
tags:
- RaspberryPI
---

## Overview

Thanks to the free trial of Amazon Prime,
I bought a Raspberry Pi 3 B!

To get it ready for development,
I've put together this setup guide.

## Environment

- MacBook Pro : MacOSX 10.11.5
- Wifi environment

## What I Bought

Here are the bare essentials.

Total: 8,459 yen

* Raspberry Pi 3 Model B (with case): 5,980 yen

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B01CSFZ4JG/kenzo0107-22/ _blank %}

* SD card (32GB) : 1,080 yen

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B008UR8TS0/kenzo0107-22/ _blank %}

* Power supply (2.5A compatible): 1,399 yen

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B01E6YLFAO/kenzo0107-22/ _blank %}

I had thought a PC's USB port might be enough for power,
but since the Pi 3 B's recommended current is 2.5 A, a 2.5 A capable power supply became necessary.

Other items

You probably already have most of these on hand.
They're probably tossed somewhere in the junk pile at your office.

* HDMI cable : 691 yen

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B00HQY7U56/kenzo0107-22/ _blank %}

* USB keyboard : 530 yen

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B005LL9J9G/kenzo0107-22/ _blank %}

* USB mouse : 698 yen

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B005EJH6RW/kenzo0107-22/ _blank %}


Even with the extras, it comes to 10,378 yen. Well, there's no turning back now.



Let's get right into the setup steps.

## Formatting the SD Card

### Installing the SD Card Formatter App

Download the SD card formatter app from the site below and format the card.

[SD Memory Card Formatter](https://www.sdcard.org/downloads/formatter/)

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710180905.png" width="100%">
</div>

On a Mac, select `for Mac`,
accept the agreement, and download.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710181230.png" width="100%">
</div>

### Checking the File System

Since you need to know which SD card to format,
run the following from the terminal before inserting the SD card.

```shell
$ df -h
```

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710182258.png" width="100%">
</div>

#### Insert the SD Card into the Mac

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710181732.jpg" width="100%">
</div>

* The MacBook Air has no SD card slot, so you'll need a card reader to read it.

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B00WFTCE0I/kenzo0107-22/ _blank %}

Run `df -h` again, and
the newly added entry is the SD card's file system.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710183107.png" width="100%">
</div>

### Formatting with SDFormatter

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710184814.png" width="100%">
</div>

* I named mine "RASP3B".

Run `df -h` once more.

You can see that the disk image name has changed.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160710/20160710185115.png" width="100%">
</div>

That completes formatting the SD card.


## Writing Raspbian Jessie (Latest OS) to the Disk Image

### Downloading Raspbian Jessie

Install the latest Raspbian OS from the official site.
This takes a few minutes.

[Raspbian](https://www.raspberrypi.org/downloads/raspbian/)

```shell
$ cd ~/Downloads
$ unzip 2016-05-27-raspbian-jessie.zip
$ ls -al 2016-05-27-raspbian-jessie.*
-rw-r--r--@ 1 kenzo  staff  4019191808  5 27 20:50 2016-05-27-raspbian-jessie.img
-rw-r--r--@ 1 kenzo  staff  1393896178  7 10 19:27 2016-05-27-raspbian-jessie.zip
```

### Unmounting

Unmount the target image by taking the file system name `/dev/disk2s1` you checked earlier and removing the `s1`.

```shell
$ diskutil umountDisk /dev/disk2
```

### Writing the Downloaded Image

```shell
$ sudo dd if=/Users/<User>/Downloads/2016-05-27-raspbian-jessie.img of=/dev/rdisk2 bs=1m
```

* Adding an `r` prefix to `disk2` runs in unbuffered mode for a speed boost.
* bs=1m ... the size written at a time

It took 257 seconds. Phew.

That's how I created the SD card to insert into the Raspberry Pi.

### Ejecting the SD Card

```
$ diskutil eject /dev/disk2
```

## Connecting Everything to the Raspberry Pi 3

<span style="color:red">Do not supply power to the Raspberry Pi until everything is connected.</span>

### Inserting the SD Card

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711220046.png" width="100%">
</div>

### Connecting the USB Keyboard/Mouse, SD Card, and Power

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711220523.png" width="100%">
</div>

After confirming everything is firmly plugged in,
it's finally time to connect the power adapter.

It's on!

Something started loading!

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711221146.jpg" width="100%">
</div>

* In my home, the TV doubles as a display.

Oh wow, the GUI home screen came up!

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711221153.jpg" width="100%">
</div>

Success, for starters!

## Configuring the Raspberry Pi

#### Click Menu > Preferences > Raspberry Pi Configuration

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711230714.jpg" width="100%">
</div>

#### Making the Full SD Card Capacity Available

- Click the `Expand Filesystem` button on the `System` tab.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711231408.png" width="100%">
</div>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711231657.png" width="100%">
</div>

This makes the full capacity of the SD card available.

#### Locale Settings

- Click the `Set Locale` button on the `Localisation` tab.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711231758.png" width="100%">
</div>

- `Language` : select ja (Japanese)
- `Country` : select JP (Japan)
- `Character Set` : select UTF-8

Make the selections above and click the `OK` button.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711232125.png" width="100%">
</div>

#### Timezone Settings

- `Localisation` tab > click the `Set Timezone` button

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711232531.png" width="100%">
</div>

When you click the `Set Timezone` button again, Asia/Tokyo is already selected.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711232604.jpg" width="100%">
</div>

#### Keyboard Settings

- Click the `Set Keyboard` button on the `Localisation` tab.

- `Country` : select `Japan`
- `Variant` : select `Japanese`

Make the selections above and click the `OK` button.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711232741.jpg" width="100%">
</div>

#### Wifi Settings

- Select the Wifi network, enter the passphrase, and connect to Wifi.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711233030.png" width="100%">
</div>

- You can confirm the Wifi connection.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711233304.png" width="100%">
</div>

### SSH Connection from macOS to the Raspberry Pi

- Launch Terminal on the Raspberry Pi.

```shell
$ ifconfig
```

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160712/20160712000448.png" width="100%">
</div>

- SSH into the Raspberry Pi from the Mac.

```shell
[MacOSX local]$ ssh pi@192.168.xxx.xxx
pi@192.168.11.18's password: <デフォルトパスワードは "raspberry">

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Mon Jul 11 23:08:51 2016
```

The SSH login was confirmed!


## Addendum (2016-07-08)

I realized afterward that
instead of going to the trouble of photographing the screen with my iPhone,
I should have just used Remote Desktop to grab clean screenshots...

So,
while I was at it with SSH, I installed tightvncserver, which provides Remote Desktop functionality.

```
$ sudo apt-get install tightvncserver
$ vncserver

// 起動
$ vncserver :1
```

- Specify the hostname you configured to Remote Desktop in and share the screen.

```shell
vnc://raspberrypi.local:5901
```

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160712/20160712002819.png" width="100%">
</div>


### Opening a Browser

You can see it's connected to the internet.

However,
every bit of Japanese text shows up as tofu (mojibake boxes)...

I ran into the same kind of issue before with Zabbix when the Japanese fonts were missing...

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711233353.jpg" width="100%">
</div>

I need to install Japanese fonts.



## Installing Japanese Fonts on the Raspberry Pi

```shell
$ sudo apt-get update
$ sudo apt-get install fonts-vlgothic
$ sudo apt-get install ibus-mozc

// 再起動
$ sudo shutdown -r now
```

## Opening the Browser Again

- Japanese text is now displayed correctly.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711235220.jpg" width="100%">
</div>

- To enable Japanese input, select `日本語 - Mozc`.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160711/20160711235039.png" width="100%">
</div>


That completes the setup.

Thank you for reading.


{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/B0155WN7CK/kenzo0107-22/ _blank %}
