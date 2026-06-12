---
layout: post
title: "error RPC failed; curl 56 SSLRead() return on macOS Sierra"
date: 2016-09-28
category: Infrastructure
lang: en
translation_id: error-rpc-failed-curl-56-sslread-return-on-macos
permalink: en/2016/09/28/error-rpc-failed-curl-56-sslread-return-on-macos/
cover: /img/cover/2016-09-28-error-rpc-failed-curl-56-sslread-return-on-macos.svg
tags:
- SSL
---

## Overview

I picked up the book "Minna no Go Gengo" (Go for Everyone), and I'm sure many readers felt the urge to manage their Git repositories with ghq after reading it.

I had long been using peco for my Git repository navigation command, but managing repositories with ghq turned out to be really convenient.

Around that time, when I tried to clone a git repository with the ghq command, I hit the error in the title, so here's a memo for future reference.

```sh
$ ghq get <git repository>
...
error: RPC failed; curl 56 SSLRead() return
...
```

It seems the git I was using did not support SSL.


## Fix

- Reinstall git with openssl and curl

```sh
$ brew reinstall git --with-brewed-curl --with-brewed-openssl
```

## Run Again

```sh
$ ghq get <git repository>
remote: Total 74442 (delta 145), reused 0 (delta 0), pack-reused 74160
Receiving objects: 100% (74442/74442), 701.45 MiB | 1.42 MiB/s, done.
Resolving deltas: 100% (50571/50571), done.
Checking out files: 100% (11350/11350), done.
```

It worked without a hitch.


## References

[Curl: (56) SSLRead() return error -9806 - Need Help please slight_smile](https://forums.meteor.com/t/curl-56-sslread-return-error-9806-need-help-please/21913)
