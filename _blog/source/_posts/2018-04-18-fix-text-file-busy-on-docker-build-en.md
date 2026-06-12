---
layout: post
title: Working around "Text file busy" when a shell script fails to run during docker build
date: 2018-04-18
category: Infrastructure
lang: en
translation_id: fix-text-file-busy-on-docker-build
permalink: en/2018/04/18/fix-text-file-busy-on-docker-build/
tags:
  - Docker
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180418/20180418215217.jpg
---

## Overview

I had written a shell execution inside a Dockerfile like the following.

```
RUN chmod +x hoge.sh \
  && hoge.sh
```

When I ran `docker build` with the above in place, I hit an error like this.

```
/bin/sh: hoge.sh: Text file busy
```

## What is Text file busy ?

It occurs when you try to execute a file (a shared-text file) that is currently open only for writing, or when you try to open for writing or delete a file that is a running procedure.

Given the above, my guess was:
maybe it happens because `hoge.sh` is being executed while `chmod +x hoge.sh` is still running??

## Environment

- Ubuntu 14.04.5 LTS \n \l
- Docker version 17.05.0-ce, build 89658be
- Base Image: ruby:2.5-alpine

## Solution

Adding the `sync` step below resolved the problem cleanly.

```
RUN chmod +x hoge.sh \
  && sync \
  && hoge.sh
```

## What is sync command ?

{% linkPreview http://kazmax.zpp.jp/cmd/s/sync.8.html _blank %}

## References

{% linkPreview https://github.com/moby/moby/issues/9547#issuecomment-77547893 _blank %}

{% linkPreview https://qiita.com/todanano/items/05570fac310d56758888 _blank %}
