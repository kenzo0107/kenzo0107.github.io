---
layout: post
title: Server Monitoring with Prometheus
date: 2017-01-20
lang: en
translation_id: prometheus-monitoring
permalink: en/2017/01/20/prometheus-monitoring/
tags:
  - Monitoring
  - Prometheus
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125140715.png
---

## Overview

Previously, I wrote about building a Prometheus monitoring environment with Ansible + Vagrant.

{% linkPreview http://kenzo0107.hatenablog.com/entry/2016/06/21/003544 _blank %}

This time, I'll walk through some common configuration use cases step by step.

1. [Building the Prometheus Server](http://kenzo0107.github.io/2017/01/20/2017-01-20-prometheus-monitoring)
2. [Setting up Node Exporter on the monitoring targets](http://kenzo0107.github.io/2017/01/25/2017-01-25-prometheus-aws-autoscaling)
3. [Building Alertmanager](http://kenzo0107.github.io/2017/02/02/2017-02-02-prometheus-alertmanager)

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125134654.png" width="100%">
</div>

## What We'll Do This Time (3-Line Summary)

- Install the Prometheus Server module
- Create a startup script for the Prometheus Server
- Start the Prometheus Server and monitor its own host

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125140715.png" width="100%">
</div>

As for the Prometheus configuration file, I think it's better to cover it after you understand the overall picture, so I'll do that after setting up Node Exporter.

## Environment

- CentOS Linux release 7.3.1611 (Core)

## Installing Prometheus

- Install the package
  Check for the [latest version](https://github.com/prometheus/prometheus/releases) and download it.

```
$ cd /usr/local/src
$ sudo wget https://github.com/prometheus/prometheus/releases/download/v1.4.1/prometheus-1.4.1.linux-amd64.tar.gz
$ sudo tar -C /usr/local -xvf prometheus-1.4.1.linux-amd64.tar.gz
$ cd /usr/local
$ sudo mv prometheus-1.4.1.linux-amd64 prometheus-server
```

- Create symbolic links

```
$ sudo ln -s /usr/local/prometheus-server/prometheus /bin/prometheus
$ sudo ln -s /usr/local/prometheus-server/promtool /bin/promtool

$ prometheus --version
prometheus, version 1.4.1 (branch: master, revision: 2a89e8733f240d3cd57a6520b52c36ac4744ce12)
  build user:       root@e685d23d8809
  build date:       20161128-09:59:22
  go version:       go1.7.3

$ promtool version
promtool, version 1.4.1 (branch: master, revision: 2a89e8733f240d3cd57a6520b52c36ac4744ce12)
  build user:       root@e685d23d8809
  build date:       20161128-09:59:22
  go version:       go1.7.3
```

## Starting Prometheus

If you just want to start it for now, this is all you need:

```
$ sudo prometheus -config.file=/usr/local/prometheus-server/prometheus.yml
```

However, running ↑ this every time is painful, so I want to create a startup script so it auto-starts when the server reboots and can be launched with `systemctl start ...`.

## Creating the Startup Script

- Create the Prometheus options file

```
$ cat << 'EOF' > /usr/local/prometheus-server/option
OPTIONS="-config.file=/usr/local/prometheus-server/prometheus.yml -web.console.libraries=/usr/local/prometheus-server/console_libraries -web.console.templates=/usr/local/prometheus-server/consoles"
EOF
```

- Prometheus startup script

```
$ sudo cat << 'EOF' | sudo tee /usr/lib/systemd/system/prometheus.service
[Unit]
Description=Prometheus Service
After=syslog.target prometheus.service

[Service]
Type=simple
EnvironmentFile=-/usr/local/prometheus-server/option
ExecStart=/bin/prometheus $OPTIONS
PrivateTmp=false

[Install]
WantedBy=multi-user.target
EOF
```

- Configure startup

```
$ sudo systemctl daemon-reload
$ sudo systemctl enable prometheus.service
$ sudo systemctl start prometheus.service
$ sudo systemctl status prometheus.service -l
```

## Let's Access It

Access `<IP Address>:9090`.
If you see the following, Prometheus has started successfully.

![Imgur](http://i.imgur.com/1gchGrW.png)

Also try accessing each of the HTML files under `/usr/local/prometheus-server/consoles`, which we set in the options configuration.

`<IP Address>:9090/consoles/prometheus-overview.html?instance=localhost%3a9090`

<div style="text-align:center;">
<img src="http://i.imgur.com/1gchGrW.png" width="100%">
</div>

Next time, I'll [set up Node Exporter on the monitoring targets](http://kenzo0107.github.io/2017/01/25/2017-01-25-prometheus-aws-autoscaling).
