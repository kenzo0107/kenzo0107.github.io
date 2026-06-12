---
layout: post
title: "Go + Revel Framework: Asynchronously Resizing and Uploading Images to S3"
date: 2017-08-09
lang: en
translation_id: go-revel-upload-to-s3
permalink: en/2017/08/09/go-revel-upload-to-s3/
cover: /img/cover/2017-08-09-go-revel-upload-to-s3.svg
category: Go
tags:
  - Go
---

Just a memo for myself.

## Overview

There are so many Go libraries for AWS out there that it was hard to tell which one to use, so I decided to go with the canonical `launchpad.net/goamz/aws` for the implementation.

## Controller

- app/controllers/img.go

{% gist kenzo0107/e27a7efa27d11ceab8f6 %}

## Component

I turned the image upload part into a component.

- app/utility/aws.go

{% gist kenzo0107/a36c52f019ce75411a3f %}

## Views

- Views/Img/Index.html

{% gist kenzo0107/871a8dc41105209ee38c %}

- public/js/ajax.js

{% gist kenzo0107/260b7ff637fd58229824 %}

- public/js/jquery.uploadThumbs.js

{% gist kenzo0107/66609140fe7c144040fa %}
