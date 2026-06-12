---
layout: post
title: Nginx ssl.conf Settings - Redirecting Only Specific Pages to HTTPS
date: 2015-09-14
category: Infrastructure
lang: en
translation_id: nginx-redirect-https
permalink: en/2015/09/14/nginx-redirect-https/
cover: /img/cover/2015-09-14-nginx-redirect-https.svg
tags:
- Nginx
---

## Overview
I'm running the Go Revel framework on top of Nginx.

In doing so, I needed to configure SSL settings as well as
set up a way to redirect only specific pages to HTTPS,
so I've summarized it below.

{% gist kenzo0107/bab265d0e8c761576e24 %}


### The pages I want served over HTTPS are as follows:

   - /register
   - /mypage
   - /login
   - /logout

For the pages I want served over HTTPS, I match the prefix using a regular expression (~) in the location block,
and when the request comes over HTTP, I issue a 301 redirect to HTTPS.

That's all.
