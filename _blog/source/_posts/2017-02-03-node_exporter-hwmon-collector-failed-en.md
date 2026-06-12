---
layout: post
title: node_exporter error occurred! hwmon collector failed
date: 2017-02-03
category: Monitoring
lang: en
translation_id: node_exporter-hwmon-collector-failed
permalink: en/2017/02/03/node_exporter-hwmon-collector-failed/
tags:
  - Monitoring
  - Prometheus
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170203/20170203141542.png
---

## Overview

When I installed node_exporter on Amazon Linux and started it, the following error occurred and it failed to stay running.

```sh
ERRO[0007] ERROR: hwmon collector failed after 0.000011s: open /proc/class/hwmon: no such file or directory  source="node_exporter.go:92"
```

### What is hwmon?

> Hard Ware MONitoring. It can retrieve hardware temperature, fan rotation speed, and voltage from the sensor chips of the Linux kernel.

The environment details are as follows.

- Amazon Linux AMI release 2016.09
- node_exporter version 0.14.0-rc.1 (branch: master, revision:5a07f4173d97fa0dd307db5bd3c2e6da26a4b16e)

This error had already been raised as an issue.
And it had been resolved!

{% linkPreview https://github.com/prometheus/node_exporter/pull/427 _blank %}

It seems my timing was just unlucky—I had grabbed a release from before the fix was merged, which is why I ran into this error.

It looks like the best approach is to build from the master branch with the latest source.

Below I have summarized the installation steps I followed on Amazon Linux.

## Steps

### Installing Golang

The following is the standard installation method available on the official Golang site. Please use it as a reference.

{% linkPreview http://kenzo0107.hatenablog.com/entry/2017/02/03/124808 _blank %}

### Install and build node_exporter from source

```
$ mkdir -p $GOPATH/src/github.com/prometheus
$ cd $GOPATH/src/github.com/prometheus
$ git clone https://github.com/prometheus/node_exporter
$ cd node_exporter
$ make build

// Check version
$ ./node_exporter --version
node_exporter, version 0.14.0-rc.1 (branch: master, revision: 428bc92b1c9b38f6de96bceb67bc5d9b3bdcf6e7)
```

### And while we're at it, a startup script

- Preparation

```
// Create a directory for the pid file
$ sudo mkdir -p /var/run/prometheus

// Create a directory for the log files
$ sudo mkdir -p /var/log/prometheus

// Install daemonize
$ cd /usr/local/src
$ sudo git clone https://github.com/bmc/daemonize
$ cd daemonize
$ sudo ./configure
$ sudo make
$ sudo make install

// If PATH is not set, add it to PATH
$ sudo cp daemonize /bin/

$ which daemonize
/bin/daemonize
```

- Create the startup script

```
$ cd /etc/init.d
$ sudo git clone https://gist.github.com/kenzo0107/eebb6c1c06ba04b7073c171580cec445
$ sudo cp eebb6c1c06ba04b7073c171580cec445/node_exporter.init ./node_exporter
$ sudo chmod 0755 node_exporter
```

- Start

```
$ sudo /etc/init.d/node_exporter start
```

It now starts up without any errors ♪
