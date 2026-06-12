---
layout: post
title: How to Stop Your "Registration Complete" Emails from Landing in Spam
date: 2016-12-02
lang: en
translation_id: meiwaku-mail
permalink: en/2016/12/02/meiwaku-mail/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161202/20161202122453.png
tags:
  - spam
---

## Overview

A configuration that's easy to forget when building a site:
"Our registration-complete emails keep ending up in spam."

You need to set up an SPF record and configure reverse DNS lookup.

## First, What Is Forward DNS Lookup?

> domain --- query ---> IP address

Suppose you have an email address like the following.

`info@hogehoge.jp`

Querying the IP address from `hogehoge.jp` is called a `forward lookup`.

## What Is Reverse DNS Lookup?

> IP address --- query ---> domain

Querying `hogehoge.jp` from an IP address is called a `reverse lookup`.

## SPF Record

SPF = Sender Policy Framework

It's a framework that defines the policy of the side sending email.

## Why Does Such a Framework Exist?

Because spoofing the sender is trivially easy!

```
$ echo "TEST" | sendmail -f aiueo@xxxx.jp -t kenzo.xxxxxx.0107@gmail.com
```

<div style="text-align:center;">
<img src="http://i.imgur.com/brOZazX.png" width="100%">
</div>

## What Setting Up an SPF Record Means

Setting up an SPF record means that, by specifying the sender's IP address and domain,
the recipient can verify whether the sender's email address matches
the IP and domain information configured in the SPF record.

## What Configuring Reverse Lookup Means

It lets you compare the domain derived from the sender's IP address
with the domain tied to the reverse-lookup-configured IP, and
if they differ, judge it to be spoofed.

Services like Gmail have this filter enabled, so
if reverse lookup isn't configured, your mail ends up in the spam box.

## Verifying the SPF Record Setting

```
$ dig -t TXT <mail domain>
```

- Example) gmail.com

```
$ dig -t TXT gmail.com

gmail.com.              300     IN      TXT     "v=spf1 redirect=_spf.google.com"
```

- Example) yahoo.co.jp

```
$ dig -t TXT yahoo.co.jp

yahoo.co.jp.            6       IN      TXT     "v=spf1 include:spf.yahoo.co.jp ~all"
```

## Verifying the SPF Record Setting in Gmail

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161202/20161202121710.png" width="100%">
</div>

- When SPF: NEUTRAL, the SPF record is not configured correctly.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161202/20161202121724.png" width="100%">
</div>

- When SPF: PASS, the SPF record is configured correctly.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161202/20161202122051.png" width="100%">
</div>

That's all.
