---
layout: post
title: Writing a Startup Script for the Revel (Golang) Framework on CentOS 7
date: 2016-02-03
lang: en
translation_id: buildscript-for-revel-go
permalink: en/2016/02/03/buildscript-for-revel-go/
category: Go
tags:
  - Go
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160203/20160203221206.png
---

## Creating the Startup Script

Let's start with the finished product.

```
# vim /usr/lib/systemd/system/revel.service
```

```
[Unit]
Description=RevelBuildScript
After=nginx.service mysqld.service

[Service]
Type=simple
ExecStart=/bin/bash /var/golang/run.sh

[Install]
WantedBy=multi-user.target
```

* After ... In the configuration above, this setting starts Revel after nginx and mysqld have started.

* ExecStart ... Regarding `/bin/bash /var/golang/run.sh`,
in a previous article I mentioned that I adopt a deployment method based on local builds,
and this points to the path of the `run.sh` that gets created during that process.

{% linkPreview https://kenzo0107.hatenablog.com/entry/2015/08/21/013757 _blank %}

#### Enable on Startup

```
# systemctl enable revel.service
```

#### Start

```
# systemctl start revel.service
```

#### Stop

```
# systemctl start revel.service
```

That's it.

## Background

When running things on AWS, you typically want to use staging environments only while testing and avoid unnecessary costs.

So I end up starting and stopping them over and over.

Since the Revel framework doesn't come with a startup script by default,
I had to start it manually every time an instance came up.

As a result, even for design fixes I would get requests like "Could the infra team please take care of this?", which created extra work on both sides, so I built this to solve that.

Currently, via Slack, I have hubot trigger Jenkins jobs to start and stop the AWS instance that Revel runs on.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160203/20160203220906.png" width="100%">
</div>

For the IP, instead of using an Elastic IP, I use No-IP so that the same domain remains accessible even when the Public IP changes.

This too works by notifying No-ip, which manages the domain, of the Public IP when the instance starts up, dynamically associating the domain with the IP.

{% linkPreview http://kenzo0107.hatenablog.com/entry/2016/02/04/101002 _blank %}

[http://www.noip.com/](http://www.noip.com/)

I hope this can also serve as a reference for building a cost-minimized staging environment on AWS.

That's all.

* Note that a staging environment, unlike a local development environment, is intended purely for verification before deploying to production.
