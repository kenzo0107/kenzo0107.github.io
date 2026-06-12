---
layout: post
title: Allow Site Access Only From the Office Wi-Fi IP During Maintenance
date: 2016-08-09
category: Infrastructure
lang: en
translation_id: allow-ip-under-the-maintenance
permalink: en/2016/08/09/allow-ip-under-the-maintenance/
tags:
  - .htaccess
  - Apache
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160809/20160809105400.gif
---

Just a memo.

This post summarizes the procedure for putting a site into maintenance.

## Procedure

### maintenance.html

Place maintenance.html under the DocumentRoot.

### Restrict access with .htaccess

```
ErrorDocument 503 /maintenance.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_URI} !^.*\.(js|css|gif|jpg|png|ico)$
  RewriteCond %{REQUEST_URI} !^/cron/.*$
  RewriteCond %{REQUEST_URI} !=/maintenance.html
  # 社内
  RewriteCond %{REMOTE_ADDR} !=<社内Wifi IP>
  RewriteCond %{REMOTE_ADDR} !=<社内Wifi IP>
  RewriteRule ^.*$ - [R=503,L]
</IfModule>
```

That's all.
