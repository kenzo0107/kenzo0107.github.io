---
layout: post
title: Writing Custom Queries for node_exporter with Shell Scripts
date: 2017-02-16
category: Monitoring
lang: en
translation_id: node_exporter
permalink: en/2017/02/16/node_exporter/
tags:
  - Monitoring
  - Prometheus
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170216/20170216225748.png
---

## Overview

By placing files with the `*.prom` extension in the directory specified by node_exporter's `--collector.textfile.directory` option,
the Prometheus server will read the metric information written in them.

The idea is that if you update these `*.prom` files at regular intervals, you can create your own custom metrics.

## Procedure

- For installing and setting up node_exporter itself, please refer to the following.

{% linkPreview http://kenzo0107.hatenablog.com/entry/2017/01/25/154144 _blank %}

In the procedure above, node_exporter is placed at the following location.
Adjust it as appropriate for your environment.

```
/usr/local/node_exporter/node_exporter
```

## Create the text_collector directory

```
$ cd /usr/local/node_exporter
$ mkdir text_collector
```

## Create the shell script

This time, we will add a metric for the httpd process count.

- Create /usr/local/node_exporter/text_collector/httpd.sh

{% gist kenzo0107/cf245d3ba1d2f0faea7f0134414a8c81 %}

## Configure cron

```
# Update node_exporter httpd every 5 minutes
*/5 * * * * /usr/local/node_exporter/text_collector/httpd.sh
```

## Verify httpd.prom is created

- /usr/local/node_exporter/text_collector/httpd.prom

```
node_httpd_count 24
```

The `node_httpd_count` above becomes the metric name.

## Restart node_exporter

Specify the directory as follows.

```
node_expoter --collector.textfile.directory /usr/local/node_exporter/text_collector
```

## Specify and verify the metric you created

It worked!

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170216/20170216225202.png" width="100%">
</div>

Using this, you can often get a lot done with shell one-liners ♪

I hope this helps.
