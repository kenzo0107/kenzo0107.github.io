---
layout: post
title: "Nginxエラー調査 「duplicate MIME type 'text/html' in /etc/nginx/nginx.conf」"
date: 2015-10-05
tags:
- Nginx
---

## 概要
エラーログをslackに通知させるようにしてるとほんと便利。


{% linkPreview http://kenzo0107.hatenablog.com/entry/2015/09/24/011418 _blank %}



時たまなんですが、なんだこれ？というのが送られてくる。

その一つが掲題のエラー。

```
duplicate MIME type "text/html" in /etc/nginx/nginx.conf
```

nginx.confを見てみると
gzip_typesで設定した `text/html` でした。

直訳すると

```
/etc/nginx/nginx.confでMIMEタイプ「text/html」が重複しています。
```

じゃ、消せばいいかなってことなので消せば解決しました。


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


## 別にどこかで指定されているの？

結論を言うと
- `ngx_http_gzip_module`をインストールしており
- `gzip on` としている
と、デフォルトで`text/html`がMIMEタイプが指定されます。

以下公式サイトを見るとわかります。

[gzip_types](http://nginx.org/en/docs/http/ngx_http_gzip_module.html#gzip_types)

`text/html`タイプは常に圧縮対象としているそうです。

なので、gzip で圧縮処理をする場合は
`text/html`が不要です。

ということでした。
