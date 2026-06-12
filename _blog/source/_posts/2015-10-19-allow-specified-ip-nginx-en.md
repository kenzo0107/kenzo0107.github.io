---
layout: post
title: Configuring Nginx Basic Authentication and Allowing Only Specific IPs Such as the Office Network
date: 2015-10-19
category: Infrastructure
lang: en
translation_id: allow-specified-ip-nginx
permalink: en/2015/10/19/allow-specified-ip-nginx/
cover: /img/cover/2015-10-19-allow-specified-ip-nginx.svg
tags:
- Nginx
---

## Overview

Before releasing a service, I needed to put Basic authentication in front of it with Nginx.

It happened to coincide with an internal rollout, and since the Basic authentication popup was annoying, I wanted to turn it off only for the office network. To do that, I used the configuration below.



## Configuring Basic Authentication

```
# yum install -y httpd-tools
```

```
# cd /etc/nginx
# htpasswd -c .htpasswd <Basic認証ユーザ>
New password: <Basic認証ユーザのパスワード入力>
Re-type new password: <もう一度、Basic認証ユーザのパスワード入力>
```

### Editing the Nginx Configuration File

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

## When You Want to Allow Only Specific IPs

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

After that, you can keep adding allowed IPs as needed.

I think this is a pretty common Nginx scenario in web application development.

That's it.
