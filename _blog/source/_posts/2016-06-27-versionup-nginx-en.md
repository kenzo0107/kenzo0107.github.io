---
layout: post
title: 'Upgrading Nginx 1.9.6 → 1.11.1 to Address a Vulnerability'
date: 2016-06-27
category: Infrastructure
lang: en
translation_id: versionup-nginx
permalink: en/2016/06/27/versionup-nginx/
tags:
  - Nginx
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160627/20160627150549.png
---

Nginx 1.11.1, which addresses the vulnerability CVE-2016-4450, was released on 2016-05-31,
so I gave the upgrade a try right away.

[SIOS Tech. Lab - エンジニアのためになる技術トピックス](https://oss.sios.com/yorozu-blog/nginx-release-information-20160601)

I was able to do it with zero downtime.

## Checking the Current Nginx configure

```
# nginx -V
nginx version: nginx/1.9.6

configure arguments: --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --modules-path=/usr/lib64/nginx/modules --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-http_xslt_module=dynamic --with-http_image_filter_module=dynamic --with-http_geoip_module=dynamic --with-http_perl_module=dynamic --add-dynamic-module=njs-1c50334fbea6/nginx --with-threads --with-stream --with-stream_ssl_module --with-http_slice_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_v2_module --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic'
```

## Download nginx-1.11.1 from [http://nginx.org/en/download.html:title]

```
# cd /usr/local/src
# wget http://nginx.org/download/nginx-1.11.1.tar.gz
# tar xvf nginx-1.11.1.tar.gz
# cd nginx-1.11.1
```

## Install the Modules and Third-Party Packages (GeoIP-devel) Used by Nginx 1.11.1

Without running the following, nginx configure would not pass.

```
# yum install pcre-devel zlib-devel openssl-devel libxml2-devel libxslt-devel gd-devel perl-ExtUtils-Embed GeoIP-devel -y
```

- Nginx configure error when gd-devel is not installed

```
./configure: error: the HTTP image filter module requires the GD library.
You can either do not enable the module or install the libraries.
```

- Nginx configure error when libxslt-devel is not installed

```
./configure: error: the HTTP XSLT module requires the libxml2/libxslt
libraries. You can either do not enable the module or install the libraries.
```

## configure

From the configure parameters obtained in "Checking the Current Nginx configure",
remove "--add-dynamic-module=njs-1c50334fbea6/nginx".

- Nginx configure error when `--add-dynamic-module=njs-1c50334fbea6/nginx` is specified

```
adding module in njs-1c50334fbea6/nginx
./configure: error: no njs-1c50334fbea6/nginx/config was found
```

Remove "--add-dynamic-module=njs-1c50334fbea6/nginx" and run configure

```
./configure --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --modules-path=/usr/lib64/nginx/modules --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-http_xslt_module=dynamic --with-http_image_filter_module=dynamic --with-http_geoip_module=dynamic --with-http_perl_module=dynamic --with-threads --with-stream --with-stream_ssl_module --with-http_slice_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_v2_module --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic'

...
...

checking for GeoIP library ... found
checking for GeoIP IPv6 support ... found
creating objs/Makefile

Configuration summary
  + using threads
  + using system PCRE library
  + using system OpenSSL library
  + md5: using OpenSSL library
  + sha1: using OpenSSL library
  + using system zlib library

  nginx path prefix: "/etc/nginx"
  nginx binary file: "/usr/sbin/nginx"
  nginx modules path: "/usr/lib64/nginx/modules"
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
```

## Build

```
# make
# make install
```

## Checking the Nginx Version

```
# nginx -V

nginx version: nginx/1.11.1

configure arguments: --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --modules-path=/usr/lib64/nginx/modules --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-http_xslt_module=dynamic --with-http_image_filter_module=dynamic --with-http_geoip_module=dynamic --with-http_perl_module=dynamic --with-threads --with-stream --with-stream_ssl_module --with-http_slice_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_v2_module --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic'
```

## Syntax Check

It failed...

```
# nginx -t

nginx: [emerg] unknown directive "geoip_country" in /etc/nginx/nginx.conf:15
nginx: configuration file /etc/nginx/nginx.conf test failed
```

For directives that depend on third-party modules, you need to call the
SharedObject (\*.so) with `load_module`.

- Add the following at the top of /etc/nignx/nginx.conf

```
load_module "modules/ngx_http_geoip_module.so";
```

## Syntax Check Again

```
# nginx -t

nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

## Reload the Nginx Configuration

```
# systemctl reload nginx
```

With that, the Nginx upgrade completed successfully.
