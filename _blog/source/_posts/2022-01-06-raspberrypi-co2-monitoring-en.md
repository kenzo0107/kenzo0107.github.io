---
title: Measuring CO2 Levels with a Raspberry Pi Zero & Sending Alerts to LINE
date: 2022-01-06
lang: en
translation_id: raspberrypi-co2-monitoring
permalink: en/2022/01/06/raspberrypi-co2-monitoring/
category: RaspberryPI
cover: https://i.imgur.com/C3bQR5g.jpeg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

<!-- more -->

---

Since I've been spending more time cooped up in my room while working remotely, I'd occasionally be hit by a vague drowsiness. To investigate the CO2 level in my room, I measured it with a Raspberry Pi.

## Schematic

![](https://i.imgur.com/Bo79WIv.png)

Rather than using a breadboard, I wired everything directly to the pins.

### Key Points

- MH-Z19
  - Measures CO2 levels
- Monitor
  - Displays the CO2 level (in real time)
- Raspberry PI
  - Plots the CO2 level measured by the MH-Z19 to Mackerel
  - Displays the CO2 level on the monitor
- Mackerel
  - Graphs the CO2 level as a custom metric
  - Fires an alert when a threshold is exceeded (LINE notification)

## Why I Chose Mackerel as the Plotting Destination

I considered standing up my own server on the Raspberry Pi, but since I wanted to fire alerts when the CO2 level exceeded a threshold, I avoided it because I didn't want to take care of all of that myself.

I had also monitored things with Prometheus before, but it consumes quite a lot of resources, and I wanted to use as few resources as possible.

By the way, Datadog doesn't explicitly support an Agent for the Raspberry Pi, so you have to use a close-enough Agent type. However, I failed many times, and when I reached out to support, they asked me to send logs, which became a hassle.

Mackerel—easy to install, and covering monitoring, custom metrics, and alert configuration all for free—was reassuring, so I went with it.

Just to be clear, I'm not a Mackerel shill.

## What I Bought Beforehand

- Raspberry PI zero W
  - Any type is fine. I'd love to try the pico someday too!

{% affiliate "Raspberry PI zero W" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=JP&ASIN=B07BHMRTTY&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_&tag=kenzo0107-22" "https://www.amazon.co.jp/gp/search/ref=as_li_qf_sp_sr_tl?ie=UTF8&tag=kenzo0107-22&keywords=Raspberry PI Zero W&index=aps&camp=247&creative=1211&linkCode=ur2&linkId=10ed550c0ddab27cc54bb5eb6b39dcff" "https://hb.afl.rakuten.co.jp/ichiba/23166659.8ed3e37c.2316665a.b61e268d/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fmcpjapan%2Fv_35027215483031%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

- MH-Z19C
  - A CO2 measurement module.
  - It can be connected to and used with a Raspberry Pi or Arduino.

{% affiliate "MH-Z19C CO2センサー" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=JP&ASIN=B08SJCWKKG&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_&tag=kenzo0107-22" "https://www.amazon.co.jp/gp/product/B08SJCWKKG/ref=as_li_tl?ie=UTF8&camp=247&creative=1211&creativeASIN=B08SJCWKKG&linkCode=as2&tag=kenzo0107-22&linkId=79d332385d6654819c0b1e2ea67bdce1" "https://hb.afl.rakuten.co.jp/ichiba/23164c18.232f3273.23164c19.8af94ae3/_RTLink33687?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fhandicraft-shop%2F73015987%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

- Jumper wires
  - This time I only used 8, but if you're likely to use them again in the future, you can't go wrong buying some.

{% affiliate "ブレッドボード・ジャンパーワイヤー（メス-メス）（20cm）40本" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=JP&ASIN=B01A4DDUTA&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_&tag=kenzo0107-22" "https://www.amazon.co.jp/gp/offer-listing/B01A4DDUTA/ref=as_li_tl?ie=UTF8&camp=247&creative=1211&creativeASIN=B01A4DDUTA&linkCode=am2&tag=kenzo0107-22&linkId=528edbec8635eb89b1d831aefcc81cab" "https://hb.afl.rakuten.co.jp/ichiba/23166baf.c1f701ce.23166bb0.221d0595/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Falt-mart%2Fb01a4dduta%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

- 0.91 inch 128 \* 32 OLED display

{% affiliate "0.91インチ128 * 32 OLEDディスプレイ" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=JP&ASIN=B09FZ3H9FT&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_&tag=kenzo0107-22" "https://www.amazon.co.jp/gp/product/B09FZ3H9FT/ref=as_li_tl?ie=UTF8&camp=247&creative=1211&creativeASIN=B09FZ3H9FT&linkCode=as2&tag=kenzo0107-22&linkId=aa2d68eafbc16fe55422cf61c323960a" "https://hb.afl.rakuten.co.jp/ichiba/23167b1d.a5b7d2a9.23167b1e.46e4f5d4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Ftanabata77%2F4945318808923%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

### About Pricing

I've linked to Amazon and Rakuten, but [Akizuki Denshi Tsusho](https://akizukidenshi.com/) and [Switch Science](https://www.switch-science.com/) might be cheaper.

It probably depends on the timing, but I get the impression that specialty stores let you buy at lower prices.

If you're after the lowest price, [eBay](https://www.ebay.com/) is also a good option. However, it's an overseas site, so shipping may take a while. It's not suitable if you can't contain your excitement and want to build it right away.

I actually bought my MH-Z19C on eBay, and although it took about a month to arrive, it has been working without any problems.

## Raspberry PI OS

```
$ cat /etc/issue
Raspbian GNU/Linux 10 \n \l
```

There are plenty of guides on installing the OS, so I'll leave that explanation to them. If it's your first time, I recommend "Learning Electronics with Raspberry Pi," which I introduce at the end.

## Configuring with Ansible

I use https://github.com/kenzo0107/raspi-ansible.

- The nodejs part of raspberrypi.yml isn't used this time, so you can remove it.
- The mackerel api key is managed as confidential information, so be sure to update it.
  https://github.com/kenzo0107/raspi-ansible/blob/master/roles/monitoring/vars/secret.yml

```
mackerel_apikey=xxxx
```

### About Each Role

Let me add some notes on the features that are the main focus this time.

- monitoring: Installs and starts the mackerel agent
- co2sensor: Mainly the configuration for retrieving data from the MH-Z19
  - To retrieve data from the MH-Z19, it enables UART so that serial communication is possible.
  - I2C was enabled by default, so it's not included in the Ansible configuration.
    - If it isn't enabled, add `dtparam=i2c_arm=on` to `/boot/confit.txt`.
  - Installs the python module mh_z19 so that the CO2 level can be retrieved via the python module
  - Adds configuration to plot the CO2 level value as a custom metric in mackerel-agent
- co2lcd: Configuration to display the CO2 level on the OLED display
  - Installs the modules needed to display on the screen
  - Adds a python script to display the CO2 level on the screen
  - Registers the above script with systemd and turns it into a daemon
    - The script only updates the display when the MH-Z19 value has changed.

## Mackerel Custom Metrics

![](https://i.imgur.com/CbRXCGy.png)

Since it's the free plan, metrics are only retained for one day, but as long as I can roughly grasp the trends over a single day, it's no real problem.

If I ever want to see seasonal patterns or compare across several days, I'll consider upgrading.

## Configuring Mackerel Monitoring Rules

![](https://i.imgur.com/Bh4MQB0.png)

The custom metric name `cusotm.co2.raspberrypi` comes from the fact that the metric name is set to `co2.raspberrypi` at
https://github.com/kenzo0107/raspi-ansible/blob/master/roles/co2sensor/files/mackerel-co2monitoring.sh#L3.

I set the thresholds as follows.

- warn > 1200 ppm
- critical > 1500 ppm

### A Little Trick

![](https://i.imgur.com/gIuM093.png)

Notifying on temporary spikes produced a lot of noisy alerts, so I configured it to only notify when the condition occurs 5 times in a row.

This was because I once accidentally fired an alert by blowing a deep sigh onto the MH-Z19.

A dystopia that scolds you with CRITICAL just for sighing is not acceptable.

## Configuring Mackerel Alert Notification Destinations

Mackerel supports a variety of platforms. For my own personal reasons—I had consolidated my private notifications into LINE—I went with LINE notifications.

![](https://i.imgur.com/luBn2aV.png)

I also have a private Slack, but I've sometimes mistaken its messages for work-related ones, so I avoided it.

## After Measuring CO2 Levels

The most common causes of rising CO2 levels were the following.

- Multiple people gathering in one room
- Breathing close to the MH-Z19
  - This seems avoidable by placing it where your breath won't blow on it
- Staying in the same room for around 5 hours, barely moving
  - Basically keeping the door shut the whole time

Surprisingly, even running the air conditioner's heater didn't raise the level as much as I'd expected.

Just opening the door and leaving it settles things down quite a bit.

When I want to avoid opening the windows in winter, I get the impression that ventilating by opening the door is also effective.

Conversely, it also got me thinking: when you can't sleep well, maybe raising the CO2 level makes it easier to fall asleep?

- Sleep with the covers pulled over your head
- Sleep huddled together as much as possible

## Overall Impressions

The unfamiliar parts like serial communication and I2C went down fairly smoothly for me, since I'd built a radio-controlled car using the book below.

The following is an excellent book, perfect for beginners getting started with electronics on a Raspberry Pi.

{% affiliate "Raspberry PI で学ぶ電子工作" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=JP&ASIN=4065193397&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_&tag=kenzo0107-22" "https://www.amazon.co.jp/gp/product/4065193397/ref=as_li_tl?ie=UTF8&camp=247&creative=1211&creativeASIN=4065193397&linkCode=as2&tag=kenzo0107-22&linkId=dcd4829e702d3caacbaf3ea349deb358" "https://hb.afl.rakuten.co.jp/ichiba/22ed78a4.becc60fe.22ed78a5.6784b34a/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Frakutenkobo-ebooks%2F5cdcee1da3fd31b8b1de30dd3b8b80f1%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

Since the jumper wires are exposed and can come loose if a child touches them, I'm thinking of making a custom case too ♪

I hope this was helpful.
