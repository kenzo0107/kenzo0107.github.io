---
layout: post
title: .htaccessでmod_rewriteを利用可能にする
date: 2015-06-24
---

# 概要
あまり意識せず利用しているmod_rewriteですが
httpd設定により使用できない場合があります。



以下設定手順をまとめました。

# 設定手順

## /etc/httpd/conf/httpd.conf 修正


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

##上記修正後 httpd 再起動

```
# service httpd restart
```
