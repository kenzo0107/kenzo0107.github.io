---
layout: post
title: 子供の笑顔と笑い声を聞く為に ffmpeg + Nginx + RTMP on RaspberryPI
date: 2018-08-15
tags:
  - RaspberryPI
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180815/20180815181451.png
---

## 概要

<p>RaspberryPI 上で rtmp モジュール付きの nginx をビルドし<br/>
WebCamera で撮影した 動画+音声付き を HLS 配信する際の手順をまとめました。</p>

<!-- more -->

## 経緯

はじめは外出中にペットのうさぎ用に [mjpeg-streamer](https://github.com/jacksonliam/mjpg-streamer) でモニターしていました。
子供が生まれると、子供が元気にしてるかな、とふとモニターするようになりました。

ですが、うさぎは鳴きませんが、子供は泣き叫びます。
mjpeg-streamer では表情こそわかりますが、我が子の声が聞こえてきません。

その為、動画＋音声付きで低負荷で 動画＋音声 配信ができないものかと探していた際に ffmpeg に出会いました。<a href="#f-b00f1fb9" name="fn-b00f1fb9" title="勿論のことですが、家族の了承を得た上で設定しています。">\*1</a>

## 購入したもの

<p><div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01NAHBSUD/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/51FuxBMPonL._SL160_.jpg" class="hatena-asin-detail-image" alt="Raspberry Pi 3 Model B V1.2 (日本製) 国内正規代理店品" title="Raspberry Pi 3 Model B V1.2 (日本製) 国内正規代理店品"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01NAHBSUD/kenzo0107-22/">Raspberry Pi 3 Model B V1.2 (日本製) 国内正規代理店品</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> Raspberry Pi</li><li><span class="hatena-asin-detail-label">発売日:</span> 2016/02/29</li><li><span class="hatena-asin-detail-label">メディア:</span> Tools & Hardware</li><li><a href="https://d.hatena.ne.jp/asin/B01NAHBSUD/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div></p>

<p><div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B07CZ867S1/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/41X77c%2Bh02L._SL160_.jpg" class="hatena-asin-detail-image" alt="Punasi Raspberry Pi?源 5V 3A 1.8m Raspberry Pi 3 2Model B/B+ Pi A/A+ Zero Micro USB Androidタブレット スマートフォン" title="Punasi Raspberry Pi?源 5V 3A 1.8m Raspberry Pi 3 2Model B/B+ Pi A/A+ Zero Micro USB Androidタブレット スマートフォン"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B07CZ867S1/kenzo0107-22/">Punasi Raspberry Pi?源 5V 3A 1.8m Raspberry Pi 3 2Model B/B+ Pi A/A+ Zero Micro USB Androidタブレット スマートフォン</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> Punasi</li><li><span class="hatena-asin-detail-label">メディア:</span> エレクトロニクス</li><li><a href="https://d.hatena.ne.jp/asin/B07CZ867S1/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div></p>

<p><div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B005LFFE7I/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/41Agcx4AmXL._SL160_.jpg" class="hatena-asin-detail-image" alt="LOGICOOL HDウェブカム フルHD動画対応 C615" title="LOGICOOL HDウェブカム フルHD動画対応 C615"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B005LFFE7I/kenzo0107-22/">LOGICOOL HDウェブカム フルHD動画対応 C615</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> ロジクール</li><li><span class="hatena-asin-detail-label">発売日:</span> 2011/09/22</li><li><span class="hatena-asin-detail-label">メディア:</span> Personal Computers</li><li><span class="hatena-asin-detail-label">購入</span>: 2人 <span class="hatena-asin-detail-label">クリック</span>: 2回</li><li><a href="https://d.hatena.ne.jp/asin/B005LFFE7I/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div></p>

<p><div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B00IR8R7WQ/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/31jLRhsblIL._SL160_.jpg" class="hatena-asin-detail-image" alt="Kinobo???USB 2.0ミニマイクマイク" Makio"ノートパソコン/デスクトップPC用???VoIP/Skype/音声認識ソフトウェア" title="Kinobo???USB 2.0ミニマイクマイク" Makio"ノートパソコン/デスクトップPC用???VoIP/Skype/音声認識ソフトウェア"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B00IR8R7WQ/kenzo0107-22/">Kinobo???USB 2.0ミニマイクマイク" Makio"ノートパソコン/デスクトップPC用???VoIP/Skype/音声認識ソフトウェア</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> Kinobo</li><li><span class="hatena-asin-detail-label">メディア:</span> Personal Computers</li><li><a href="https://d.hatena.ne.jp/asin/B00IR8R7WQ/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div></p>

## Nginx

<p><a href="https://nginx.org/en/download.html">https://nginx.org/en/download.html</a> で現時点で最新バージョンをダウンロードしました。</p>

### 各種ダウンロード

<p>以下ダウンロードしています。<br/>
`nginx-http-auth-digest` は Nginx で Digest 認証すべくモジュール追加しました。</p>

<ul>
<li>Nginx</li>
<li>nginx-rtmp-module</li>
<li>openssl</li>
<li>nginx-http-auth-digest</li>
<li>ffmpeg</li>
</ul>

<pre class="code" data-lang="" data-unlink>// home ディレクトリで作業するとします。
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

### 解凍

<pre class="code" data-lang="" data-unlink>pi$ tar xvzf nginx-1.15.2.tar.gz
pi$ unzip rtmp.zip
pi$ unzip ssl.zip
pi$ tar xjvf alsa-lib-1.1.6.tar.bz2</pre>

### Nginx ビルド

<pre class="code" data-lang="" data-unlink>pi$ cd nginx-1.15.2/
pi$ sudo ./configure --with-http_ssl_module --with-http_realip_module --add-module=../nginx-rtmp-module-master --with-openssl=../openssl-master --add-module=../nginx-http-auth-digest
pi$ sudo make
pi$ sudo make install</pre>

### Nginx Version 確認

<pre class="code" data-lang="" data-unlink>pi$ /usr/local/nginx/sbin/nginx -V

nginx version: nginx/1.15.2
built by gcc 4.9.2 (Raspbian 4.9.2-10+deb8u1)
built with OpenSSL 1.1.1-pre9-dev  xx XXX xxxx
TLS SNI support enabled
configure arguments: --with-http_ssl_module --with-http_realip_module --add-module=../nginx-rtmp-module-master --with-openssl=../openssl-master --add-module=../nginx-http-auth-digest</pre>

### Nginx をシンボリックリンクでパスが通っている場所から参照できるようにする。

<pre class="code" data-lang="" data-unlink>pi$ sudo ln -s /usr/local/nginx/sbin/nginx /usr/bin/nginx

pi$ which nginx</pre>

### ffmpeg ビルド

<pre class="code" data-lang="" data-unlink>pi$ sudo apt-get install libomxil-bellagio-dev

pi$ cd alsa-lib-1.1.6
pi$ ./configure --prefix=/home/pi/ffmpeg
pi$ sudo make
pi$ sudo make install

pi$ cd /home/pi/ffmpeg
pi$ sudo ./configure  --enable-gpl  --enable-nonfree --enable-mmal --enable-omx-rpi --enable-omx --extra-cflags=&#34;-I/home/pi/ffmpeg/include&#34; --extra-ldflags=&#34;-L/home/pi/ffmpeg/lib&#34; --extra-libs=-ldl
pi$ sudo make -j4
pi4 sudo make install</pre>

<p>`sudo apt-get install libomxil-bellagio-dev` を実行していない場合に以下のエラーが出ました。</p>

<pre class="code" data-lang="" data-unlink>ERROR: OMX_Core.h not found</pre>

## 録音してみる

### 動画撮影デバイス一覧確認

<pre class="code" data-lang="" data-unlink>pi$ v4l2-ctl --list-device

HD Webcam C615 (usb-3f980000.usb-1.3):
        /dev/video0</pre>

<p>上記コマンド実行時に以下のようなエラーが出る時は、</p>

<pre class="code" data-lang="" data-unlink>Failed to open /dev/video0: No such file or directory</pre>

<p>以下コマンドを試してください。</p>

<pre class="code" data-lang="" data-unlink>pi$ sudo pkill /dev/video0</pre>

### 音声入力デバイス一覧確認

<p>自分の場合は<br/>
カード 1 は WebCam、<br/>
カード 2 は マイク、<br/>
です。</p>

<pre class="code" data-lang="" data-unlink>pi$ arecord -l

**** ハードウェアデバイス CAPTURE のリスト ****
カード 1: C615 [HD Webcam C615], デバイス 0: USB Audio [USB Audio]
  サブデバイス: 1/1
  サブデバイス #0: subdevice #0
カード 2: Device [USB PnP Sound Device], デバイス 0: USB Audio [USB Audio]
  サブデバイス: 1/1
  サブデバイス #0: subdevice #0</pre>

### いざ録音

<p>カード 2 が入力デバイスである為、 `hw:2` としました。</p>

<pre class="code" data-lang="" data-unlink>pi$ ffmpeg -f alsa -ac 1 -i hw:2 -f v4l2 -s 640x480 -i /dev/video0 output.mpg</pre>

<p>生成された output.mpg ファイルを mac 上にダウンロードし再生を試してみてください。</p>

<p>これで再生されれば、ffmpeg が問題なく動作していることを確認できたことになります。</p>

<p>次は配信する為の設定です。</p>

## Nginx 設定

### 設定ファイル格納用ディレクトリ作成

<pre class="code" data-lang="" data-unlink>pi$ sudo mkdir -p /usr/local/nginx/conf.d</pre>

### HLS ファイル生成用ディレクトリ作成

<pre class="code" data-lang="" data-unlink>pi$ sudo mkdir -p /var/www/html/live/hls</pre>

### HLS 配信用 index.html

<ul>
<li>hls.min.js 取得</li>
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

### Digest 認証設定

<pre class="code" data-lang="" data-unlink>pi$ cd /var/www
pi$ sudo htdigest -c .htdigest 'digest AuthNginx' hoge
password: &lt;enter password&gt;</pre>

### 各種設定ファイル配置

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

### Nginx 起動設定ファイル

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

## Nginx 起動

<pre class="code" data-lang="" data-unlink>pi$ sudo systemctl daemon-reload
pi$ sudo systemctl start nginx
pi$ sudo systemctl status nginx</pre>

<p>この時はまだ HLS ファイルが生成されていませんので<br/>
`https://&lt;RaspberryPI IP&gt;:8090` にアクセスしても HLS 配信されていません。</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180815/20180815172215.png" width="100%">
</div>

<p>ffmpeg を起動することで `/var/www/html/live/hls/` ディレクトリ以下に `stream.m3u8` が生成されます。</p>

## ffmpeg 起動

<pre class="code" data-lang="" data-unlink>pi$ sudo ffmpeg \
-f alsa -ac 1 -thread_queue_size 8192 -i hw:2 \
-f v4l2 -thread_queue_size 8192 -input_format yuyv422 -video_size 432x240 -framerate 30 -i /dev/video0 \
-c:v h264_omx -b:v 768k -bufsize 768k -vsync 1 -g 16  \
-c:a aac -b:a 128k -ar 44100 \
-af &#34;volume=30dB&#34; \
-f flv rtmp://localhost/live/stream;</pre>

## アクセスしてみる

<p>`https://&lt;RaspberryPI IP&gt;:8090` にアクセスしてみます。
Digest 認証を問われるので設定した ID/PW を入力します。</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180815/20180815172119.png" width="100%">
</div>

<p>HLS 配信されていることを確認できました！</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180815/20180815173337.png" width="100%">
</div>

<p>負荷状況としては CPU 25 - 30% 程度に収まっています。</p>

## まとめ

<p>ffmpeg + Nginx + RTMP で HLS 配信を RaspberryPI 上に構築できました。</p>

<p>実際の運用では、常時起動してはおらず、見たいときだけ起動するような仕組みにしており、負荷は極力抑えています。
監視は Mackerel の無料プランで今のところ十分です。</p>

<p>育児ハックの一環として参考になれば何よりです。</p>
<div class="footnote">
<p class="footnote"><a href="#fn-b00f1fb9" name="f-b00f1fb9" class="footnote-number">*1</a><span class="footnote-delimiter">:</span><span class="footnote-text">勿論のことですが、家族の了承を得た上で設定しています。</span></p>
</div>
