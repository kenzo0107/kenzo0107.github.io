---
layout: post
title: "Investigating the Nginx Error \"duplicate MIME type 'text/html' in /etc/nginx/nginx.conf\""
date: 2015-10-05
category: Infrastructure
lang: en
translation_id: nginx-error-duplicate-mime-type-text-html
permalink: en/2015/10/05/nginx-error-duplicate-mime-type-text-html/
cover: /img/cover/2015-10-05-nginx-error-duplicate-mime-type-text-html.svg
tags:
- Nginx
---

## Overview
Having error logs sent to Slack as notifications is really convenient.


{% linkPreview http://kenzo0107.hatenablog.com/entry/2015/09/24/011418 _blank %}



Once in a while, though, something shows up that makes you go "what is this?"

One of those is the error in the title.

```
duplicate MIME type "text/html" in /etc/nginx/nginx.conf
```

Looking at nginx.conf, it was the `text/html` that I had set in gzip_types.

Translated literally, it says:

```
The MIME type "text/html" is duplicated in /etc/nginx/nginx.conf.
```

So I figured I could just remove it, and removing it solved the problem.


/etc/nginx/nginx.conf

```
    gzip              on;
    gzip_static       on;
    gzip_http_version 1.0;
    gzip_types        text/plain
                      text/html
                      text/xml
                      text/css
                      application/xml
                      application/xhtml+xml
                      application/rss+xml
                      application/atom_xml
                      application/javascript
                      application/x-javascript;
    gzip_disable      "MSIE [1-11]\.(?!.*SV1)";
    gzip_disable      "Mozilla/4";
    gzip_comp_level   9;
    gzip_vary         on;
```


## Is it specified somewhere else?

To get to the point:
- if you have `ngx_http_gzip_module` installed
- and you set `gzip on`

then `text/html` is specified as a MIME type by default.

You can confirm this by checking the official site below.

[gzip_types](http://nginx.org/en/docs/http/ngx_http_gzip_module.html#gzip_types)

It says that the `text/html` type is always subject to compression.

So when you do gzip compression, `text/html` is unnecessary.

And that was the answer.
