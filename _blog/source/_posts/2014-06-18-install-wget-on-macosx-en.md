---
layout: post
title: Installing wget on Mac OS X
date: 2014-06-18
lang: en
translation_id: install-wget-on-macosx
permalink: en/2014/06/18/install-wget-on-macosx/
cover: /img/cover/2014-06-18-install-wget-on-macosx.svg
tags:
- wget
---

Run the following from your terminal.


### Download the compressed wget module (wget-x.x.x.tar.gz) with the curl command.
The curl `-O` option saves the output to a file with the same name as on the original system.

```sh
sudo curl -O http://ftp.gnu.org/pub/gnu/wget/wget-1.13.4.tar.gz
```

### Extract

```sh
sudo tar zxvf wget-1.13.4.tar.gz
```

### Move into the directory

```sh
cd wget-1.13.4
```


### Create the Makefile

A Makefile describes the results of checking the system-specific features and information required for the installation target.

```sh
sudo ./configure –with-ssl=openssl
```

If you don't add the `--with-ssl=openssl` option, you'll get an error like the following and won't be able to install:
configure: error: --with-ssl was given, but GNUTLS is not available.


### Compile the source files based on the Makefile

```sh
sudo make
```

### Install

```sh
sudo make install
```



As a test, run the following, and if "index.html" gets downloaded, you're all set!

```sh
wget http://yahoo.co.jp
```
