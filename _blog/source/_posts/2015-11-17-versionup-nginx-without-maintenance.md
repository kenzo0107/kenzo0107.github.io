---
layout: post
title: 運用中のNginxをノーメンテでバージョンアップ&HTTP2.0モジュールを導入
date: 2015-11-17
tags:
- Nginx
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160810/20160810163018.png
---

## 概要

運用中の Nginx に HTTP2.0モジュール `http_v2_module` を導入し
サイトのパフォーマンス向上を図ります。

※ Nginx 1.9.5 から `http_spdy_module` は `http_v2_module` に変更しています。

## 環境
- CentOS Linux release 7.1.1503 (Core)
- Nginx 1.9.3 インストール済み/稼働中

## したいこと

- Nginx のバージョンアップ (1.9.5以上)
- http_v2_module インストール


## 現状確認

```
# nginx -V

nginx version: nginx/1.9.3
built by gcc 4.8.3 20140911 (Red Hat 4.8.3-9) (GCC)
built with OpenSSL 1.0.1e-fips 11 Feb 2013
TLS SNI support enabled
configure arguments: --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-threads --with-stream --with-stream_ssl_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_spdy_module --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic'
```

※moduleやlog, pidのパスは各環境に毎に異なります。

まずは 1.9.5以上にバージョンアップして `http_v2_module` を導入したいと思います。

## Nginx 1.9.6 インストール

今回は <b>2015.11.17</b> 時点で最新の `1.9.6` をインストールします。

```
# cd /usr/local/src
# wget http://nginx.org/download/nginx-1.9.6.tar.gz
# tar xvf load/nginx-1.9.6.tar.gz
# cd nginx-1.9.6
# ./configure --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-threads --with-stream --with-stream_ssl_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_v2_module --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic'

# make
# make install

   ~~~ インストール完了 ~~~

# nginx -V
nginx version: nginx/1.9.6
built by gcc 4.8.3 20140911 (Red Hat 4.8.3-9) (GCC)
built with OpenSSL 1.0.1e-fips 11 Feb 2013
TLS SNI support enabled
configure arguments: --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-mail --with-mail_ssl_module --with-file-aio --with-ipv6 --with-http_v2_module --with-http_geoip_module --with-cc-opt='-O2 -g -pipe -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector --param=ssp-buffer-size=4 -m64 -mtune=generic'
```

version が 1.9.6 となり
configure arguments に `--with-http_v2_module` が追加されていることがわかります。


要点は元々導入済み `http_spdy_module` を `http_v2_module` に変更しビルドです。
`--with-http_spdy_module` がなければ `--with-http_v2_module` 追加です。

## nginx serverディレクティブ修正

ssl http2.0対応する様、修正します

```
server {
-    listen 443;
+    listen 443 ssl http2;
```

## Nginx configure test & reload

- configure test 実施します。
- 以下のように `syntax is ok` が出ない場合は設定に誤りがあるので修正してください。

```
# nginx -t

nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

- 設定を再読み込みします。

```
# nginx -s reload
```

上記で設定完了です。
これまでノーメンテでバージョンアップし、http_v2_moduleインストールができました。

早速httpsスキーマとなるページにアクセスしてみましょう。

## http2.0設定確認

- Chrome ブラウザの Extension SPDYインディケータで確認
- FireFox 開発ツール> ネットワーク > ヘッダから確認


#### SPDYインディケータで確認

[HTTP/2 and SPDY indicator](https://chrome.google.com/webstore/detail/http2-and-spdy-indicator/mpbpobfflnpcgagjijhmgnchggcjblin?hl=ja)

拡張モジュールをインストールして確認してみると
SPDYインディケータが青くなっていることが確認できます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151117/20151117105049.png" width="100%">
</div>

#### FireFox 開発ツール> ネットワーク > ヘッダから確認

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151117/20151117105530.png" width="100%">
</div>

## 参考サイト

* [nginxでHTTP2接続(not spdy3.1)の検証](http://qiita.com/takapan/items/756be5b47134f9e51a11)
* [HTTP/2, SPDY 対応の負荷テストツール h2load](http://qiita.com/tatsuhiro-t/items/6cbe5b095e24d7feb381)
