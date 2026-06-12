---
layout: post
title: Adding the GeoIP Library to an Already-Installed Nginx
date: 2015-10-01
lang: en
translation_id: nginx-geoip-library
permalink: en/2015/10/01/nginx-geoip-library/
cover: /img/cover/2015-10-01-nginx-geoip-library.svg
tags:
- Nginx
---


## Overview
I had originally installed Nginx via yum, but since I needed to do IP-based restrictions and to look up IP information with fluentd, GeoIP became necessary.

To do this, I needed to download Nginx from source again, add the library, and recompile.

## Reasons for Installing GeoIP
- Append IP information to logs and analyze it with fluentd.
- Make IP allow-list restrictions possible.
- - I dealt with this because there had been unauthorized access from overseas.

## Environment
- CentOS7
- Nginx1.8
- EC2

## Checking the Currently Available Nginx Modules

```
# nginx -V

nginx version: nginx/1.8.0
built by gcc 4.8.3 20140911 (Red Hat 4.8.3-9) (GCC)
built with OpenSSL 1.0.1e-fips 11 Feb 2013
TLS SNI support enabled
configure arguments: --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_spdy_module --with-cc-opt='-O2 -g -pipe -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector --param=ssp-buffer-size=4 -m64 -mtune=generic'
```


`--with-http_geoip_module` is missing!

So I'll install GeoIP and recompile Nginx.

## Installing the GeoIP Library

```
$ sudo yum install -y GeoIP GeoIP-devel
```

## Downloading the tar.gz of the Same Nginx Version

- Download from the following:
[Nginx Download](http://nginx.org/en/download.html)

Note: This time Nginx is 1.8.0, so I'll download nginx-1.8.0.tar.gz.

```
$ cd /usr/local/src
$ wget http://nginx.org/download/nginx-1.8.0.tar.gz
$ tar zxvf nginx-1.8.0.tar.gz
$ cd nginx-1.8.0
```
Copy the `configure arguments` that you checked earlier with `nginx -V`, add `--with-http_geoip_module` to them, and compile.

## Recompiling Nginx

```
$ cd /usr/local/src/nginx-1.8.0

$ ./configure --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_spdy_module --with-http_geoip_module --with-cc-opt='-O2 -g -pipe -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector --param=ssp-buffer-size=4 -m64 -mtune=generic'

...
checking for GeoIP library ... found        ← Properly installed!
checking for GeoIP IPv6 support ... found   ← Properly installed!
...
Configuration summary
  + using system PCRE library
  + using system OpenSSL library
  + md5: using OpenSSL library
  + sha1: using OpenSSL library
  + using system zlib library

  nginx path prefix: "/etc/nginx"
  nginx binary file: "/usr/sbin/nginx"
  nginx configuration prefix: "/etc/nginx"
  nginx configuration file: "/etc/nginx/nginx.conf"
  nginx pid file: "/var/run/nginx.pid"
  nginx error log file: "/var/log/nginx/error.log"
  nginx http access log file: "/var/log/nginx/access.log"
  nginx http client request body temporary files: "/var/cache/nginx/client_temp"
  nginx http proxy temporary files: "/var/cache/nginx/proxy_temp"
  nginx http fastcgi temporary files: "/var/cache/nginx/fastcgi_temp"
  nginx http uwsgi temporary files: "/var/cache/nginx/uwsgi_temp"
  nginx http scgi temporary files: "/var/cache/nginx/scgi_temp"


$ make
$ make install
```

## Checking the Nginx Modules Again

```
nginx -V

nginx version: nginx/1.8.0
built by gcc 4.8.3 20140911 (Red Hat 4.8.3-9) (GCC)
built with OpenSSL 1.0.1e-fips 11 Feb 2013
TLS SNI support enabled
configure arguments: --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_spdy_module --with-http_geoip_module --with-cc-opt='-O2 -g -pipe -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector --param=ssp-buffer-size=4 -m64 -mtune=generic'
```


I was able to confirm that `--with-http_geoip_module` is now configured as an available module.


I also didn't have to make any particular changes to the following configuration files, and running `systemctl restart nginx` worked without any problems.

```
/etc/nginx/nginx.conf
/etc/nginx/conf.d/*.conf
```

That's all.
