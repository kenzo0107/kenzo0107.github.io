---
layout: post
title: Standard Way to Install Golang
date: 2017-02-03
lang: en
translation_id: standard-instalation-golang
permalink: en/2017/02/03/standard-instalation-golang/
category: Go
tags:
  - Go
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170203/20170203124749.png
---

## Overview

This is exactly what is described on the official Golang site.

{% linkPreview https://golang.org/doc/install#install _blank %}

I'm writing this both as a reference for explanations in other Golang-related articles and as a memo for myself.

## Environment

- CentOS Linux release 7.3.1611 (Core)

## Steps

I recommend installing the latest version that matches your environment from [Golang Official - Downloads](https://golang.org/dl/).

- Build from source

```
$ cd /usr/local/src
$ sudo wget https://storage.googleapis.com/golang/go1.7.5.linux-amd64.tar.gz
$ sudo tar -C /usr/local -xzf go1.7.5.linux-amd64.tar.gz
```

- Configure PATH

```
$ sudo cat << 'EOF' | sudo tee /etc/profile.d/golang.sh
export GOPATH=$HOME/go
export PATH=$PATH:/usr/local/go/bin
EOF

$ sudo cp /etc/profile.d/golang.sh /etc/profile.d/golang.csh

$ source /etc/profile
```

- Verify

```
$ go version

go version go1.7.5 linux/amd64
```

That completes the Golang installation.
