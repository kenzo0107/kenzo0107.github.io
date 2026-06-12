---
layout: post
title: Changing the Character Encoding of a Filename Instead of Its Contents
date: 2016-03-16
category: Infrastructure
lang: en
translation_id: encode-filename
permalink: en/2016/03/16/encode-filename/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160408/20160408142205.jpg
---

## Overview

When you want to send something like a sales report for an EC site, there are
occasionally cases where you have no choice but to use Japanese in the filename
(because the client insists "It absolutely has to be Japanese!").

- The client's environment is Windows.
- The default character encoding for the Windows desktop is Shift JIS.

If a file created on Linux has the default encoding of UTF-8, you might attach it
to an email and send it, only for the recipient's Windows PC to download it with
a garbled filename.

For situations like this, I changed the character encoding of the filename itself
rather than the contents of the file, so here is a summary of how I handled it.

## Environment

- CentOS release 5.11 (Final)
- convmv 1.10

We will use convmv.

- On CentOS, install it with yum.

```
# yum install -y convmv
```

## Procedure

- We assume the default character encoding is UTF-8.

```
// Create a file named "ほげほげ" in UTF-8
$ touch ほげほげ

// Convert the filename encoding from UTF-8 to Shift JIS
$ convmv -r -f utf8 -t sjis ほげほげ --notest
mv "./ほげほげ" "./ق°ق°"
Ready!

$ ls -al
-rw-rw-r-- 1 user group     0  3月 16 16:45 ?ق??ق?
```

It turns into completely unreadable characters.

I would be glad if this helps anyone dealing with the occasional "It absolutely
has to be in Japanese!" request.
