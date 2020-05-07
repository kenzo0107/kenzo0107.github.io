---
layout: post
title: 食洗機かけ終わったかわからなくなる問題を RaspberryPI + BlueButton + LINE Notify + Google Home で解決した話
date: 2018-08-20
tags:
- RaspberryPI
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180820/20180820223225.jpg
---

## 概要

<p><b>食洗機かけ終わったかどうかわからなくなる問題</b>が我が家で多発していました。</p>

<p>それを RaspberryPI + BluetButton + LINE Notify + Google Home で解決した話です。</p>

<!-- more -->

## 何が問題？

<p>我が家では、食洗機がある程度溜まったらかける、という風にしている為、必ずかける時間が決まっていません。</p>

<p>その為、時折、妻or自分が食洗機を引き出した時に、「これ洗ったやつだっけ？」と疑心暗鬼・一触即発状態となり、
駆け寄った息子にドラゴンストップしていただく事態が多発していました。</p>

<p>記録が取れる様な仕組み、何か見ればわかる！<br/>
という状態にさえしといてもらえたら助かる、ということでエンジニアリングで解決できないか、と考えました。</p>

## 解決法

<p>開始した時刻を LINE グループに通知して記録する様にしました。<a href="#f-26e0fc97" name="fn-26e0fc97" title="curl 叩ければ、後々 Slack でも何でも、家族みんなが見る所に通知すれば良いかなと思ったので">*1</a></p>

<p>その通知の仕組みをボタンを一押しで済ませられる様な、シンプルなものにできないか、と考え、<br/>
家にある Raspberry PI と組み合わせられる BlueButton で実装しようと考えました。</p>

## 仕組み

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180817/20180817003256.png" width="100%">
</div>

<ol>
<li>食洗機を開始したら、BlueButton を押す</li>
<li>BlueButton を押すと Bluetooth ペアリングしている Raspberry PI にボタン押したよ情報を渡す。</li>
<li>Raspberry PI 側で起動させておいた BlueButton が押されたか判定するスクリプトが検知</li>
<li>3をトリガーに LINE Notify で LINE に通知。</li>
<li>3をトリガーに Google Home に食洗機開始したよメッセージを喋ってもらう。<a href="#f-08674585" name="fn-08674585" title="Google Home はあくまでスピーカー代りです。">*2</a></li>
</ol>


<p>押す長さによって処理分けしています。</p>

<ul>
<li><span style="color: #0000cc"><b>長押し</b></span>=食洗機開始をGoogle Home, Line へ通知</li>
<li><span style="color: #286f2c"><b>短押し</b></span>=食洗機開始時刻読み上げ</li>
</ul>


## 購入したもの

<p><div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01NAHBSUD/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/51FuxBMPonL._SL160_.jpg" class="hatena-asin-detail-image" alt="Raspberry Pi 3 Model B V1.2 (日本製) 国内正規代理店品" title="Raspberry Pi 3 Model B V1.2 (日本製) 国内正規代理店品"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01NAHBSUD/kenzo0107-22/">Raspberry Pi 3 Model B V1.2 (日本製) 国内正規代理店品</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> Raspberry Pi</li><li><span class="hatena-asin-detail-label">発売日:</span> 2016/02/29</li><li><span class="hatena-asin-detail-label">メディア:</span> Tools & Hardware</li><li><a href="https://d.hatena.ne.jp/asin/B01NAHBSUD/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div>
<div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B0794XCHT3/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/51za6FPlcyL._SL160_.jpg" class="hatena-asin-detail-image" alt="Punasi Raspberry Pi3/2/B+/B 5V 2.5A アダプタ 電源 マイクロUSB Boseスピーカー Androidタブレット スマートフォン" title="Punasi Raspberry Pi3/2/B+/B 5V 2.5A アダプタ 電源 マイクロUSB Boseスピーカー Androidタブレット スマートフォン"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B0794XCHT3/kenzo0107-22/">Punasi Raspberry Pi3/2/B+/B 5V 2.5A アダプタ 電源 マイクロUSB Boseスピーカー Androidタブレット スマートフォン</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> Punasi</li><li><span class="hatena-asin-detail-label">メディア:</span> エレクトロニクス</li><li><a href="https://d.hatena.ne.jp/asin/B0794XCHT3/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div>
<div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01LA7EYS0/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/41Fw-FkJNJL._SL160_.jpg" class="hatena-asin-detail-image" alt="GOCOUP スマートフォン用 カメラリモコン A-Bシャッター Bluetoothリモートfor iPhone & Android 日本語説明書付き(黒)" title="GOCOUP スマートフォン用 カメラリモコン A-Bシャッター Bluetoothリモートfor iPhone & Android 日本語説明書付き(黒)"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01LA7EYS0/kenzo0107-22/">GOCOUP スマートフォン用 カメラリモコン A-Bシャッター Bluetoothリモートfor iPhone & Android 日本語説明書付き(黒)</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> GOCOUP</li><li><span class="hatena-asin-detail-label">メディア:</span> エレクトロニクス</li><li><a href="https://d.hatena.ne.jp/asin/B01LA7EYS0/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div>
<div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01N10FAFU/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/31u3OTwzfSL._SL160_.jpg" class="hatena-asin-detail-image" alt="Google Home" title="Google Home"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/B01N10FAFU/kenzo0107-22/">Google Home</a></p><ul><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> google</li><li><span class="hatena-asin-detail-label">メディア:</span> オフィス用品</li><li><a href="https://d.hatena.ne.jp/asin/B01N10FAFU/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div></p>

<p>BlueButton は Amazon で 100 円程度でした♪ お財布に優しい！</p>

<p>Google Home はあくまでスピーカー代わりでボタンが押された時の確認用として使ってます。<br/>
USB スピーカーを接続するでも、Lチカで反応させる、でも確認できるものがあれば、それで良いと思います。</p>

## Raspberry PI でのセットアップ

### Raspberry PI 情報

<pre class="code" data-lang="" data-unlink>$ uname -a

Linux raspberrypi 4.9.35-v7+ #1014 SMP Fri Jun 30 14:47:43 BST 2017 armv7l GNU/Linux</pre>


### 事前準備

<ul>
<li><p>LINE Notify に Signup し token 生成します。<br/>
<a href="https://notify-bot.line.me/ja/">LINE Notify</a></p></li>
<li><p>BlueButton を Bluetooth ペアリングしときます。</p></li>
</ul>


<p>ペアリングは既にいくつも記事があります。以下記事参考になるかと思います。<br/>
<a href="https://qiita.com/nori-dev-akg/items/96584d9591d329f9dcb2">Bluetoothシャットダウンボタンを作る #300円でIoTボタン</a></p>

### google-home-notifiler インストール

<ul>
<li>nodejs, npm インストール</li>
</ul>


<pre class="code" data-lang="" data-unlink>pi$ sudo apt-get update
pi$ sudo apt-get install -y nodejs npm
pi$ sudo npm cache clean
pi$ sudo npm install npm n -g
pi$ sudo n stable</pre>


<ul>
<li>google-home-notifiler 設定</li>
</ul>


<pre class="code" data-lang="" data-unlink>pi$ cd ~
pi$ git clone https://github.com/noelportugal/google-home-notifier
pi$ cd google-home-notifier/
pi$ npm install</pre>


<ul>
<li>example.js 編集</li>
</ul>


<pre class="code" data-lang="" data-unlink>...
const serverPort = 8091; // default port

+ var deviceName = 'ファミリールーム'; // Google Home's device name
+ var ip = '&lt;Google Home's IP&gt;'; // ex. 192.168.11.5
...</pre>


<p>Google Home's IP の確認は<a href="https://www.kabegiwablog.com/entry/2018/03/14/090000">こちら</a></p>

### google-home-notifler サーバ起動スクリプト作成

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


<p>上記追加後、daemon-reload し、`googlehomenotifier.service` を認識させます。</p>

<pre class="code" data-lang="" data-unlink>pi$ sudo systemctl daemon-reload</pre>


### いざ google-home-notifiler 起動

<pre class="code" data-lang="" data-unlink>pi$ sudo systemctl start google-home-notifiler</pre>


### 試しに hello と言わせる♪

<pre class="code" data-lang="" data-unlink>pi$ curl -X POST -d &#34;text=hello&#34; https://127.0.0.1:8091/google-home-notifier</pre>


## BlueButton セットアップ

<pre class="code" data-lang="" data-unlink>pi$ sudo gem install bluebutton</pre>


## 食洗機 Notify スクリプト インストール

<p>元々 python で書きましたが、shell の方が速度が出たので shell にしています。</p>

<pre class="code" data-lang="" data-unlink>pi$ cd ~
pi$ git clone https://github.com/kenzo0107/dishwasher</pre>


<ul>
<li>dishwasher.sh の以下箇所を先に生成したものと変更してください。</li>
</ul>


<pre class="code" data-lang="" data-unlink>readonly LINENOTIFY_TOKEN=&#34;&lt;please change yours&gt;&#34;</pre>


## 起動スクリプト設定 &amp; 実行

<pre class="code" data-lang="" data-unlink>pi$ sudo cp bluebutton.service /etc/systemd/system/
pi$ sudo systemctl daemon-reload
pi$ sudo systemctl start bluebutton.service</pre>


## いざ実行

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180820/20180820220824.png" width="100%">
</div>

<p>できました♪</p>

## BlueButton についてちょっとだけ注意

<p>BlueButton のボタンのトリガーの種類は以下ですが、</p>

<ul>
<li>key down ボタンを押す</li>
<li>key up 押したボタンを離す</li>
<li>long key down ボタン長押し</li>
<li>long key up 長押しボタンを離す</li>
</ul>


<p>long key down (長押し)していると、まず最初に key down イベントが発生し、その後、 long key down のイベント発生となります。</p>

<p>key down イベントに渡した処理がある場合、<br/>
long key down のイベントに渡した処理のみを実行する、<br/>
というのはできないので注意が必要です。</p>

## 総評

<p>食洗機開始ボタンができたおかげで家庭から争いがなくなり<br/>
イヤイヤ期だった息子も朗らかになった様に思います。</p>

<p>是非イヤイヤ期の子供と食洗機問題を抱えている方のお力になれば何よりです。</p>

<p>以上です。</p>
<div class="footnote">
<p class="footnote"><a href="#fn-26e0fc97" name="f-26e0fc97" class="footnote-number">*1</a><span class="footnote-delimiter">:</span><span class="footnote-text">curl 叩ければ、後々 Slack でも何でも、家族みんなが見る所に通知すれば良いかなと思ったので</span></p>
<p class="footnote"><a href="#fn-08674585" name="f-08674585" class="footnote-number">*2</a><span class="footnote-delimiter">:</span><span class="footnote-text">Google Home はあくまでスピーカー代りです。</span></p>
</div>
