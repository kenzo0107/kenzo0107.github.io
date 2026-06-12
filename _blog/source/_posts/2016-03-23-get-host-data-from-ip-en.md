---
layout: post
title: Getting Host Information from an IP Address
date: 2016-03-23
category: Infrastructure
lang: en
translation_id: get-host-data-from-ip
permalink: en/2016/03/23/get-host-data-from-ip/
tags:
  - ipinfo
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160408/20160408142036.png
---

## Overview

I wrote a shell script that retrieves host information
using the [ipinfo.io](http://ipinfo.io/) API.

I use it to investigate the source host of connections
when suspicious access starts to increase.

{% gist kenzo0107/126e687ebc0a4b1747c7 %}
