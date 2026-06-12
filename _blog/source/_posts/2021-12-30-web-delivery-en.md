---
title: The Difference Between no-cache and no-store
date: 2021-12-30
category: Infrastructure
lang: en
translation_id: web-delivery
permalink: en/2021/12/30/web-delivery/
cover: https://i.imgur.com/c3MFmbk.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

There are many cache-related directives, and among them I'll cover no-cache and no-store, which are easy to mix up.

## How no-cache Works

**<font color="red">It does NOT mean "do not cache"!</font>**
Even when the cache is still within its expiration period, it revalidates every time to check whether the cache is up to date.

Just like Tower Records, remember it as:
No Validation, No Cache.

![](https://i.imgur.com/c3MFmbk.png)



### When to Use It

It's effective when you want to keep up with content that changes while still taking advantage of caching.

### Caveats When Using It

When the user navigates back in the browser, `(disk cache)` may be returned and the content may not get updated.

Reference: [I investigated the issue where pressing Chrome's Back button uses an "unintended Cache" and displays a page that differs from what you expect](https://south37.hatenablog.com/entry/2021/01/11/Chrome_%E3%81%AE_Back_button_%E3%82%92%E6%8A%BC%E3%81%97%E3%81%9F%E9%9A%9B%E3%81%AB%E3%80%8C%E6%84%8F%E5%9B%B3%E3%81%97%E3%81%AA%E3%81%84_Cache%E3%80%8D%E3%81%8C%E5%88%A9%E7%94%A8%E3%81%95%E3%82%8C)

Depending on the spec of the browsers you support, you may run into unintended behavior. In that case, no-store, which prevents caching altogether, is one countermeasure.

## no-store

It does not store the cache and makes a request to the Origin every time.

![](https://i.imgur.com/QmQK5Q5.png)

### When to Use It

As its name "no-store = do not store" suggests, you use it when you want to avoid consuming cache storage capacity.

With CDN services such as CloudFront the concern over cache storage capacity is small, but when you build a CDN yourself (DIY), storage capacity is finite, so it becomes a concern.

### When You Strictly Do Not Want Caching

```
Cache-Control: private, no-store, no-cache, must-revalidate
```

* private: do not cache along the path of a Proxy or CDN
* no-store: do not store the cache
* no-cache: do not use the cache without revalidation
* must-revalidate: force revalidation when the cache has expired
    * do not allow stale (expired) cache to be used
    * return 504 Gateway Timeout if the Origin is down
    * cannot coexist with max-age or no-cache

### Why Such Heavy Defenses

It's to reduce compatibility issues with Proxies and CDNs.


## Overall Impressions

I learned that when finely controlling cache settings, you need to take into account browser, Proxy, and CDN compatibility and carry out thorough verification.

## References

{% affiliate "Web配信の技術―HTTPキャッシュ・リバースプロキシ・CDNを活用する" "https://ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=JP&ASIN=B08VJ3YZK1&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_&tag=kenzo0107-22" "https://www.amazon.co.jp/gp/product/B08VJ3YZK1/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=kenzo0107-22&creative=1211&linkCode=as2&creativeASIN=B08VJ3YZK1&linkId=7da56da317e5d9bae2ca07a9333b9f76" "https://hb.afl.rakuten.co.jp/ichiba/22ed78a4.becc60fe.22ed78a5.6784b34a/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Frakutenkobo-ebooks%2F5c1f7f52096c39a0a0a12d0d55bd600f%2F&link_type=picttext&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJwaWN0dGV4dCIsInNpemUiOiIyNDB4MjQwIiwibmFtIjoxLCJuYW1wIjoicmlnaHQiLCJjb20iOjEsImNvbXAiOiJkb3duIiwicHJpY2UiOjEsImJvciI6MSwiY29sIjoxLCJiYnRuIjoxLCJwcm9kIjowLCJhbXAiOmZhbHNlfQ%3D%3D" %}


A book recommended by a colleague!

It explains how to optimize and speed up delivery on the Web.

I had only used AWS CloudFront myself, but the explanation of Varnish configuration was easy to understand from the start, making it easy to get into.

My understanding of caching deepened significantly.

I'd like to take this opportunity to express my gratitude.

There's still so much more I want to learn, such as how to run tests and how to reproduce the production environment during development.

I want a sequel!
