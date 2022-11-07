---
layout: post
title: Nginx IP 直アクセス不許可 & LB ヘルスチェック設定
date: 2019-04-24
tags:
  - Nginx
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190424/20190424103347.png
---

よく設定している Nginx の configure file のアクセス元によっての振り分け方をまとめました。

```
LB → Nginx → Rails
```

<!-- more -->

## Nginx 設定

- conf.d/default.conf

```
# cannot allow ip direct
server {
  listen       80;
  server_name  _;
  return       444;
}

# healthcheck from LB
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  root /work/app/public;

  location = /healthcheck.html {
    access_log  off;
    proxy_pass https://puma;
  }
}

server {
  listen  80;
  server_name example.com;
  ...
```

### IP 直アクセス禁止

`server_name _` とすることで、ip 直アクセスをターゲットにしています。

```
server {
  listen       80;
  server_name  _;
  return       444;
}
```

### LB からのヘルスチェック

LB からヘルスチェックを向ける先を `default_sever` 設定することで、この `server` ディレクティブを参照します。

```
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  root /work/app/public;

  location = /healthcheck.html {
    access_log  off;
    proxy_pass https://puma;
  }
}
```

上記 config file は、AWS ALB のヘルスチェックパスを `/healthcheck.html` とし、その向け先を Rails puma にしています。

Rails 側で以下の様に gem 'ok_computer' に向けるのも良し、独自にレスポンス返すも良しです。

```ruby
get 'healthcheck.html', to: 'ok_computer/ok_computer#index'
```

### ドメイン指定

`example.com` でアクセスされた際にこちらの `server` ディレクティブを参照します。

```
server {
  listen  80;
  server_name example.com;
  ...
```

### ドメイン指定の悪い例

以前は以下の様に指定し、ip 直アクセス、ヘルスチェック対応していました。

```
server {
    listen 80;
    server_name example.com;

    if ($host != &#34;example.com&#34;) {
        return 444;
    }

    location = /healthcheck.html {
      access_log  off;
      proxy_pass https://puma;
    }
    ...
}
```

勿論これでも動作します。ですが、やや可読性が悪いです。

マルチドメインでの IP 直アクセス不許可に対応をする際にも、この if 文がどんどん長くなります。

その為、向け先の意図毎に `server {}` を小まめに分ける運用の方が可読性が高く、実運用していてメンテナンサビリティが高いと感じました。

以上
参考になれば幸いです。
