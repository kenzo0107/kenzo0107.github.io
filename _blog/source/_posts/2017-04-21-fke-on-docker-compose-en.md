---
layout: post
title: Building a Development Environment with docker-compose — Visualizing Nginx Access Logs (LTSV) with Fluentd + Elasticsearch + Kibana
date: 2017-04-21
lang: en
translation_id: fke-on-docker-compose
permalink: en/2017/04/21/fke-on-docker-compose/
tags:
  - Docker
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170421/20170421221055.png
---

## Overview

We'll build a development environment with docker-compose on top of the Vagrant environment we set up previously.

{% linkPreview http://kenzo0107.hatenablog.com/entry/2017/04/13/225610 _blank %}

Continuing from last time, we'll visualize Nginx access logs with Elasticsearch + Fluentd + Kibana.
App

## Quick Setup Steps

```
macOS% $ git clone https://github.com/kenzo0107/vagrant-docker
macOS% $ cd vagrant-docker
macOS% $ vagrant up
macOS% $ vagrant ssh
vagrant% $ cd /vagrant/nginx-efk

// We don't use -d (detached mode) so that the startup status of each container is visible in the logs.
vagrant% $ docker-compose up
...
...
```

## docker-compose Configuration

Everything is collected on Git.

{% linkPreview https://github.com/kenzo0107/vagrant-docker/tree/master/docker/nginx-efk _blank %}

```
├── docker-compose.yml
├── fluentd
│   ├── conf
│   │   ├── conf.d
│   │   │   └── nginx.log.conf
│   │   └── fluent.conf
│   └── Dockerfile
└── nginx
    └── conf
        └── nginx.conf
```

### Key Points

- The Nginx log directory is set as a `volume` and synced with the host side. On the fluentd side it's also set as a `volume` and tailed.

Here's the overall picture.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170421/20170421221055.png" width="100%">
</div>

## Verifying Nginx Startup from the Browser

When you access `http://192.168.35.101/` from your browser,
you'll see the Nginx Welcome page.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170421/20170421222343.png" width="100%">
</div>

After the earlier `docker-compose up`, you'll see logs like the following,
which show that fluentd is capturing the Nginx access logs.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170421/20170421222937.png" width="100%">
</div>

## Accessing Kibana

When you access `http://192.168.35.101:5601` from your browser,
the Kibana page is displayed.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170421/20170421223008.png" width="100%">
</div>

1.  Index name or pattern

    - Specify fluentd-\*

2.  Time-field name

    - Specify @timestamp

3.  Click the Create button

4.  Click `Discover` from the left menu

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170421/20170421223626.png" width="100%">
</div>

## Checking Logs from macOS

Naturally, since macOS and vagrant are synced,
you can tail the logs from macOS as well.

```
macOS%$ tail -f <path/to/vagrant-docker>/docker/nginx-efk/_log/nginx/access.log
```

That's all.
I hope you find it helpful.
