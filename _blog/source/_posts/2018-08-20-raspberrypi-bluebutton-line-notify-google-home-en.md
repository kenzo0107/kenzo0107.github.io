---
layout: post
title: Solving the "Did the Dishwasher Finish?" Problem with RaspberryPI + BlueButton + LINE Notify + Google Home
date: 2018-08-20
lang: en
translation_id: raspberrypi-bluebutton-line-notify-google-home
permalink: en/2018/08/20/raspberrypi-bluebutton-line-notify-google-home/
tags:
  - RaspberryPI
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180820/20180820223225.jpg
---

## Overview

<p>The <b>problem of not being able to tell whether the dishwasher had finished</b> was happening a lot in our home.</p>

<p>This is the story of how I solved it with RaspberryPI + BluetButton + LINE Notify + Google Home.</p>

<!-- more -->

## What's the problem?

<p>In our home, we run the dishwasher once it's reasonably full, so the time we run it is never fixed.</p>

<p>Because of that, every now and then, when my wife or I pulled out the dishwasher we'd wonder, "Wait, are these the washed ones?" Suspicion ran high and things got tense, and our son would come running over to give us a Dragon Stop more often than I'd like.</p>

<p>If only we had some kind of mechanism that kept a record, something you could just look at and know!<br/>
That would be a huge help, so I started thinking about whether I could solve it with engineering.</p>

## The solution

<p>I made it so the start time gets posted to a LINE group as a record.<a href="#f-26e0fc97" name="fn-26e0fc97" title="curl 叩ければ、後々 Slack でも何でも、家族みんなが見る所に通知すれば良いかなと思ったので">*1</a></p>

<p>I wanted to make that notification mechanism simple enough to handle with a single press of a button,<br/>
so I decided to implement it with a BlueButton that I could pair with the Raspberry PI I already had at home.</p>

## How it works

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180817/20180817003256.png" width="100%">
</div>

<ol>
<li>When you start the dishwasher, press the BlueButton.</li>
<li>Pressing the BlueButton passes the "button pressed" information to the Bluetooth-paired Raspberry PI.</li>
<li>A script running on the Raspberry PI that detects whether the BlueButton was pressed catches it.</li>
<li>Triggered by step 3, LINE Notify sends a notification to LINE.</li>
<li>Triggered by step 3, Google Home speaks a "the dishwasher has started" message.<a href="#f-08674585" name="fn-08674585" title="Google Home はあくまでスピーカー代りです。">*2</a></li>
</ol>

<p>The processing branches depending on how long you press.</p>

<ul>
<li><span style="color: #0000cc"><b>Long press</b></span> = notify Google Home and Line that the dishwasher has started</li>
<li><span style="color: #286f2c"><b>Short press</b></span> = read out the dishwasher start time</li>
</ul>

## What I bought

<p><div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01NAHBSUD/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/51FuxBMPonL._SL160_.jpg" class="hatena-asin-detail-image" alt="Raspberry Pi 3 Model B V1.2 (日本製) 国内正規代理店品" title="Raspberry Pi 3 Model B V1.2 (日本製) 国内正規代理店品"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01NAHBSUD/kenzo0107-22/">Raspberry Pi 3 Model B V1.2 (日本製) 国内正規代理店品</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> Raspberry Pi</li><li><span class="hatena-asin-detail-label">発売日:</span> 2016/02/29</li><li><span class="hatena-asin-detail-label">メディア:</span> Tools & Hardware</li><li><a href="https://d.hatena.ne.jp/asin/B01NAHBSUD/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div>
<div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B0794XCHT3/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/51za6FPlcyL._SL160_.jpg" class="hatena-asin-detail-image" alt="Punasi Raspberry Pi3/2/B+/B 5V 2.5A アダプタ 電源 マイクロUSB Boseスピーカー Androidタブレット スマートフォン" title="Punasi Raspberry Pi3/2/B+/B 5V 2.5A アダプタ 電源 マイクロUSB Boseスピーカー Androidタブレット スマートフォン"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B0794XCHT3/kenzo0107-22/">Punasi Raspberry Pi3/2/B+/B 5V 2.5A アダプタ 電源 マイクロUSB Boseスピーカー Androidタブレット スマートフォン</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> Punasi</li><li><span class="hatena-asin-detail-label">メディア:</span> エレクトロニクス</li><li><a href="https://d.hatena.ne.jp/asin/B0794XCHT3/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div>
<div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01LA7EYS0/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/41Fw-FkJNJL._SL160_.jpg" class="hatena-asin-detail-image" alt="GOCOUP スマートフォン用 カメラリモコン A-Bシャッター Bluetoothリモートfor iPhone & Android 日本語説明書付き(黒)" title="GOCOUP スマートフォン用 カメラリモコン A-Bシャッター Bluetoothリモートfor iPhone & Android 日本語説明書付き(黒)"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01LA7EYS0/kenzo0107-22/">GOCOUP スマートフォン用 カメラリモコン A-Bシャッター Bluetoothリモートfor iPhone & Android 日本語説明書付き(黒)</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> GOCOUP</li><li><span class="hatena-asin-detail-label">メディア:</span> エレクトロニクス</li><li><a href="https://d.hatena.ne.jp/asin/B01LA7EYS0/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div>
<div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01N10FAFU/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/31u3OTwzfSL._SL160_.jpg" class="hatena-asin-detail-image" alt="Google Home" title="Google Home"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01N10FAFU/kenzo0107-22/">Google Home</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> google</li><li><span class="hatena-asin-detail-label">メディア:</span> オフィス用品</li><li><a href="https://d.hatena.ne.jp/asin/B01N10FAFU/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div></p>

<p>The BlueButton was about 100 yen on Amazon ♪ Easy on the wallet!</p>

<p>Google Home is really just a stand-in for a speaker, used to confirm when the button is pressed.<br/>
You could connect a USB speaker, or blink an LED instead, anything that lets you confirm it would be fine.</p>

## Setting up on the Raspberry PI

### Raspberry PI information

<pre class="code" data-lang="" data-unlink>$ uname -a

Linux raspberrypi 4.9.35-v7+ #1014 SMP Fri Jun 30 14:47:43 BST 2017 armv7l GNU/Linux</pre>

### Preparation

<ul>
<li><p>Sign up for LINE Notify and generate a token.<br/>
<a href="https://notify-bot.line.me/ja/">LINE Notify</a></p></li>
<li><p>Pair the BlueButton over Bluetooth in advance.</p></li>
</ul>

<p>There are already plenty of articles on pairing. The following article should be helpful.<br/>
<a href="https://qiita.com/nori-dev-akg/items/96584d9591d329f9dcb2">Bluetoothシャットダウンボタンを作る #300円でIoTボタン</a></p>

### Installing google-home-notifiler

<ul>
<li>Install nodejs and npm</li>
</ul>

<pre class="code" data-lang="" data-unlink>pi$ sudo apt-get update
pi$ sudo apt-get install -y nodejs npm
pi$ sudo npm cache clean
pi$ sudo npm install npm n -g
pi$ sudo n stable</pre>

<ul>
<li>Configure google-home-notifiler</li>
</ul>

<pre class="code" data-lang="" data-unlink>pi$ cd ~
pi$ git clone https://github.com/noelportugal/google-home-notifier
pi$ cd google-home-notifier/
pi$ npm install</pre>

<ul>
<li>Edit example.js</li>
</ul>

<pre class="code" data-lang="" data-unlink>...
const serverPort = 8091; // default port

+ var deviceName = 'ファミリールーム'; // Google Home's device name
+ var ip = '&lt;Google Home's IP&gt;'; // ex. 192.168.11.5
...</pre>

<p>For how to check the Google Home's IP, see <a href="https://www.kabegiwablog.com/entry/2018/03/14/090000">here</a>.</p>

### Creating the google-home-notifler server startup script

<ul>
<li>/etc/systemd/system/googlehomenotifier.service</li>
</ul>

<pre class="code" data-lang="" data-unlink>[Unit]
Description=google-home-notifier Server
After=syslog.target network-online.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/node example.js
Restart=on-failure
RestartSec=10
KillMode=process
WorkingDirectory=/home/pi/google-home-notifier

[Install]
WantedBy=multi-user.target</pre>

<p>After adding the above, run daemon-reload to make `googlehomenotifier.service` recognized.</p>

<pre class="code" data-lang="" data-unlink>pi$ sudo systemctl daemon-reload</pre>

### Now let's start google-home-notifiler

<pre class="code" data-lang="" data-unlink>pi$ sudo systemctl start google-home-notifiler</pre>

### Let's try making it say hello ♪

<pre class="code" data-lang="" data-unlink>pi$ curl -X POST -d &#34;text=hello&#34; https://127.0.0.1:8091/google-home-notifier</pre>

## Setting up the BlueButton

<pre class="code" data-lang="" data-unlink>pi$ sudo gem install bluebutton</pre>

## Installing the dishwasher Notify script

<p>I originally wrote it in python, but shell turned out to be faster, so it's in shell.</p>

<pre class="code" data-lang="" data-unlink>pi$ cd ~
pi$ git clone https://github.com/kenzo0107/dishwasher</pre>

<ul>
<li>Change the following part of dishwasher.sh to the value you generated earlier.</li>
</ul>

<pre class="code" data-lang="" data-unlink>readonly LINENOTIFY_TOKEN=&#34;&lt;please change yours&gt;&#34;</pre>

## Configuring & running the startup script

<pre class="code" data-lang="" data-unlink>pi$ sudo cp bluebutton.service /etc/systemd/system/
pi$ sudo systemctl daemon-reload
pi$ sudo systemctl start bluebutton.service</pre>

## Let's run it

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180820/20180820220824.png" width="100%">
</div>

<p>It works ♪</p>

## Just a small note about the BlueButton

<p>The BlueButton has the following button trigger types,</p>

<ul>
<li>key down: press the button</li>
<li>key up: release the pressed button</li>
<li>long key down: long-press the button</li>
<li>long key up: release the long-pressed button</li>
</ul>

<p>When you do a long key down (long press), a key down event fires first, and then the long key down event fires.</p>

<p>So if you have a handler assigned to the key down event,<br/>
you can't run only the handler assigned to the long key down event,<br/>
so be careful about that.</p>

## Wrap-up

<p>Thanks to the dishwasher start button, the squabbles disappeared from our home,<br/>
and even our son, who was going through the terrible twos, seems to have become more cheerful.</p>

<p>I'd be glad if this helps anyone dealing with a child in the terrible twos and the dishwasher problem.</p>

<p>That's all.</p>
<div class="footnote">
<p class="footnote"><a href="#fn-26e0fc97" name="f-26e0fc97" class="footnote-number">*1</a><span class="footnote-delimiter">:</span><span class="footnote-text">Since I can hit it with curl, I figured later on I could notify wherever the whole family looks, like Slack or anything else.</span></p>
<p class="footnote"><a href="#fn-08674585" name="f-08674585" class="footnote-number">*2</a><span class="footnote-delimiter">:</span><span class="footnote-text">Google Home is really just a stand-in for a speaker.</span></p>
</div>
