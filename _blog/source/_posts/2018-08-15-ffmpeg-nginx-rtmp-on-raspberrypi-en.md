---
layout: post
title: Hearing My Child's Smiles and Laughter with ffmpeg + Nginx + RTMP on RaspberryPI
date: 2018-08-15
lang: en
translation_id: ffmpeg-nginx-rtmp-on-raspberrypi
permalink: en/2018/08/15/ffmpeg-nginx-rtmp-on-raspberrypi/
tags:
  - RaspberryPI
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180815/20180815181451.png
---

## Overview

<p>This post summarizes the steps for building nginx with the rtmp module on a RaspberryPI<br/>
and delivering video + audio captured by a WebCamera over HLS.</p>

<!-- more -->

## Background

At first, I used [mjpeg-streamer](https://github.com/jacksonliam/mjpg-streamer) to monitor our pet rabbit while I was out.
After my child was born, I found myself casually checking in to see whether they were doing well.

However, while rabbits don't make noise, children cry and scream.
With mjpeg-streamer I could see their facial expressions, but I couldn't hear my child's voice.

So while looking for a way to deliver video + audio at low load, I came across ffmpeg.<a href="#f-b00f1fb9" name="fn-b00f1fb9" title="Of course, this was set up with my family's consent.">\*1</a>

## What I Bought

<p><div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01NAHBSUD/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/51FuxBMPonL._SL160_.jpg" class="hatena-asin-detail-image" alt="Raspberry Pi 3 Model B V1.2 (Made in Japan) Domestic Authorized Distributor Product" title="Raspberry Pi 3 Model B V1.2 (日本製) 国内正規代理店品"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01NAHBSUD/kenzo0107-22/">Raspberry Pi 3 Model B V1.2 (日本製) 国内正規代理店品</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> Raspberry Pi</li><li><span class="hatena-asin-detail-label">発売日:</span> 2016/02/29</li><li><span class="hatena-asin-detail-label">メディア:</span> Tools & Hardware</li><li><a href="https://d.hatena.ne.jp/asin/B01NAHBSUD/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div></p>

<p><div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B07CZ867S1/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/41X77c%2Bh02L._SL160_.jpg" class="hatena-asin-detail-image" alt="Punasi Raspberry Pi?源 5V 3A 1.8m Raspberry Pi 3 2Model B/B+ Pi A/A+ Zero Micro USB Androidタブレット スマートフォン" title="Punasi Raspberry Pi?源 5V 3A 1.8m Raspberry Pi 3 2Model B/B+ Pi A/A+ Zero Micro USB Androidタブレット スマートフォン"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B07CZ867S1/kenzo0107-22/">Punasi Raspberry Pi?源 5V 3A 1.8m Raspberry Pi 3 2Model B/B+ Pi A/A+ Zero Micro USB Androidタブレット スマートフォン</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> Punasi</li><li><span class="hatena-asin-detail-label">メディア:</span> エレクトロニクス</li><li><a href="https://d.hatena.ne.jp/asin/B07CZ867S1/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div></p>

<p><div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B005LFFE7I/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/41Agcx4AmXL._SL160_.jpg" class="hatena-asin-detail-image" alt="LOGICOOL HD Webcam Full HD Video Support C615" title="LOGICOOL HDウェブカム フルHD動画対応 C615"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B005LFFE7I/kenzo0107-22/">LOGICOOL HDウェブカム フルHD動画対応 C615</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> ロジクール</li><li><span class="hatena-asin-detail-label">発売日:</span> 2011/09/22</li><li><span class="hatena-asin-detail-label">メディア:</span> Personal Computers</li><li><span class="hatena-asin-detail-label">購入</span>: 2人 <span class="hatena-asin-detail-label">クリック</span>: 2回</li><li><a href="https://d.hatena.ne.jp/asin/B005LFFE7I/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div></p>

<p><div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B00IR8R7WQ/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/31jLRhsblIL._SL160_.jpg" class="hatena-asin-detail-image" alt="Kinobo???USB 2.0ミニマイクマイク" Makio"ノートパソコン/デスクトップPC用???VoIP/Skype/音声認識ソフトウェア" title="Kinobo???USB 2.0ミニマイクマイク" Makio"ノートパソコン/デスクトップPC用???VoIP/Skype/音声認識ソフトウェア"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B00IR8R7WQ/kenzo0107-22/">Kinobo???USB 2.0ミニマイクマイク" Makio"ノートパソコン/デスクトップPC用???VoIP/Skype/音声認識ソフトウェア</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> Kinobo</li><li><span class="hatena-asin-detail-label">メディア:</span> Personal Computers</li><li><a href="https://d.hatena.ne.jp/asin/B00IR8R7WQ/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div></p>

## Nginx

<p>I downloaded the latest version available at the time from <a href="https://nginx.org/en/download.html">https://nginx.org/en/download.html</a>.</p>

### Downloading the Various Components

<p>I downloaded the following.<br/>
`nginx-http-auth-digest` was added as a module to enable Digest authentication in Nginx.</p>

<ul>
<li>Nginx</li>
<li>nginx-rtmp-module</li>
<li>openssl</li>
<li>nginx-http-auth-digest</li>
<li>ffmpeg</li>
</ul>

<pre class="code" data-lang="" data-unlink>// Let's say we work in the home directory.
pi$ cd ~

// nginx
pi$ wget https://nginx.org/download/nginx-1.15.2.tar.gz

// nginx-rtmp-module
pi$ wget -O rtmp.zip https://github.com/arut/nginx-rtmp-module/archive/master.zip
pi$ wget -O ssl.zip https://github.com/openssl/openssl/archive/master.zip

// nginx-http-auth-digest
pi$ git clone https://github.com/samizdatco/nginx-http-auth-digest.git
pi$ cd nginx-http-auth-digest
pi$ git clone https://gist.github.com/frah/3921741
pi$ patch -u &lt; 3921741/patch-ngx_http_auth_digest_module.diff

// ffmpeg
pi$ git clone git://source.ffmpeg.org/ffmpeg.git
pi$ wget ftp://ftp.alsa-project.org/pub/lib/alsa-lib-1.1.6.tar.bz2</pre>

### Extracting

<pre class="code" data-lang="" data-unlink>pi$ tar xvzf nginx-1.15.2.tar.gz
pi$ unzip rtmp.zip
pi$ unzip ssl.zip
pi$ tar xjvf alsa-lib-1.1.6.tar.bz2</pre>

### Building Nginx

<pre class="code" data-lang="" data-unlink>pi$ cd nginx-1.15.2/
pi$ sudo ./configure --with-http_ssl_module --with-http_realip_module --add-module=../nginx-rtmp-module-master --with-openssl=../openssl-master --add-module=../nginx-http-auth-digest
pi$ sudo make
pi$ sudo make install</pre>

### Checking the Nginx Version

<pre class="code" data-lang="" data-unlink>pi$ /usr/local/nginx/sbin/nginx -V

nginx version: nginx/1.15.2
built by gcc 4.9.2 (Raspbian 4.9.2-10+deb8u1)
built with OpenSSL 1.1.1-pre9-dev  xx XXX xxxx
TLS SNI support enabled
configure arguments: --with-http_ssl_module --with-http_realip_module --add-module=../nginx-rtmp-module-master --with-openssl=../openssl-master --add-module=../nginx-http-auth-digest</pre>

### Making Nginx Accessible from a Path via a Symbolic Link

<pre class="code" data-lang="" data-unlink>pi$ sudo ln -s /usr/local/nginx/sbin/nginx /usr/bin/nginx

pi$ which nginx</pre>

### Building ffmpeg

<pre class="code" data-lang="" data-unlink>pi$ sudo apt-get install libomxil-bellagio-dev

pi$ cd alsa-lib-1.1.6
pi$ ./configure --prefix=/home/pi/ffmpeg
pi$ sudo make
pi$ sudo make install

pi$ cd /home/pi/ffmpeg
pi$ sudo ./configure  --enable-gpl  --enable-nonfree --enable-mmal --enable-omx-rpi --enable-omx --extra-cflags=&#34;-I/home/pi/ffmpeg/include&#34; --extra-ldflags=&#34;-L/home/pi/ffmpeg/lib&#34; --extra-libs=-ldl
pi$ sudo make -j4
pi4 sudo make install</pre>

<p>I got the following error when I had not run `sudo apt-get install libomxil-bellagio-dev`.</p>

<pre class="code" data-lang="" data-unlink>ERROR: OMX_Core.h not found</pre>

## Trying to Record

### Checking the List of Video Capture Devices

<pre class="code" data-lang="" data-unlink>pi$ v4l2-ctl --list-device

HD Webcam C615 (usb-3f980000.usb-1.3):
        /dev/video0</pre>

<p>When you get an error like the following while running the command above,</p>

<pre class="code" data-lang="" data-unlink>Failed to open /dev/video0: No such file or directory</pre>

<p>try the following command.</p>

<pre class="code" data-lang="" data-unlink>pi$ sudo pkill /dev/video0</pre>

### Checking the List of Audio Input Devices

<p>In my case,<br/>
card 1 is the WebCam,<br/>
card 2 is the microphone.</p>

<pre class="code" data-lang="" data-unlink>pi$ arecord -l

**** ハードウェアデバイス CAPTURE のリスト ****
カード 1: C615 [HD Webcam C615], デバイス 0: USB Audio [USB Audio]
  サブデバイス: 1/1
  サブデバイス #0: subdevice #0
カード 2: Device [USB PnP Sound Device], デバイス 0: USB Audio [USB Audio]
  サブデバイス: 1/1
  サブデバイス #0: subdevice #0</pre>

### Now, Recording

<p>Since card 2 is the input device, I specified `hw:2`.</p>

<pre class="code" data-lang="" data-unlink>pi$ ffmpeg -f alsa -ac 1 -i hw:2 -f v4l2 -s 640x480 -i /dev/video0 output.mpg</pre>

<p>Download the generated output.mpg file to your Mac and try playing it back.</p>

<p>If it plays, you've confirmed that ffmpeg is working without any problems.</p>

<p>Next is the configuration for delivery.</p>

## Nginx Configuration

### Creating a Directory for Configuration Files

<pre class="code" data-lang="" data-unlink>pi$ sudo mkdir -p /usr/local/nginx/conf.d</pre>

### Creating a Directory for HLS File Generation

<pre class="code" data-lang="" data-unlink>pi$ sudo mkdir -p /var/www/html/live/hls</pre>

### index.html for HLS Delivery

<ul>
<li>Fetching hls.min.js</li>
</ul>

<pre class="code" data-lang="" data-unlink>pi$ cd /var/www/html
pi$ wget https://cdn.jsdelivr.net/hls.js/latest/hls.min.js</pre>

<ul>
<li>/var/www/html/index.html</li>
</ul>

<pre class="code" data-lang="" data-unlink>&lt;!DOCTYPE html&gt;
&lt;html lang=&#34;ja&#34;&gt;
&lt;head&gt;
  &lt;meta charset=&#34;utf-8&#34;/&gt;
  &lt;script src=&#34;./hls.min.js&#34;&gt;&lt;/script&gt;
&lt;/head&gt;

&lt;body&gt;
  &lt;video id=&#34;video&#34;&gt;&lt;/video&gt;
  &lt;script&gt;
    if(Hls.isSupported()) {
      var video = document.getElementById('video');
      var hls = new Hls();
      hls.loadSource('/live/hls/stream.m3u8');
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED,function() {
      video.play();
    });
   }
  &lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;</pre>

### Digest Authentication Configuration

<pre class="code" data-lang="" data-unlink>pi$ cd /var/www
pi$ sudo htdigest -c .htdigest 'digest AuthNginx' hoge
password: &lt;enter password&gt;</pre>

### Placing the Various Configuration Files

<ul>
<li>/usr/local/nginx/conf.d/default.conf</li>
</ul>

<pre class="code" data-lang="" data-unlink>server {
    listen 8090;
    proxy_set_header   X-Forwarded-For     $proxy_add_x_forwarded_for;
    access_log /var/log/nginx/access.log combined;
    error_log /var/log/nginx/error.log warn;

    location = /favicon.ico {
        access_log off;
        empty_gif;
        expires 30d;
    }

    location / {
        auth_digest &#34;digest AuthNginx&#34;;
        auth_digest_user_file /var/www/.htdigest;

        root /var/www/html;
        index index.html;
        set_real_ip_from    127.0.0.1;
        real_ip_header      X-Forwarded-For;
    }
}</pre>

<ul>
<li>/usr/local/nginx/conf.d/rtmp</li>
</ul>

<pre class="code" data-lang="" data-unlink>rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        allow play all;
        access_log /var/log/nginx/rtmp_access.log;

        application live {
            live on;
            hls on;
            record off;
            hls_path /var/www/html/live/hls;
            hls_fragment 1s;
            hls_type live;
        }
    }
}</pre>

<ul>
<li>/usr/local/nginx/conf/nginx.conf</li>
</ul>

<pre class="code" data-lang="" data-unlink>user  www-data;
worker_processes  1;

pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include           mime.types;
    default_type      application/octet-stream;
    sendfile          on;
    keepalive_timeout 65;
    include /usr/local/nginx/conf.d/*.conf;
}

include /usr/local/nginx/conf.d/rtmp;</pre>

### Nginx Startup Configuration File

<ul>
<li>/lib/systemd/system/nginx.service</li>
</ul>

<pre class="code" data-lang="" data-unlink>[Unit]
Description=The NGINX HTTP and reverse proxy server
After=syslog.target network.target remote-fs.target nss-lookup.target

[Service]
Type=forking
PIDFile=/var/run/nginx.pid
ExecStartPre=/usr/local/nginx/sbin/nginx -t
ExecStart=/usr/local/nginx/sbin/nginx
ExecReload=/usr/local/nginx/sbin/nginx -s reload
ExecStop=/bin/kill -s QUIT $MAINPID
PrivateTmp=true

[Install]
WantedBy=multi-user.target</pre>

## Starting Nginx

<pre class="code" data-lang="" data-unlink>pi$ sudo systemctl daemon-reload
pi$ sudo systemctl start nginx
pi$ sudo systemctl status nginx</pre>

<p>At this point the HLS files have not been generated yet,<br/>
so even if you access `https://&lt;RaspberryPI IP&gt;:8090`, nothing is being delivered over HLS.</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180815/20180815172215.png" width="100%">
</div>

<p>By starting ffmpeg, `stream.m3u8` is generated under the `/var/www/html/live/hls/` directory.</p>

## Starting ffmpeg

<pre class="code" data-lang="" data-unlink>pi$ sudo ffmpeg \
-f alsa -ac 1 -thread_queue_size 8192 -i hw:2 \
-f v4l2 -thread_queue_size 8192 -input_format yuyv422 -video_size 432x240 -framerate 30 -i /dev/video0 \
-c:v h264_omx -b:v 768k -bufsize 768k -vsync 1 -g 16  \
-c:a aac -b:a 128k -ar 44100 \
-af &#34;volume=30dB&#34; \
-f flv rtmp://localhost/live/stream;</pre>

## Trying to Access It

<p>Let's access `https://&lt;RaspberryPI IP&gt;:8090`.
You'll be prompted for Digest authentication, so enter the ID/PW you configured.</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180815/20180815172119.png" width="100%">
</div>

<p>I confirmed that it's being delivered over HLS!</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180815/20180815173337.png" width="100%">
</div>

<p>As for the load, it stays at around CPU 25 - 30%.</p>

## Summary

<p>I was able to build HLS delivery on a RaspberryPI with ffmpeg + Nginx + RTMP.</p>

<p>In actual operation, it isn't always running; I set it up so it only starts when I want to watch, keeping the load as low as possible.
For monitoring, Mackerel's free plan is sufficient for now.</p>

<p>I'd be glad if this serves as a useful reference for parenting hacks.</p>
<div class="footnote">
<p class="footnote"><a href="#fn-b00f1fb9" name="f-b00f1fb9" class="footnote-number">*1</a><span class="footnote-delimiter">:</span><span class="footnote-text">Of course, this was set up with my family's consent.</span></p>
</div>
