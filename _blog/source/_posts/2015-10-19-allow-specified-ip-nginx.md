---
layout: post
title: Nginx Basic認証設定、社内IPなど特定ipのみ許可
date: 2015-10-19
tags:
- Nginx
---

## 概要

サービス公開前にNginxで
Basic認証を掛ける必要がありました

ちょうど社内公開したときでもあり
Basic認証のポップアップが出るのが鬱陶しいのもあって
社内だけオフりたい、というときに以下のような設定をしました。



## Basic認証設定

```
# yum install -y httpd-tools
```

```
# cd /etc/nginx
# htpasswd -c .htpasswd <Basic認証ユーザ>
New password: <Basic認証ユーザのパスワード入力>
Re-type new password: <もう一度、Basic認証ユーザのパスワード入力>
```

### Nginx configureファイル編集

```
# vim /etc/nginx/conf.d/default.conf
```

```
    location / {
        ....

        # Basic認証設定
        auth_basic           "Restricted";
        auth_basic_user_file /etc/nginx/.htpasswd;

        ....
    }

```

## 特定IPのみ許可したい場合

```
# vim /etc/nginx/conf.d/default.conf
```

```
    location / {
        ....

        # add start -----
        satisfy any;
        allow   <許可IP>;
        allow   <許可IP>;
        deny    all;
        # add end -----

        # Basic認証設定
        auth_basic           "Restricted";
        auth_basic_user_file /etc/nginx/.htpasswd;

        ....
    }

```

あとは 許可IPを随時増やせば良いです。

Webアプリケーション開発におけるNginxあるあるかなと思います♪

以上です。
