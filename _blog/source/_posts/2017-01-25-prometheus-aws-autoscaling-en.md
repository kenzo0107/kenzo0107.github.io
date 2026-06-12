---
layout: post
title: Node Exporter Setup Guide + Monitoring AWS Auto Scaling from Prometheus
date: 2017-01-25
category: AWS
lang: en
translation_id: prometheus-aws-autoscaling
permalink: en/2017/01/25/prometheus-aws-autoscaling/
tags:
  - Monitoring
  - Prometheus
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125144719.png
---

## Overview

Last time, I [set up a Prometheus Server](https://kenzo0107.hatenablog.com/entry/2017/01/20/233312).

{% linkPreview https://kenzo0107.hatenablog.com/entry/2017/01/20/233312 _blank %}

This time, I'll set up Node Exporter on the servers to be monitored.

## What we'll do this time, in 3 lines

- Install Node Exporter
- Create a Node Exporter startup script
- Start Node Exporter and monitor it from the Prometheus Server

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125144719.png" width="100%">
</div>

## Environment

- CentOS Linux release 7.1.1503 (Core)

## Installing Node Exporter

- Install the package

```
$ cd /usr/local/src
$ sudo wget https://github.com/prometheus/node_exporter/releases/download/v0.14.0-rc.1/node_exporter-0.14.0-rc.1.linux-amd64.tar.gz
$ sudo tar -C /usr/local -xvf node_exporter-0.14.0-rc.1.linux-amd64.tar.gz
$ cd /usr/local
$ sudo mv node_exporter-0.14.0-rc.1.linux-amd64 node_exporter
```

- Create a symbolic link

```
$ sudo ln -s /usr/local/node_exporter/node_exporter /bin/node_exporter

$ node_exporter --version
node_exporter, version 0.14.0-rc.1 (branch: master, revision: 5a07f4173d97fa0dd307db5bd3c2e6da26a4b16e)
  build user:       root@ed143c8f2fcd
  build date:       20170116-16:00:03
  go version:       go1.7.4
```

## Starting Node Exporter

If you just want to start it up, this is all you need

```
$ sudo node_exporter
```

Access [http://node_exporter_server:9100/metrics](http://node_exporter_server:9100/metrics) and
you can check the server metrics that node_exporter collects.

Just like Prometheus, we'll create a startup script for Node Exporter and manage its startup there.

## Creating a startup script

- Node Exporter startup script

```
$ sudo cat << 'EOF' | sudo tee /usr/lib/systemd/system/node_exporter.service
[Unit]
Description=Node Exporter

[Service]
Type=simple
ExecStart=/bin/node_exporter
PrivateTmp=false

[Install]
WantedBy=multi-user.target
EOF
```

- Startup configuration

```
$ sudo systemctl daemon-reload
$ sudo systemctl enable node_exporter.service
$ sudo systemctl start node_exporter.service
$ sudo systemctl status node_exporter.service -l
```

## Let's access it

Access [http://node_exporter_server:9100/metrics](http://node_exporter_server:9100/metrics).

If it displays like the following, Node Exporter has started successfully.

<div style="text-align:center;">
<img src="http://i.imgur.com/Z4Juj0i.png" width="100%">
</div>

## Monitoring from Prometheus

This time, we'll configure metric collection from node_exporter running on AWS EC2 instances.

* The monitoring server needs a role configured with `AmazonEC2ReadOnlyAccess` attached.
<span style="color: #ff5252">* Configure the security group on the target servers so that the monitoring server can access the `9100 port`. </span>

- Edit /usr/local/prometheus-server/prometheus.yml

The configuration below specifies a region and collects metrics from instances you have access to.

```yml
# my global config
global:
  scrape_interval:     15s
  evaluation_interval: 15s

  external_labels:
      monitor: 'codelab-monitor'

rule_files:
  # - "first.rules"
  # - "second.rules"

scrape_configs:
  - job_name: 'prometheus'

    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    ec2_sd_configs:
      - region: ap-northeast-1
        access_key: ********************
        secret_key: ****************************************
        port: 9100
```

#### Narrowing down monitoring targets by tag

If you want to monitor all instances, the configuration above works fine.

However, there are cases where you want to narrow down the monitoring targets by certain conditions.
In such cases, Prometheus provides a way to filter by instance configuration tags using `relabel_configs`.

- Instance tag configuration

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125144948.png" width="100%">
</div>

- prometheus.yml configuration

```yml
# my global config
global:
  scrape_interval:     15s
  evaluation_interval: 15s

  external_labels:
      monitor: 'codelab-monitor'

rule_files:
  # - "first.rules"
  # - "second.rules"

scrape_configs:
  - job_name: 'prometheus'

    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    ec2_sd_configs:
      - region: ap-northeast-1
        access_key: ********************
        secret_key: ****************************************
        port: 9100
    relabel_configs:
      - source_labels: [__meta_ec2_tag_Stage]
        regex: production
        action: keep
      - source_labels: [__meta_ec2_tag_Role]
        regex: web
        action: keep
```

- After editing prometheus.yml, restart

```
$ sudo systemctl restart prometheus.service
```

## Checking that Prometheus can monitor the server running node_exporter

[http://prometheus_server:9090/consoles/node.html](http://prometheus_server:9090/consoles/node.html)

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125153144.png" width="100%">
</div>

Clicking the link of a Node marked `Up : Yes` lets you view its CPU and Disk graphs.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170125/20170125154033.png" width="100%">
</div>

Next time, I'll [set up Alertmanager](https://kenzo0107.github.io/2017/02/02/2017-02-02-prometheus-alertmanager) on the monitoring target.

## References

{% linkPreview https://www.robustperception.io/automatically-monitoring-ec2-instances/ _blank %}
