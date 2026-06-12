---
layout: post
title: Trying Out Prometheus 2.0 Remote Storage
date: 2017-11-13
category: Monitoring
lang: en
translation_id: prometheus-remote-storage
permalink: en/2017/11/13/prometheus-remote-storage/
tags:
  - Prometheus
cover: https://i.imgur.com/zFciewX.png
---

Prometheus 2.0 is finally here!

[Announcing Prometheus 2.0 | Prometheus](https://prometheus.io/blog/2017/11/08/announcing-prometheus-2-0/)

The other day at a [monitoring study session](https://mackerel-ug.connpass.com/event/68478/) I had the chance to listen to Paul Taylor's lightning talk, which covered a lot of great topics such as performance improvements and the new storage format that makes compression and backups easier.

[Operating Prometheus](https://www.slideshare.net/PaulTraylor/20171027-81281205)

The feature I was looking forward to the most was Remote Long-Term Storage. I was thrilled about the long-term retention capability!

With the 1.x line, you had to take measures such as preparing separate Prometheus instances for short-term and long-term storage, which forced you into a somewhat redundant setup. With the 2.0 release, that's finally solved!

I wanted to try it out right away, so here's a summary of my experience.

## Summary of What I Wanted to Do This Time

- Immediately try out the long-term retention feature (Remote long-term storage) that I'd been anticipating with the Prometheus 2.0 release!
- Actually build it in a local environment and check what changed from the 1.x line
- Check what kind of data ends up on the DB side

## System Overview

Since I just wanted to verify the feel of using it, I went with an environment that's easy to spin up with docker-compose.

<div style="text-align:center;">
<img src="https://i.imgur.com/zFciewX.png" width="100%">
</div>

## Prerequisites

Install the following on Vagrant:

- Ubuntu 16.04.3 LTS \n \l
- Docker version 17.09.0-ce, build afdb6d4
- docker-compose version 1.12.0, build b31ff33

## Docker Containers to Launch

- Prometheus 2.0.0
- Node Exporter 0.15.1
- AlertManager 0.9.1
- cAdvisor 0.28.0
- Prometheu Adapter
- PostgreSQL 9.6.3
- Grafana 4.6.1
- Nginx 1.13.6
- Adminer

## How to Use

Follow the steps below.

[kenzo0107/vagrant-docker/tree/vagrant-docker-ubuntu16.04/docker/prometheus-grafana-on-ubuntu](https://github.com/kenzo0107/vagrant-docker/tree/vagrant-docker-ubuntu16.04/docker/prometheus-grafana-on-ubuntu)

```sh
macOS%$ git clone https://github.com/kenzo0107/vagrant-docker
macOS%$ cd vagrant-docker
macOS%$ vagrant up

// Install docker, docker-compose
macOS%$ vagrant provision
macOS%$ vagrant ssh
vagrant%$ cd /vagrant/prometheus-grafana-on-ubuntu
vagrant%$ sudo docker-compose up -d

Name                             Command                            State                             Ports
-------------------------------------------------------------------------------------------------------------------------------------
adapter                           /prometheus-postgresql-ada ...    Up
adminer                           entrypoint.sh docker-php-e ...    Up                                8080/tcp
alertmanager                      /bin/alertmanager -config. ...    Up                                9093/tcp
cadvisor                          /usr/bin/cadvisor -logtost ...    Up                                8080/tcp
grafana                           /run.sh                           Up                                3000/tcp
nginx                             nginx -g daemon off;              Up                                0.0.0.0:18080->18080/tcp,
                                                                                         0.0.0.0:3000->3000/tcp, 80/tcp,
                                                                                         0.0.0.0:8080->8080/tcp,
                                                                                         0.0.0.0:9090->9090/tcp
node-exporter                     /bin/node_exporter                Up                                9100/tcp
pgsql                             docker-entrypoint.sh -csyn ...    Up                                5432/tcp
prometheus                        /bin/prometheus --config.f ...    Up                                9090/tcp
```

## Let's Access It

### Prometheus

- [http://192.168.35.101:9090](http://192.168.35.101:9090).

<div style="text-align:center;">
<img src="https://i.imgur.com/rg53Xa1.png" width="100%">
</div>

### Grafana

- [http://192.168.35.101:13000](http://192.168.35.101:13000).
- The user account is in `./grafana/env`.

```sh
GF_SECURITY_ADMIN_USER=admin-user
GF_SECURITY_ADMIN_PASSWORD=admin-pass
```

<div style="text-align:center;">
<img src="https://i.imgur.com/fDXVySw.png" width="100%">
</div>

- Datasource configuration

<div style="text-align:center;">
<img src="https://i.imgur.com/8SKvdxJ.png" width="100%">
</div>

Enter the following information in the Datasource configuration form and click the `Add` button.

| _Item_ | _Value_                |
| ------ | ---------------------- |
| Name   | Prometheus             |
| Type   | Prometheus             |
| URL    | http://prometheus:9090 |
| Access | proxy                  |

<div style="text-align:center;">
<img src="https://i.imgur.com/6Cr4WTn.png" width="100%">
</div>

- Import Dashboard.json

<div style="text-align:center;">
<img src="https://i.imgur.com/cew58vF.png" width="100%">
</div>

The graphs are displayed.

<div style="text-align:center;">
<img src="https://i.imgur.com/IicXL5e.png" width="100%">
</div>

### cAdvisor

- [http://192.168.35.101:8080](http://192.168.35.101:8080).

<div style="text-align:center;">
<img src="https://i.imgur.com/ZDH3zmI.png" width="100%">
</div>

## Adminer

<div style="text-align:center;">
<img src="https://i.imgur.com/uWT7sDC.png" width="100%">
</div>

Enter the following information in the login form.

| _Item_   | _Value_    |
| -------- | ---------- |
| Server   | pgsql      |
| Username | prometheus |
| Password | password   |
| Database | postgres   |

- You can check the metrics data stored in PostgreSQL.

PostgreSQL >> pgsql >> postgres >> prometheus >> Select: metrics

<div style="text-align:center;">
<img src="https://i.imgur.com/cyPrvqC.png" width="100%">
</div>

## Trying Out Alert Notifications with AlertManager

As an example, stop node-exporter.

```
vagrant%$ sudo docker-compose stop node-exporter
```

A notification was properly delivered to the Slack channel configured in `./alertmanager/config.yml`.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171113/20171113021331.png" width="100%">
</div>

## Impressions

- The way things are configured has changed quite a bit in 2.0, so you need to carefully read the official site.

  - Just when I thought that, a great summary had already been published! Thank you!
    - [Prometheus 2.0 の変更点と移行](https://qiita.com/tkusumi/items/293174826a8a5d47d186)

- This time it's a single-node Prometheus setup, but I'd like to try a redundant configuration with two or more nodes.

## Aside

- Whether it's a bug or not, the metrics detected by google/cadvisor were displayed in duplicate, which made it hard to narrow them down in Grafana.
  - Is this the issue?
    - [Inconsistent container metrics in prometheus route #1704](https://github.com/google/cadvisor/issues/1704)

## Afterword

Beyond reducing operational costs with a managed monitoring service like Mackerel, I suspect that managing Prometheus yourself could keep total costs even lower.

That said, Datadog offers plans that include APM at a reasonable cost, so the appeal of managed services is still substantial.

Whether to separate out monitoring responsibilities, or to keep it as one option among many, I think Prometheus is well worth taking on.

I'm looking forward to Prometheus spreading even further from here on.

## References

- [Configuration | Prometheus](https://prometheus.io/docs/prometheus/2.0/configuration/configuration/)
- [prometheus/config/testdata/conf.good.yml](https://github.com/prometheus/prometheus/blob/release-2.0/config/testdata/conf.good.yml)
