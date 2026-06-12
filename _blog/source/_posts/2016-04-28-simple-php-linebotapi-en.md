---
layout: post
title: Writing a Dead-Simple LINE Bot API in PHP
date: 2016-04-28
category: Infrastructure
lang: en
translation_id: simple-php-linebotapi
permalink: en/2016/04/28/simple-php-linebotapi/
tags:
  - PHP
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160428/20160428003806.png
---

## Overview

I wrote a script for the much-talked-about LINE Bot API in PHP.

As simple as possible = easy to customize

That was the goal, so I tried to limit the places you need to modify in order to use it.

## What I Built

Type any random text → it replies "hello"
Type "perfect" → it replies "human"

It's a truly simple thing that just responds like that.

If you customize that logic part, you can make your own bot.

## Environment

- Sakura Rental Server VPS, CentOS release 6.7 (Final)
- PHP 5.6.16

For SSL, I used the free StartSSL. For obtaining and configuring it, please refer to the following.

{% linkPreview http://kenzo0107.hatenablog.com/entry/2016/02/25/112253 _blank %}

## The Script

{% gist kenzo0107/9cc3245b57308aeadff61d3c76413f6b %}

###

`function getMessage` is where you decide the message you want the bot to reply with.

If you call another API there, scrape a site, or otherwise fetch some information and return it, you've got yourself a simple message-replying LINE bot.

## Here's How It Looks!

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160428/20160428003454.png" width="100%">
</div>
