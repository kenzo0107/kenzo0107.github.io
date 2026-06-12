---
layout: post
title: What to Do When .htaccess Doesn't Work or Has No Effect
date: 2016-03-28
category: Infrastructure
lang: en
translation_id: htaccess_not_move
permalink: en/2016/03/28/htaccess_not_move/
tags:
  - .htaccess
  - Apache
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160408/20160408141839.jpg
---

## Overview

This is about what to do when things don't behave as configured in your .htaccess, or when it looks like the file isn't being read at all.

For cases like "mod_rewrite redirects work over http but not over https,"
most common misconfiguration patterns can be resolved by checking the following basics.

## Test Environment

- CentOS 6.6 (Final)
- Apache/2.2.15(Unix)

## What You Need in Order to Use .htaccess at All

You need the following directive in a configuration file such as `/etc/httpd/conf/httpd.conf`.

```
AllowOverride All
```

## What You Need in Order to Use mod_rewrite

To use mod_rewrite, which is used very frequently, you need the following.

#### 1. Install mod_rewrite.so

#### 2. Load mod_rewrite.so from the Apache configuration file

Let's start by checking the above.

## 1. Verify mod_rewrite.so Is Installed

With Apache, it's usually stored under the modules directory.

```sh
$ ls -al /etc/httpd/modules/mod_rewrite.so
-rwxr-xr-x 1 root root 60464 10月 16 23:49 2014 /etc/httpd/modules/mod_rewrite.so
```

## 2. Verify mod_rewrite.so Is Loaded from the Apache Configuration File

In an Apache configuration file such as
`/etc/httpd/conf/httpd.conf` or `/etc/httpd/conf.d/*.conf`, the following is configured.

* Note: In some environments the configuration file is not placed in `/etc/httpd/conf/httpd.conf`,
　so treat this as a general example only.

```sh
LoadModule rewrite_module modules/mod_rewrite.so
```

## Additional Notes

The module-loading configuration usually has
`AllowOverride All` set within a `<Directory>` directive, like the following.

In the example below, under the "/var/www/html" directory, the .htaccess you place there takes priority for configuration.

```sh
<Directory "/var/www/html">
    AllowOverride All
    Options -Indexes FollowSymLinks Includes ExecCGI
    Order allow,deny
    Allow from all
</Directory>
```

In the unlikely event that the mod_rewrite.so module does not exist, you will need to recompile Apache.

## Installing mod_rewrite into Apache and Recompiling

- Recompile and restart Apache.

```sh
$ sudo su -
# cd <path to httpd source>
# ./configure –enable-ssl=shared –enable-rewrite –enable-deflate –enable-headers –enable-so
# make & make install
# service httpd restart
```

That's all.
