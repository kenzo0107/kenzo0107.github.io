---
layout: post
title: Checking SSL Certificate Expiration and Notifying the Result to Slack
date: 2016-08-26
category: Infrastructure
lang: en
translation_id: valid-ssl-to-slack
permalink: en/2016/08/26/valid-ssl-to-slack/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160826/20160826150248.png
tags:
  - SSL
---

## Overview

```
The SSL certificate expired and the site became inaccessible.
```

I built this so that something like the above would not happen.

## Shell Script

- It checks the expiration dates of multiple domains configured in DOMAIN_LIST.

{% gist kenzo0107/35fcc7df045d98aa9bd781daf6345320 %}

* In practice, I run this on Jenkins, and the build parameters make it easy to add domains.

- I do a review every first Monday of the month.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160826/20160826150547.png" width="100%">
</div>

## Monitoring with Zabbix as Well

I found an article on Qiita.

[Monitoring SSL certificate expiration with Zabbix](http://qiita.com/skouno/items/a98bc384b4734a6e20a7)

You can also set up a phone notification once there is less than a week left. Whatever the measure, having something in place gives you peace of mind.

That's all.
