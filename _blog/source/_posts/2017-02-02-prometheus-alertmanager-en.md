---
layout: post
title: Setting Up Alertmanager
date: 2017-02-02
category: Monitoring
lang: en
translation_id: prometheus-alertmanager
permalink: en/2017/02/02/prometheus-alertmanager/
tags:
  - Monitoring
  - Prometheus
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170202/20170202095647.png
---

## Overview

Last time we [set up Node Exporter](http://kenzo0107.hatenablog.com/entry/2017/01/25/154144).

{% linkPreview https://kenzo0107.hatenablog.com/entry/2017/01/25/154144 _blank %}

This time, we will set up Alertmanager on the monitoring server.

## What We'll Do (3-Line Summary)

- Install Alertmanager & create a startup script
- Configure notification conditions in Prometheus
- Send Slack notifications via Alertmanager

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170202/20170202095647.png" width="100%">
</div>

## The Role of Alertmanager

It manages which destinations alerts are sent to and how frequently, depending on the alert level.
In short, it manages the notification destinations.

The actual alert conditions are configured on the Prometheus Server.

## Environment

- CentOS Linux release 7.3.1611 (Core)

## Installing Alertmanager

- Install the package

```
$ cd /usr/local/src
$ sudo wget https://github.com/prometheus/alertmanager/releases/download/v0.5.1/alertmanager-0.5.1.linux-amd64.tar.gz
$ sudo tar -C /usr/local -xvf alertmanager-0.5.1.linux-amd64.tar.gz
$ cd /usr/local
$ sudo mv alertmanager-0.5.1.linux-amd64 alertmanager
```

- Create a symbolic link

```
$ sudo ln -s /usr/local/alertmanager/alertmanager /bin/alertmanager

$ alertmanager --version

alertmanager, version 0.5.1 (branch: master, revision: 0ea1cac51e6a620ec09d053f0484b97932b5c902)
  build user:       root@fb407787b8bf
  build date:       20161125-08:14:40
  go version:       go1.7.3
```

## Configuring the Alert Notification Destination

Below is the configuration for sending notifications to Slack.

```
$ cd /usr/local/alertmanager
$ git clone https://gist.github.com/kenzo0107/71574c2d4d70ba7a9efaa88b4ff1be1b
$ mv 71574c2d4d70ba7a9efaa88b4ff1be1b/alertmanager.yml .
```

- alertmanager.yml

Adjust the Slack notification section as needed.

{% gist kenzo0107/71574c2d4d70ba7a9efaa88b4ff1be1b %}

## Starting Alertmanager

If you just want to start it, this is all you need.

```
$ sudo alertmanager -config.file alertmanager.yml
```

When you access `http://alertmanager_server:9093/#/alerts`, a screen like the following is displayed.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170126/20170126194507.png" width="100%">
</div>

Just like Prometheus, we will create a startup script for Alertmanager and manage its startup there.

## Creating the Startup Script

- Create the options file

```
$ cat << 'EOF' > /usr/local/alertmanager/option
OPTIONS="-config.file /usr/local/alertmanager/alertmanager.yml"
EOF
```

- Alertmanager startup script

```
$ sudo cat << 'EOF' | sudo tee /usr/lib/systemd/system/alertmanager.service
[Unit]
Description=Prometheus alertmanager Service
After=syslog.target prometheus.alertmanager.service

[Service]
Type=simple
EnvironmentFile=-/usr/local/alertmanager/option
ExecStart=/bin/alertmanager $OPTIONS
PrivateTmp=false

[Install]
WantedBy=multi-user.target
EOF
```

- Startup configuration

```
$ sudo systemctl daemon-reload
$ sudo systemctl enable alertmanager.service
$ sudo systemctl start alertmanager.service
$ sudo systemctl status alertmanager.service -l
```

## Configuring Alert Notification Conditions

Alert notification conditions are configured on the Prometheus Server side.

[Prometheus Official - ALERTING RULES](https://prometheus.io/docs/alerting/rules/)

As a sample, we configure the following.

```
$ cd /usr/local/prometheus-server
$ cat << 'EOF' > alerts.rules

# If an instance is unreachable for more than 5 minutes (FOR) (IF up == 0),
# label it with severity = "critical" and send a notification
ALERT InstanceDown
  IF up == 0
  FOR 5m
  LABELS { severity = "critical" }
  ANNOTATIONS {
    summary = "Instance {{ $labels.instance }} down",
    description = "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 5 minutes.",
  }

// Check the Prometheus configuration file
$ promtool check-config prometheus.yml

Checking prometheus.yml
  SUCCESS: 1 rule files found

Checking alerts.rules
  SUCCESS: 1 rules found
```

## Setting the Alertmanager URL on the Prometheus Server

Set the Alertmanager URL via the Prometheus startup options.

```
-alertmanager.url=http://localhost:9093
```

```
$ cd /usr/local/prometheus-server
$ cat << 'EOF' > option
OPTIONS="-config.file=/usr/local/prometheus-server/prometheus.yml -web.console.libraries=/usr/local/prometheus-server/console_libraries -web.console.templates=/usr/local/prometheus-server/consoles -alertmanager.url=http://localhost:9093"
EOF

// Restart Prometheus
$ sudo systemctl restart prometheus.service
```

#### Note

In this case, Alertmanager is configured on the same server as the Prometheus Server, so it is

```
http://localhost:9093
```

but if the domain differs, configure it accordingly.

## Accessing the Prometheus Alerts Page

The notification conditions you configured are displayed.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170126/20170126195628.png" width="100%">
</div>

## Notification Test

Let's try stopping node_exporter on the monitored server.

```
$ sudo systemctl stop node_exporter
```

Then...

A notification arrived in Slack!

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170126/20170126200326.png" width="100%">
</div>

When you access `http://alertmanager_server:9093/#/alerts`, a list of notification details is displayed.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170126/20170126200742.png" width="100%">
</div>

That wraps up, briefly,
everything from monitoring remote servers with Prometheus
to sending alert notifications.

1. [Monitoring Servers with Prometheus](http://kenzo0107.hatenablog.com/entry/2017/01/20/233312)
2. [Node Exporter Setup + Monitoring AWS Auto Scaling from Prometheus](http://kenzo0107.hatenablog.com/entry/2017/01/25/154144)
3. [Setting Up Alertmanager](http://kenzo0107.hatenablog.com/entry/2017/02/02/101011)

## Supplementary Notes

### Frontend

Grafana 3.x and later supports Prometheus with a default plugin, and so on,
so Grafana is easy to introduce as a Prometheus frontend and works well together.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170202/20170202100116.png" width="100%">
</div>

By creating your own metrics or making full use of Prometheus's unique queries,
you can achieve a wide variety of metric monitoring.

### My alerts.rules

{% gist kenzo0107/6bca3225abd763ed4ec614dbaaec2c00 %}

### Learning

Having built this myself again,
I think reviewing Line Casual Talks #1 and #2 will deepen your understanding considerably.

- [We Held Prometheus Casual Talks #1](http://d.hatena.ne.jp/wyukawa/20160615/1465962814)

I hope it helps.

That's all.
Thank you for your attention.
