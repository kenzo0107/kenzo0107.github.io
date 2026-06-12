---
layout: post
title: Installing Go on macOS X
date: 2015-04-12
lang: en
translation_id: install-go-on-macosx
permalink: en/2015/04/12/install-go-on-macosx/
cover: /img/cover/2015-04-12-install-go-on-macosx.svg
---

## Overview

A quick introduction to golang:
- A language developed by Google
- Dynamically typed (like Python)
- Strong at distributed processing

and so on.

See Wikipedia:

http://ja.wikipedia.org/wiki/Go_%28%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0%E8%A8%80%E8%AA%9E%29



## Steps
If you haven't installed brew yet, please refer to the following.

{% linkPreview https://kenzo0107.github.io/2015/02/27/2015-02-28-install-homebrew-on-macosx/ %}

### Install via brew

{% gist kenzo0107/a283dac2ac3fee108fa0 %}


* hello.go

{% gist kenzo0107/e4350b16fc0648e1303b %}


### Build

```
go build hello.go
```

### Run

```
./hello
```

You're all set if it displays:
Hello, World
