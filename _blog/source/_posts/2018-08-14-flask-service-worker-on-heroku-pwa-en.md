---
layout: post
title: PWA Tutorial with Flask + Service Worker on Heroku
date: 2018-08-14
category: Python
lang: en
translation_id: flask-service-worker-on-heroku-pwa
permalink: en/2018/08/14/flask-service-worker-on-heroku-pwa/
tags:
  - Python
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180814/20180814131355.png
---

## Overview

For me, Service Worker was something that went viral on [dev.to](https://dev.to/).
I put together what I learned in a tutorial-like fashion while tracing through its overview and functionality.

As the title says, I ran Flask + Service Worker on Heroku and turned it into a PWA (Progressive Web App).

<!-- more -->

{% linkPreview https://lit-wildwood-62785.herokuapp.com/ \_blank }

## Background

A while ago, I built a web application with Flask, Python's lightweight framework.

Up to that point, I had been trying out the following platforms to deploy Docker containers:

- <a href="https://github.com/kenzo0107/toda-tocochan-bus-on-ibmbluemix">IBM Bluemix</a>
- <a href="https://github.com/kenzo0107/toda-tocochan-bus-on-gcp">Google Cloud Platform</a>

On those platforms, costs do come up — only a few hundred yen per month, but still.

On August 7, 2018, I found out that Heroku's free plan offered 1,500 free hours per month, so even running 2 apps would still be free! That's why I went with Heroku.

For dealing with sleep, I referred to the following:

{% linkPreview https://casualdevelopers.com/tech-tips/how-to-prevent-idling-of-free-dyno-on-heroku/ _blank %}

As a further measure against sleep, I thought: if I have a Service Worker, the service can run even offline, so maybe it's fine even if it keeps sleeping? So I introduced one.

## Adding a Service Worker to Flask

The source is on git.

{% linkPreview https://github.com/kenzo0107/toda-tocochan-bus _blank %}

## A quick rundown of the key points when introducing it

- Make `/sw.js` accessible in the main script, `app.py`.

```js
@app.route('/sw.js', methods=['GET'])
def sw():
    return app.send_static_file('sw.js')
```

- Place an empty sw.js inside the static directory

Basically, after these 2 steps, you implement each part of the Service Worker logic.

### Install

In the install event below, all the file paths you want to cache are cached.
Conceptually, when you access the top page, the cache is generated at the moment the install event fires, when the Service Worker is installed into the browser.

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
  '/static/js/tether.min.js',
];

self.addEventListener('install', (event) => {
  console.log('install');
  event.waitUntil(
    caches.open(cacheName).then(function (cache) {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});
```

If you look at Chrome > Developer Tool > Application > Cache Storage, you can see that things are cached.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180814/20180814123700.png" width="100%">
</div>

### fetch

The logic below calls the files cached in the browser via the fetch event.

```js
self.addEventListener('fetch', function (event) {
  console.log('fetch');
  event.respondWith(
    caches.match(event.request).then(function (response) {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
```

### activate

Even once a Service Worker enters the active state, it cannot immediately control resources in the browser — it only becomes able to do so the next time you access the page.

As a result, for a user who visits only once, they won't get to experience the performance improvement from the Service Worker.

To address that, the activate event below makes it possible to control resources right away.

```js
self.addEventListener('activate', (event) => {
  console.log('activate');
  event.waitUntil(self.clients.claim());
});
```

Basically, the settings above completed the Service Worker setup.

Comparing before and after, you can see in the Waterfall view that the resource load time shrinks noticeably.

<b>Before</b>
<span itemscope itemtype="https://schema.org/Photograph"><img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180814/20180814124810.png" alt="f:id:kenzo0107:20180814124810p:plain" title="f:id:kenzo0107:20180814124810p:plain" class="hatena-fotolife" itemprop="image"></span>

<b>After</b>
<span itemscope itemtype="https://schema.org/Photograph"><img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180814/20180814124826.png" alt="f:id:kenzo0107:20180814124826p:plain" title="f:id:kenzo0107:20180814124826p:plain" class="hatena-fotolife" itemprop="image"></span>

## Summary

With a Service Worker, I was able to build a mechanism that keeps working even offline once content has been cached.
Working even offline — that's appealing ♪

That said, when there are URLs with many query-parameter patterns, they tend not to get cached well. It made me think about what the caching strategy should be in such cases — perhaps, for now, only caching static files would be a good approach.

For example:

```
/ts?circuit_id=1&station_id=1 was accessed, but
/ts?circuit_id=1&station_id=2 was not accessed,
so when offline, /ts?circuit_id=1&station_id=2 can no longer be viewed
```

Also, Service Worker does not yet support the POST method, and it seems an <a href="https://github.com/w3c/ServiceWorker/issues/693">issue</a> has been raised about it.
There was a blog proposing the following as a workaround, but the implementation is complex, and I got the impression that there is still room for development in this area.

{% linkPreview https://medium.com/web-on-the-edge/offline-posts-with-progressive-web-apps-fc2dc4ad895 _blank %}

There were some hardships when introducing the Service Worker below — it was content you couldn't watch without tears.
<a href="https://speakerdeck.com/sisidovski/nikkei-high-performance-pwa">Speeding up the Nikkei digital edition site and PWA support</a>

I'm also using <a href="https://developers.google.com/web/tools/workbox/">Workbox</a> in another hobby app, and I'd like to write about that as well.

## References

{% linkPreview https://stackoverflow.com/questions/45623732/how-to-queue-post-request-using-workbox _blank %}
{% linkPreview https://app.codegrid.net/entry/2016-service-worker-1 _blank %}
