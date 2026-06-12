---
layout: post
title: Digest Authentication Setup
date: 2016-08-16
lang: en
translation_id: digest-authentication
permalink: en/2016/08/16/digest-authentication/
cover: https://i.imgur.com/NMKovma.jpg
---

## Difference Between Basic Authentication and Digest Authentication

### Basic Authentication

- The user and password are sent to the server in plain text.
- If the communication is intercepted, the user / password can be read.

### Digest Authentication

- The user / password are encrypted with MD5 before being sent over the wire.

For these reasons, Digest authentication is better from a security standpoint.

## How to Set Up Digest Authentication (Apache)

- Configure the Digest authentication file

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
        AuthUserFile /var/www/.htpasswd     # Specify the Digest authentication file created earlier here
        AuthGroupFile /dev/null
        Require valid-user
    </Directory>
</VirtualHost>
```

## Run a Syntax Check and Restart if There Are No Problems

```
# httpd -t
Syntax OK

# service httpd graceful
```

## Verification

Actually access the ServerName you specified and
confirm that Digest authentication is configured.

![](https://i.imgur.com/sy9RVO4.png)

That's all.
