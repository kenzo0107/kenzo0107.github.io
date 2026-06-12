---
layout: post
title: A Ruby 30-Second Cooking Script to Fetch IPs Accessed from Within Japan
date: 2016-05-26
category: Infrastructure
lang: en
translation_id: ruby-30-sec-cooking-get-access-ip-from-japan
permalink: en/2016/05/26/ruby-30-sec-cooking-get-access-ip-from-japan/
cover: /img/cover/2016-05-26-ruby-30-sec-cooking-get-access-ip-from-japan.svg
tags:
- Ruby
---


## First, the Script

{% gist kenzo0107/714ece62cf6450386ff0fb16fd5b777a %}

```sh
$ git clone https://gist.github.com/kenzo0107/714ece62cf6450386ff0fb16fd5b777a
$ cd 714ece62cf6450386ff0fb16fd5b777a
$ ruby getJapanIP.rb

1.0.16.0
1.0.64.0
1.1.64.0
1.5.0.0
...
(omitted)
...
223.223.164.0
223.223.208.0
223.223.224.0
```

## Overview

I created this because of a request:
there were separate Japanese and overseas versions of a URL,
and when someone accessed the overseas version from within Japan,
they wanted to redirect them to the Japanese version of the site.

Using this script, I set up the redirect in the .htaccess and so on for the overseas site.

That's all.
