---
layout: post
title: Building a Simple Prometheus Monitoring Environment with Ansible + Vagrant
date: 2016-06-21
categories:
  - [Monitoring]
  - [Infrastructure]
lang: en
translation_id: ansible-vagrant-prometheus
permalink: en/2016/06/21/ansible-vagrant-prometheus/
tags:
  - Monitoring
  - Prometheus
  - Ansible
  - Vagrant
cover: http://i.imgur.com/pfazhaR.png
---

## Overview

This takes the tutorial from [Getting Started with Prometheus](https://prometheus.io/docs/introduction/getting_started/)
and makes it easy to set up with Ansible.

The other day, on June 14, 2016,
I attended [Prometheus Casual Talks #1](http://connpass.com/event/32859/) at LINE Corporation,
and since I wanted to review what I'd learned,
I put together this setup guide.

## What is Prometheus

It's a recently popular pull-based monitoring/alerting tool that supports query filtering and integrates with the likes of Grafana.

## Architecture

![Imgur](http://i.imgur.com/pfazhaR.png)

- Prometheus Server × 1
- Prometheus Client × 2

## Environment

- CentOS 6.5
- Prometheus Server 0.20.0
- Supervisor 3.3.0
- Go 1.6.2
- Ansibl 2.1.0.0
- Vagrant 1.8.1
- MacOSX 10.11.5

## Prerequisites

Please install the following tools beforehand.

- VirtualBox
- Vagrant
- Ansible

## Usage

### 1. Clone the git repository

[https://github.com/kenzo0107/Vagrant-Prometheus]

```
$ git clone https://github.com/kenzo0107/Vagrant-Prometheus
```

## 2. Start the Vagrant VMs

```
$ cd Vagrant-Prometheus
$ vagrant up
```

3 nodes running!

- 1 node: Prometheus Server
- - 192.168.11.30
- other 2 nodes: Prometheus Client Server
- - 192.168.33.31
- - 192.168.33.32

## 3. Add ssh.config

```
$ vagrant ssh-config > ssh.config
```

## 4. ping connectivity test

```
$ ansible default -m ping

server | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
client1 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
client2 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

ok, success.

## 5. Configure PrometheusClient on the 2 nodes

```
$ ansible-playbook set_clients_prometheus.yml
```

## 6. Verify PrometheusClient is running

Access the servers running PrometheusClient below
and confirm that they are up.

- <http://192.168.11.31:8080/metrics>
- <http://192.168.11.32:8080/metrics>

If you see something like the following, it succeeded.

<img src="http://i.imgur.com/igPci2Z.png" width="400px" />

## 7. Configure PrometheusServer

```
$ ansible-playbook set_server_prometheus.yml
```

## 8. Verify PrometheusServer

Access <http://192.168.33.30:9090>

If you see something like the following, it succeeded.

<img src="http://i.imgur.com/XDTarz3.png" width="400px" />

I hope this is at least a little bit of help!
Go ahead and tinker with it to your heart's content!

That's all.
