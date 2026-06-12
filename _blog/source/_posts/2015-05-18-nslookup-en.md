---
layout: post
title: Checking Record Types with nslookup
date: 2015-05-18
lang: en
translation_id: nslookup
permalink: en/2015/05/18/nslookup/
cover: /img/cover/2015-05-18-nslookup.svg
---

## Overview

When you configure records in a cloud-based DNS management service (such as Onamae.com), you may sometimes see a message like:
"It may take up to 72 hours for the settings to take effect."

As a way to verify the configuration, I checked the settings using the nslookup command, so here are my notes.


## Steps

{% gist kenzo0107/8f932831c1bb1226187b %}
