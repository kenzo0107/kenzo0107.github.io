---
layout: post
title: The Day the HTTP/2 and SPDY Indicator Stopped Glowing Blue on Nginx
date: 2016-08-10
lang: en
translation_id: nginx-http2
permalink: en/2016/08/10/nginx-http2/
cover: https://i.imgur.com/UCaU0sE.jpg
---

## Overview

The Chrome Extension HTTP/2 and SPDY indicator is a Chrome plugin
that lets you confirm whether you are communicating over HTTP/2.

One day it showed up as "not enabled," so
I'm summarizing how I dealt with it.

![](https://i.imgur.com/HVAqlli.png)

## What Was the Cause After All

![](https://i.imgur.com/Mo50mLo.png)

<span style="color:red">It was because ALPN was not supported.</span>

[ALPN Wiki](https://ja.wikipedia.org/wiki/Application-Layer_Protocol_Negotiation)

I arrived at this conclusion using the following HTTP/2 communication test service.

{% linkPreview https://tools.keycdn.com/http2-test _blnak %}

## So What Do We Fix

We move to the OpenSSL 1.0.2 series, which supports ALPN,
and rebuild Nginx with OpenSSL 1.0.2 or later.

* As of `2016/08/10`, the latest version is 1.0.2h.

## Installing OpenSSL 1.0.2h

```console
# cd /usr/local/src
# wget https://www.openssl.org/source/openssl-1.0.2h.tar.gz
# tar xvf openssl-1.0.2h.tar.gz
# cd openssl-1.0.2h
# ./config
# make
# make test
# make install
```

## Replacing the Current OpenSSL

```console
# which openssl
/usr/bin/openssl

# mv /usr/bin/openssl /root/
# ln -s /usr/local/ssl/bin/openssl /usr/bin/openssl

# openssl version
OpenSSL 1.0.2h  3 May 2016
```

## Checking the Nginx Version

```console
# nginx -v
nginx version: nginx/1.11.3
```

## Checking the Current configure Status

```console
# nginx -V

nginx version: nginx/1.11.3
built by gcc 4.8.5 20150623 (Red Hat 4.8.5-4) (GCC)
built with OpenSSL 1.0.2h  3 May 2016
TLS SNI support enabled
configure arguments: --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --modules-path=/usr/lib64/nginx/modules --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-http_xslt_module=dynamic --with-http_image_filter_module=dynamic --with-http_geoip_module=dynamic --with-http_perl_module=dynamic --add-dynamic-module=njs-1c50334fbea6/nginx --with-threads --with-stream --with-stream_ssl_module --with-stream_geoip_module=dynamic --with-http_slice_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_v2_module --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic'
```

- If the configure parameters include njs, such as `--add-dynamic-module=njs-1c50334fbea6/nginx`, remove it.
  If it is included, configure will fail. (See the previous article.)

{% linkPreview https://kenzo0107.github.io/2016/06/26/2016-06-27-versionup-nginx/ _blnak %}

- To explicitly specify openssl, add the following parameter.

```
--with-openssl=/usr/local/src/openssl-1.0.2h
```

## Downloading the 1.11.3 Source on the Assumption of Not Changing the Current Nginx Version

```console
# cd /usr/local/src
# wget http://nginx.org/download/nginx-1.11.3.tar.gz
# tar xvf nginx-1.11.3.tar.gz
```

## Rebuilding Nginx

```console
# cd /usr/local/src/nginx-1.11.3
# ./configure --prefix=/etc/nginx --with-openssl=/usr/local/src/openssl-1.0.2h --sbin-path=/usr/sbin/nginx --modules-path=/usr/lib64/nginx/modules --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-http_xslt_module=dynamic --with-http_image_filter_module=dynamic --with-http_geoip_module=dynamic --with-http_perl_module=dynamic --with-threads --with-stream --with-stream_ssl_module --with-stream_geoip_module=dynamic --with-http_slice_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_v2_module --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic'

# make
# make test
# make install
```

## Checking the Version

- You can confirm that "built with OpenSSL" now reads 1.0.2h.

```console
# nginx -V
nginx version: nginx/1.11.3
built by gcc 4.8.5 20150623 (Red Hat 4.8.5-4) (GCC)
built with OpenSSL 1.0.2h  3 May 2016
TLS SNI support enabled
configure arguments: --prefix=/etc/nginx --with-openssl=/usr/local/src/openssl-1.0.2h --sbin-path=/usr/sbin/nginx --modules-path=/usr/lib64/nginx/modules --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-http_xslt_module=dynamic --with-http_image_filter_module=dynamic --with-http_geoip_module=dynamic --with-http_perl_module=dynamic --with-threads --with-stream --with-stream_ssl_module --with-stream_geoip_module=dynamic --with-http_slice_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_v2_module --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic'
```

## Nginx Syntax Check

```console
# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

## Restarting Nginx

```console
# systemctl restart nginx
```

## Checking the HTTP/2 and SPDY indicator

<span style="color:blue">It glowed blue!</span>

![](https://i.imgur.com/l2I81xQ.png)

The HTTP/2 test also confirmed that ALPN is now supported.

![](https://i.imgur.com/Dk0ElBO.png)
