---
layout: post
title: Upgrading PHP + OpenSSL
date: 2016-02-23
lang: en
translation_id: versionup-php-openssl
permalink: en/2016/02/22/versionup-php-openssl/
tags:
  - PHP
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160222/20160222184453.jpg
---

## Overview

When upgrading the Veritrans module,
disabling SSL v3.0 / TLS 1.0 became <font color='red'>mandatory within 2016</font>.

This is a required step as part of a global security initiative, so
not only Veritrans but every other payment system (and non-payment systems too) must take the same countermeasures.

[Google discloses the SSL 3.0 vulnerability "POODLE"; SSL 3.0 to be deprecated going forward](http://internet.watch.impress.co.jp/docs/news/20141015_671482.html)

In the Veritrans payment module for EC-CUBE,
PHP uses the OpenSSL library to communicate with the payment service.

That PHP OpenSSL library needs to be upgraded to 1.0.1i or later (the latest version is recommended).

The ToDo items for this are as follows.

> To use TLS 1.1 or later, you need OpenSSL 1.0.1i or later
> → Upgrade OpenSSL (1.0.1i or later)
> → Recompile PHP and upgrade the OpenSSL library (1.0.1i or later)

I have summarized how to handle the above.

* Note: The Apache configuration to disable SSL v3.0 / TLS 1.0 is covered separately.
A quick Google search will turn it up right away ♪

## Environment

- CentOS release 6.6 (Final)
- PHP 5.3.9
- openssl 1.0.1g

## Steps

### Check the OpenSSL library version used by PHP

Since we are going to recompile PHP from here,
it is fine even if OpenSSL support is disabled.

* Note: This assumes a case where it is already installed.

```
# php -i | grep OpenSSL

OpenSSL support => enabled
OpenSSL Library Version => OpenSSL 1.0.1g  28 Jan 2016
OpenSSL Header Version => OpenSSL 1.0.1g  28 Jan 2016
OpenSSL support => enabled
```

We can confirm that the OpenSSL Library and Header Version used by PHP are `1.0.1g`.

### Back up the existing openssl

Since it is likely already installed,
we will set the current version aside for now.

```
# openssl version
1.0.1g

# which openssl
/usr/local/bin/openssl

// Rename it to keep as a backup
# mv /usr/local/bin/openssl /usr/local/bin/openssl1.0.1g
```

Just in case something goes wrong, I took a backup so I can roll back.

## Upgrade openssl

Build it from source.

```
# cd /usr/local/src
# wget http://www.openssl.org/source/openssl-1.0.2f.tar.gz
# tar xzvf openssl-1.0.2f.tar.gz
# cd openssl-1.0.2f
# ./config --prefix=/usr/local shared -fPIC
# make
# make install
```

`-fPIC` is needed so that mod_ssl can be built as a dynamic shared object (DSO)
and hooked into and used from the PHP binary executable,
I would say.

## Verify the openssl upgrade

I confirmed that the upgrade was applied correctly.

```
# openssl version

OpenSSL 1.0.2f  28 Jan 2016
```

## Recompile PHP

- Check how the existing PHP was configured

```
# php -i | grep config

Configure Command =>  './configure'  '--enable-mbstring' '--enable-zend-multibyte' '--with-mysql' '--with-mysqli' '--enable-mbregex' '--with-gd' '--with-jpeg-dir=/usr/lib' '--with-png-dir=/usr/lib' '--with-freetype-dir=/usr/lib' '--with-zlib-dir' '--with-libdir=lib64' '--enable-soap' '--with-apxs2=/etc/httpd/bin/apxs' '--with-openssl=/usr/local'
```

If `--with-openssl` is missing, add it as shown above.
In this case it is already specified.

Using the configure information above,
after confirming that `--with-openssl` is present,
recompile.

- Recompile

```
# cd /usr/local/src/php-5.3.9
# ./configure --enable-mbstring --enable-zend-multibyte --with-mysql --with-mysqli --enable-mbregex --with-gd --with-jpeg-dir=/usr/lib --with-png-dir=/usr/lib --with-freetype-dir=/usr/lib --with-zlib-dir --with-libdir=lib64 --enable-soap --with-apxs2=/etc/httpd/bin/apxs --with-openssl=/usr/local
# make
# make install
```

If you get an error like the following, please review the "Upgrade openssl" step.
This is the kind of error that appears when you have freshly compiled and built openssl from source.

```
configure: error: Cannot find OpenSSL's <evp.h>
```

## Check the OpenSSL library version used by PHP

```
# php -i | grep OpenSSL

OpenSSL support => enabled
OpenSSL Library Version => OpenSSL 1.0.2f  28 Jan 2016
OpenSSL Header Version => OpenSSL 1.0.2f  28 Jan 2016
OpenSSL support => enabled
```

Both the OpenSSL Library and Header Version are now as specified.

That's all.
