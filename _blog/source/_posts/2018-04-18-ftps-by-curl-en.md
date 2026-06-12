---
layout: post
title: Checking FTPS (File Transfer Protocol over SSL/TLS) Connectivity with curl
date: 2018-04-18
lang: en
translation_id: ftps-by-curl
permalink: en/2018/04/18/ftps-by-curl/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180418/20180418082402.png
tags:
  - FTPS
---

You can check FTPS connectivity with the following command.

```
curl -u <user> --ftp-ssl -k ftp://<ftp domain>/
```

## Overview

This is a memo-style post.

I had to allow FTPS connections from outside the company, so I set this up.

All I really wanted was to verify whether the user and password I had just created/updated would pass authentication. While looking for a way to do that, I found this command, which fit the bill nicely.

I had tried to verify the connection with FileZilla and Cyberduck, but somehow it just wouldn't work...

It made me realize once again that there are quite a lot of FTP-related commands out there, like `lftp` and many others, even for just FTP alone.
