---
layout: post
title: Upgrading a Live Nginx with Zero Downtime and Adding the HTTP/2.0 Module
date: 2015-11-17
lang: en
translation_id: versionup-nginx-without-maintenance
permalink: en/2015/11/17/versionup-nginx-without-maintenance/
tags:
  - Nginx
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160810/20160810163018.png
---

## Overview

We'll introduce the HTTP/2.0 module `http_v2_module` into a live Nginx
to improve site performance.

* Note: As of Nginx 1.9.5, `http_spdy_module` has been replaced by `http_v2_module`.

## Environment

- CentOS Linux release 7.1.1503 (Core)
- Nginx 1.9.3 installed and running

## What We Want to Do

- Upgrade Nginx (to 1.9.5 or later)
- Install http_v2_module

## Checking the Current State

```
# nginx -V

nginx version: nginx/1.9.3
built by gcc 4.8.3 20140911 (Red Hat 4.8.3-9) (GCC)
built with OpenSSL 1.0.1e-fips 11 Feb 2013
TLS SNI support enabled
configure arguments: --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-threads --with-stream --with-stream_ssl_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_spdy_module --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic'
```

* Note: The paths for modules, logs, and the pid file differ from environment to environment.

First, let's upgrade to 1.9.5 or later and introduce `http_v2_module`.

## Installing Nginx 1.9.6

This time we'll install `1.9.6`, the latest version as of <b>2015.11.17</b>.

```
# cd /usr/local/src
# wget http://nginx.org/download/nginx-1.9.6.tar.gz
# tar xvf load/nginx-1.9.6.tar.gz
# cd nginx-1.9.6
# ./configure --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-threads --with-stream --with-stream_ssl_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_v2_module --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic'

# make
# make install

   ~~~ installation complete ~~~

# nginx -V
nginx version: nginx/1.9.6
built by gcc 4.8.3 20140911 (Red Hat 4.8.3-9) (GCC)
built with OpenSSL 1.0.1e-fips 11 Feb 2013
TLS SNI support enabled
configure arguments: --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_v2_module --with-http_geoip_module --with-cc-opt='-O2 -g -pipe -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector --param=ssp-buffer-size=4 -m64 -mtune=generic'
```

You can see that the version is now 1.9.6,
and that `--with-http_v2_module` has been added to the configure arguments.

The key point is to swap the previously installed `http_spdy_module` for `http_v2_module` and rebuild.
If there is no `--with-http_spdy_module`, simply add `--with-http_v2_module`.

## Modifying the Nginx server Directive

Update it so that ssl supports HTTP/2.0.

```
server {
-    listen 443;
+    listen 443 ssl http2;
```

## Nginx configure test & reload

- Run a configure test.
- If you don't see `syntax is ok` as shown below, there's an error in your configuration, so fix it.

```
# nginx -t

nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

- Reload the configuration.

```
# nginx -s reload
```

That completes the setup.
We were able to upgrade the version with zero downtime and install http_v2_module.

Now let's access a page served over the https scheme right away.

## Verifying the HTTP/2.0 Configuration

- Verify with the SPDY indicator extension for the Chrome browser
- Verify in FireFox via Developer Tools > Network > Headers

#### Verifying with the SPDY Indicator

[HTTP/2 and SPDY indicator](https://chrome.google.com/webstore/detail/http2-and-spdy-indicator/mpbpobfflnpcgagjijhmgnchggcjblin?hl=ja)

After installing the extension and checking,
you can confirm that the SPDY indicator has turned blue.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151117/20151117105049.png" width="100%">
</div>

#### Verifying in FireFox via Developer Tools > Network > Headers

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151117/20151117105530.png" width="100%">
</div>

## Reference Sites

- [Verifying HTTP/2 connections (not spdy3.1) with nginx](http://qiita.com/takapan/items/756be5b47134f9e51a11)
- [h2load, a load-testing tool that supports HTTP/2 and SPDY](http://qiita.com/tatsuhiro-t/items/6cbe5b095e24d7feb381)
