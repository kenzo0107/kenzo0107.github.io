---
layout: post
title: A JS Snippet That Automatically Shortens URLs as You Type Them into an Input Box
date: 2016-03-10
category: Infrastructure
lang: en
translation_id: auto-shorten-url-js
permalink: en/2016/03/10/auto-shorten-url-js/
tags:
  - JavaScript
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160310/20160310115924.png
---

[f:id:kenzo0107:20160310115924p:plain]

## Overview

Lately, more and more cases use Japanese characters in URLs.

Whether this is worthwhile from an SEO perspective is debatable, but for users who are less familiar with the internet, it might make for a more intuitive UI.

There was a blog post discussing this point.

{% linkPreview https://www.suzukikenichi.com/blog/should-urls-contain-japanese/ _blank %}

When developing social-integration tools that, for example, post URLs containing Japanese characters to Twitter, you have to pay strict attention to the character count. I automated the shortening process using the bitly API, so this is a write-up of that.

## Steps

- Sign up at [bitly.com](https://bitly.com)

- Obtain an `Access Token` at [https://bitly.com/a/oauth_apps]

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160310/20160310121138.png" width="100%">
</div>

- Load the following js in your HTML or wherever appropriate.

{% gist kenzo0107/88af2f3e961324fac815 %}

That's all.
