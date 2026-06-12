---
layout: post
title: Checking Docker Container Status with Mackerel
date: 2017-07-14
lang: en
translation_id: monitor-state-of-docker-by-mackerel
permalink: en/2017/07/14/monitor-state-of-docker-by-mackerel/
tags:
  - Docker
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170714/20170714223239.png
---

## Overview

"My Docker container had silently Exited before I knew it!"
This is a Mackerel Agent configuration to prevent exactly that kind of situation.

## Installing mackerel-plugin-docker-state

```sh
$ sudo mkdir -p /etc/mackerel-agent/conf.d
$ sudo curl https://raw.githubusercontent.com/ABCanG/mackerel-plugin-docker-state/master/mackerel-plugin-docker-state -o /etc/mackerel-agent/conf.d/mackerel-plugin-docker-state
$ sudo chmod +x /etc/mackerel-agent/conf.d/mackerel-plugin-docker-state
$ sudo cat <<'EOF'>/etc/mackerel-agent/conf.d/docker-state.conf
[plugin.metrics.docker-state]
command = "/etc/mackerel-agent/conf.d/mackerel-plugin-docker-state"
EOF
```

## Adding the include setting to mackerel-agent.conf

- /etc/mackerel-agent/mackerel-agent.conf

```sh
pidfile = "/var/run/mackerel-agent.pid"
root = "/var/lib/mackerel-agent"
verbose = false
apikey = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
diagnostic = true

roles = ["xxxxxxxx:xxx"]

# include conf.d/*.conf
include = "/etc/mackerel-agent/conf.d/*.conf"

...
...
```

## Restarting the Mackerel Agent

```sh
$ sudo service mackerel-agent restart
```

## Checking the graph

After a little while, the graph will appear.
Note: Since this is a graph with only 0 or 1 values, a stacked graph was easier to read.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170714/20170714222015.png" width="100%">
</div>

Note: In the graph above, two containers are running.

## Creating a new monitoring rule

Searching for "running" brings it up.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170714/20170714223652.png" width="100%">
</div>

I set it up so that when the 3-minute average drops below 1,
the container is considered stopped (Exited) and a notification is sent.

## Wrap-up

This time I happened to have the chance to work on a service that had Mackerel installed.

I was reminded once again that the benefit of using a managed service like Mackerel
is the reduced operational cost: you don't have to monitor your monitoring server.
