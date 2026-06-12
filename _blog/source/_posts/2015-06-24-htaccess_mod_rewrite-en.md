---
layout: post
title: Enabling mod_rewrite via .htaccess
date: 2015-06-24
category: Infrastructure
lang: en
translation_id: htaccess_mod_rewrite
permalink: en/2015/06/24/htaccess_mod_rewrite/
cover: /img/cover/2015-06-24-htaccess_mod_rewrite.svg
---

# Overview
We often use mod_rewrite without giving it much thought,
but depending on the httpd configuration it may not be available.



Here is a summary of the configuration steps.

# Configuration Steps

## Edit /etc/httpd/conf/httpd.conf


```
LoadModule deflate_module modules/mod_deflate.so    # ← 有効化
LoadModule rewrite_module modules/mod_rewrite.so    # ← 有効化

AccessFileName .htaccess   # ← 追加

DocumentRoot "/var/www/html"
<Directory "/var/www/html">
    ....
    # Options Indexes FollowSymLinks
    Options Indexes FollowSymLinks ExecCGI    # ← ExecCGI追加

    # AllowOverride None
    AllowOverride All    # ← Allに修正
    ....
</Directory>
```

## Restart httpd after the changes above

```
# service httpd restart
```
