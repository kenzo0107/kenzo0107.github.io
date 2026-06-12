---
layout: post
title: Building Prometheus + Node Exporter + Grafana + cAdvisor on a Raspberry Pi 3 Model B with docker-compose, secured by Nginx authentication
date: 2017-05-01
category: RaspberryPI
lang: en
translation_id: nginx-prometheus-nodeexporter-grafana-cadvisor-on-raspi3
permalink: en/2017/05/01/nginx-prometheus-nodeexporter-grafana-cadvisor-on-raspi3/
tags:
  - RaspberryPI
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170430/20170430235153.png
---

## Overview

I built a Prometheus-based monitoring setup on a Raspberry Pi 3 using docker-compose.

{% linkPreview https://github.com/kenzo0107/vagrant-docker/tree/master/docker/prometheus-grafana-on-raspi3 _blank %}

## Environment

- Raspberry Pi 3 Model B (Raspbian GNU/Linux 8) arm7l
- Docker version 17.04.0-ce, build 4845c56
- docker-compose version 1.9.0, build 2585387

## Installing docker on the Raspberry Pi

```
raspi%$ wget -qO- https://get.docker.com/ | sh
raspi%$ sudo usermod -aG docker pi
raspi%$ sudo gpasswd -a $USER docker
```

## Installing docker-compose on the Raspberry Pi

```
raspi%$ sudo apt-get update
raspi%$ sudo apt-get install -y apt-transport-https
raspi%$ echo "deb https://packagecloud.io/Hypriot/Schatzkiste/debian/ jessie main" | raspi%sudo tee /etc/apt/sources.list.d/hypriot.list
raspi%$ sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 37BBEE3F7AD95B3F
raspi%$ sudo apt-get update
raspi%$ sudo apt-get install docker-compose
```

- Check the version

```
raspi%$ docker-compose --version
docker-compose version 1.9.0, build 2585387
```

## Setting up the docker-compose project

```
raspi%$ cd ~
raspi%$ git clone https://github.com/kenzo0107/vagrant-docker
raspi%$ cd vagrant-docker/docker/prometheus-grafana-on-raspi3
```

## Configuring Nginx Basic authentication

```
The user/password used when creating .htpasswd == GF_SECURITY_ADMIN_USER/GF_SECURITY_ADMIN_PASSWORD
```

These must match.

Grafana has a mechanism that lets you log in using the Basic authentication you configured, and if they don't match, you won't be able to log in and the login will fail.

- grafana/env

```
GF_SECURITY_ADMIN_USER=admin-user
GF_SECURITY_ADMIN_PASSWORD=admin-pass
```

- .htpasswd

```
raspi%$ htpasswd -c nginx/conf/conf.d/.htpasswd admin-user
New password: (type "admin-pass" and press Enter)
Re-type new password: (type "admin-pass" and press Enter)
Adding password for user admin-user

raspi%$ cat nginx/conf/conf.d/.htpasswd
admin-user:$apr1$JLxC83lt$uO7aEn9Z59fZtba4EA7C6/
```

## Cron configuration

This creates files (\*.prom) that periodically capture the Raspberry Pi's temperature and voltage and feed them to Prometheus.

```
*/5 * * * * <home/to/path>/vagrant-docker/docker/prometheus-grafana-on-raspi3/node-exporter/collector/raspi.sh
```

## Starting Docker with docker-compose

```
raspi%$ docker-compose up -d
```

## Accessing Grafana

When you access `http://<your_server_ip>:13000`, you'll be prompted for the user/password you specified in .htpasswd, so enter them.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170430/20170430235949.png" width="100%">
</div>

If the Grafana page is displayed afterward, you've succeeded.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170501/20170501002430.png" width="100%">
</div>

Click "Add data Source".

## Data Source configuration

Configure it as shown below, click "Save & Test", and confirm that it succeeds.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170501/20170501002606.png" width="100%">
</div>

## Importing Dashboard.json

From the icon in the top left, select Dashboards > Import and import DockerDashboard.json.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170501/20170501003915.png" width="100%">
</div>

## Displaying the Dashboard

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170501/20170501003051.png" width="100%">
</div>

## Key points!

### For security reasons, I made sure Grafana cannot be accessed directly from the outside.

nginx/conf/conf.d/default.conf

```
server {
    listen       80;

    location / {
        auth_basic "Restricted";
        auth_basic_user_file /etc/nginx/conf.d/.htpasswd;

        proxy_pass                          http://grafana:3000/;
    }
}
```

### Choose your image carefully.

I got seriously stuck on the following points.

1. Whether it runs on a Raspberry Pi 3 Model B (arm7l in this case)
2. Whether Nginx's proxy feature works correctly

I kept running into cases where, even when connecting to Grafana through Nginx's proxy feature, it would display the following instead.

```
{{alert.title}}
```

## Wrap-up

I ended up spending quite a bit of time hunting for an image, and in hindsight it might have been faster to build my own.

This time I set it up to monitor itself, but I really need a setup that monitors from the outside and where machines monitor each other. If I can get household approval, I'll grab another unit!

And then, let's build something that benefits the household!
