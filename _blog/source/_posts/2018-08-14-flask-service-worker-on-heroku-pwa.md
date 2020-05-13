---
layout: post
title: Flask+Service Worker on Heroku で PWA チュートリアル
date: 2018-08-14
tags:
- Python
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180814/20180814131355.png
---

## 概要

自分にとっては [dev.to](https://dev.to/) でバズった Service Worker。
その概要と機能性をなぞってみようとチュートリアル的に学んだ内容をまとめました。

掲題の通り、Flask + Service Worker を Heroku で動作させ、PWA(Progressive Web Apps) してみました。

<!-- more -->

{% linkPreview https://lit-wildwood-62785.herokuapp.com/ _blank }

## 経緯

以前、Python の軽量 FW、Flask で Web アプリケーションを作りました。

これまでは Docker コンテナをデプロイ出来るプラットフォームを試す為に以下試してました。

* <a href="https://github.com/kenzo0107/toda-tocochan-bus-on-ibmbluemix">IBM Bluemix</a>
* <a href="https://github.com/kenzo0107/toda-tocochan-bus-on-gcp">Google Cloud Platform</a>



上記プラットフォームでは、月数百円程度ですが、費用が発生します。

2018年8月7日、Heroku の free プランが 月 1500 時間無料とあったので
アプリ×2 つ動かしても無料でいける！ということで Heroku にしてみました。

sleep 対策として以下を参照しました。

{% linkPreview https://casualdevelopers.com/tech-tips/how-to-prevent-idling-of-free-dyno-on-heroku/ _blank %}

さらなる sleep 対策として
Service Worker があればオフラインでもサービス動作させられるし、sleep し続けてもいいのでは？と思い、導入してみました。

## Flask に Service Worker 導入

ソースは git にあります。

{% linkPreview https://github.com/kenzo0107/toda-tocochan-bus _blank %}

## 簡単に導入時のポイント

* app.py というメインスクリプトに `/sw.js` へのアクセスできるようにします。

```js
@app.route('/sw.js', methods=['GET'])
def sw():
    return app.send_static_file('sw.js')
```

* static ディレクトリ内に空の sw.js を配置

基本、上記 2 step をしてから Service Worker の各処理を実装していきます。

### Install

以下の install イベントでは、指定したキャッシュさせたいファイルパスを全てキャッシュさせています。
挙動のイメージとしては、トップページにアクセスした際に Service Worker がブラウザに導入（install）されるイベントの発生時にキャッシュを生成しています。

```js
var urlsToCache = [
  '/',
  '/static/img/favicon.ico',
  '/static/img/logo.png',
  '/static/css/bootstrap.min.css',
  '/static/css/flickity.org.css',
  '/static/js/async_set_circuit.js',
  '/static/js/bootstrap.min.js',
  '/static/js/flickity.pkgd.min.js',
  '/static/js/jquery-3.1.0.min.js',
  '/static/js/jquery.countdown.min.js',
  '/static/js/superagent.js',
  '/static/js/tether.min.js'
]

self.addEventListener('install', event => {
  console.log('install')
  event.waitUntil(
    caches.open(cacheName)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache)
      })
  )
})
```


Chrome > Developer Tool > Application > Cache Storage を見るとキャッシュされているのがわかります。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180814/20180814123700.png" width="100%">
</div>

### fetch

以下処理は、fetch イベントでブラウザでキャッシュしたファイルを呼び出しています。

```js
self.addEventListener('fetch', function(event) {
  console.log('fetch')
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request)
      }
    )
  );
});
```

### activate

Service Worker は active 状態になってもすぐにブラウザ上のリソースを操作できず、
もう一度ページにアクセスした際にできるようになっています。

その為、一度しかアクセスしないユーザにとっては Service Worker によるパフォーマンスの向上を体験できないことになります。

その為、 以下 activate イベントによって直ちに操作できるようにします。

```js
self.addEventListener('activate', event => {
  console.log('activate')
  event.waitUntil(self.clients.claim());
})
```

基本、以上の設定で Service Worker 導入完了でした。

前後を比較すると Waterfall で見る、リソースのロードタイムがキュッと縮んでいるのがわかります。

<b>Before</b>
<span itemscope itemtype="https://schema.org/Photograph"><img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180814/20180814124810.png" alt="f:id:kenzo0107:20180814124810p:plain" title="f:id:kenzo0107:20180814124810p:plain" class="hatena-fotolife" itemprop="image"></span>

<b>After</b>
<span itemscope itemtype="https://schema.org/Photograph"><img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180814/20180814124826.png" alt="f:id:kenzo0107:20180814124826p:plain" title="f:id:kenzo0107:20180814124826p:plain" class="hatena-fotolife" itemprop="image"></span>

## まとめ

Service Worker で一度キャッシュさせた後はオフラインでも動作するような仕組みが作れました。
オフラインでも動作する、というのは魅力的♪

ただし、クエリパラメータのパターンの多い URL がある場合などは
キャッシュされにくく、この場合のキャッシュ戦略としては、ひとまず静的ファイルのみキャッシュするなどで対応するのが良いのか、
等考えさせられるところがありました。

例）

```
/ts?circuit_id=1&station_id=1 はアクセスしたけど
/ts?circuit_id=1&station_id=2 はアクセスしてない
という場合はオフラインにしたら /ts?circuit_id=1&station_id=2 は閲覧できなくなる
```

また、POST method は Service Worker は未対応で <a href="https://github.com/w3c/ServiceWorker/issues/693">issue</a> が上がっているようです。
Workaround として以下提案がされているブログがありましたが、実装が複雑で、まだこの辺りは開発の余地がある印象です。

{% linkPreview https://medium.com/web-on-the-edge/offline-posts-with-progressive-web-apps-fc2dc4ad895 _blank %}

以下 Service Worker 導入時の苦労した点があり、涙無くして見られない内容でした。
<a href="https://speakerdeck.com/sisidovski/nikkei-high-performance-pwa">日経電子版 サイト高速化とPWA対応</a>

他趣味アプリで <a href="https://developers.google.com/web/tools/workbox/">Workbox</a> を利用していますが、
こちらも書いていきたいと思います。

## 参考

{% linkPreview https://stackoverflow.com/questions/45623732/how-to-queue-post-request-using-workbox _blank %}
{% linkPreview https://app.codegrid.net/entry/2016-service-worker-1 _blank %}
