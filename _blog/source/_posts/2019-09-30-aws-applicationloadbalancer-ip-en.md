---
layout: post
title: Showing a Maintenance Page to All but Specific IPs with AWS Application Load Balancer Listener Rules
date: 2019-09-30
category: AWS
lang: en
translation_id: aws-applicationloadbalancer-ip
permalink: en/2019/09/30/aws-applicationloadbalancer-ip/
tags:
  - AWS
  - ALB
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190929/20190929233947.png
---

## Overview

A web service we run on AWS needed maintenance, so I've put together how I switched it into maintenance mode using the ALB.

<!-- more -->

## Steps

Change the rules from the ALB Listener list.

* Note: This time only 2 ports were open, and since 80 forwards to 443, I only handled 443.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190929/20190929232804.png" width="100%">
</div>

Then,

- Source IP = office IP (e.g. `11.22.33.44/32`) → forward to the default TargetGroup, and "Save"
- All source IPs other than the office IP (`0.0.0.0/0`) → respond with a `503` `text/html` maintenance message, and "Save"

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190929/20190929231656.png" width="100%">
</div>

With that, the office IP can access the site as usual, while everyone else is shown the maintenance page.

You can't add multiple rules and save them all at once; you save them one rule at a time.

## What Content-Types can be returned in the response?

You can also return things like `application/json` for the Content-Type, so I used this to pass a message when an API server was under maintenance.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190929/20190929232354.png" width="100%">
</div>

## A small caveat

The maximum length was 1024 characters ♪

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190929/20190929232942.png" width="100%">
</div>

Adding CSS to the `response body` would likely push it over the 1024-character limit, so instead I uploaded it to S3, made it public, and referenced it from there.
