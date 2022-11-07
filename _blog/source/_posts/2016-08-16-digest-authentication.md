---
layout: post
title: Digest 認証設定
date: 2016-08-16
cover: https://i.imgur.com/NMKovma.jpg
---

## Basic 認証 と Digest 認証の違い

### Basic 認証

- user と password を平文でサーバに送っている。
- 通信内容を傍受されると user / password がわかってしまう。

### Digest 認証

- user / password を MD5 で暗号化して通信してから送っている。

以上から Digest 認証の方がセキュリティ面で良いです。

## Digest 認証設定方法 (Apache)

- Digest 認証ファイル設定

```
$ htdigest -c "/var/www/.htpasswd" "Digest_Auth" <user_name>
```

- /etc/httpd/conf.d/vhost.conf

```
<VirtualHost *:80>
    ServerName jugem.jugem.jp
    DocumentRoot /var/www/html/jugem
    ErrorLog        logs/error.log
    TransferLog  logs/access.log

    <Directory "/var/www/html/jugem">
        Options Indexes FollowSymLinks Includes ExecCGI
        AllowOverride All
        Order allow,deny
        Allow from all
        AuthType Digest
        AuthName "Digest_Auth"
        AuthDigestProvider file
        AuthUserFile /var/www/.htpasswd     # ここで先ほど作成した Digest認証ファイルを指定
        AuthGroupFile /dev/null
        Require valid-user
    </Directory>
</VirtualHost>
```

## シンタックスチェックし問題なければ再起動

```
# httpd -t
Syntax OK

# service httpd graceful
```

## 確認

実際に 指定した ServerName にアクセスして
Digest 認証 が設定されているか確認してください。

![](https://i.imgur.com/sy9RVO4.png)

以上です。
