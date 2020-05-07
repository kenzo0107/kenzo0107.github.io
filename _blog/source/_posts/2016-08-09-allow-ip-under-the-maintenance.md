---
layout: post
title: メンテ時に社内Wifi IPのみサイトアクセス許可する
date: 2016-08-09
tags:
- .htaccess
- Apache
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160809/20160809105400.gif
---

備忘録です。

サイトメンテナンスする際の手順をまとめています。

## 手順

### maintenance.html
DocumentRoot に maintenance.html を配置

### .htaccess にてアクセス制限

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

以上です。
