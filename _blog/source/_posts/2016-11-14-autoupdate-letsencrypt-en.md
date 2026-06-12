---
layout: post
title: Automatically Renewing Let's Encrypt SSL Certificates
date: 2016-11-14
category: Infrastructure
lang: en
translation_id: autoupdate-letsencrypt
permalink: en/2016/11/14/autoupdate-letsencrypt/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161114/20161114141731.png
tags:
  - SSL
  - Let's encrypt
---

## Overview

I use Let's Encrypt SSL because I want to use the https communication protocol
in my development environment, just like in production.

It's also handy when you're hosting multiple domains via virtual hosts,
since you can obtain a multi-domain SSL certificate.

With self-signed ("oreore") SSL certificates, some browsers display
"This page is not secure,"
which can make non-engineers uneasy and breed distrust.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161114/20161114141627.png" width="100%">
</div>

## Beta Version

This is the Let's Encrypt SSL certificate management script from the beta era.
The SSL auto-renewal script I created this time is not this one.

{% linkPreview https://github.com/digint/letsencrypt.sh _blank %}

### SSL Auto-Renewal Script

This is the Let's Encrypt auto-renewal (Apache) script I created this time.
It checks whether renewal is needed and sends a Slack notification.

When the certificate has fewer than 30 days left until expiration, it renews the SSL certificate and restarts httpd.

{% gist kenzo0107/94f073a4f94769b5bed18ed9c655bf02 %}

### cron Configuration

- Set to run at 6:00 AM on the first Saturday of every month

In a development environment, running it on Saturday means I'll notice and can fix it by Sunday at the latest.
This has worked out well in my current operations.

```
00 6 1-7 * * 6 root /root/letsencrypt.sh/refresh_cert.sh
```

### Slack Notification

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161114/20161114141352.png" width="100%">
</div>

## When You Want to Force a Renewal

As of May 7, 2016, the tool was renamed to `certbot-auto`,
and the following is the auto-renewal script using certbot-auto.

If it's not for production or for customer-facing verification purposes,
I think it's fine to use this one.

Specifying the `--force-renewal` option forces a renewal.

{% gist kenzo0107/913795f417c2ef666b6114e6c3f82ddc %}

## When You Don't Need Notifications at All

This one also uses `certbot-auto`.

- Set the command directly in cron
- Runs on the first Saturday of every month
- Keep a log just in case

```
00 6 1-7 * * 6 root /root/certbot/certbot-auto renew --force-renewal && service httpd graceful > /root/certbot/renewal.log
```

That's all.
