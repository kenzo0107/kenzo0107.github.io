---
layout: post
title: Installing Sentry on macOS X + Vagrant (CentOS7) and Verifying It Works
date: 2015-04-11
lang: en
translation_id: install-sentry-on-centos7
permalink: en/2015/04/11/install-sentry-on-centos7/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150409/20150409112616.png
---

## Overview

https://sentry.readthedocs.org/en/latest/quickstart/


## Environment

- MacOS 10.10.2 Yosemite
- Vagrant 1.6.5
- Virtual Box 4.3.20 r96996
- CentOS 7.1.1503 (Core)
- Python 2.7.5 (pip 6.0.8)
- Redis 3.0.0
- MySQL 5.6
- NginX 1.6.2


## Prerequisites

The official Sentry site says you should have the following set up beforehand.

- Python2.7
- python-setuptools, python-pip, python-dev, libxslt1-dev, libxml2-dev, libz-dev, libffi-dev, libssl-dev
- DB (PostgreSQL: recommended, or MySQL) => I'll use MySQL
- Redis
- NginX

The official Sentry site tests on Ubuntu,
but I've confirmed it works on CentOS in the environment above as well.


### Add / Boot the CentOS7 box image in Vagrant and connect via SSH
* I set the IP to Vagrantfile's default value "192.168.33.10".

{% gist kenzo0107/a671f5f5bf628cc4a963 %}

### Install pip

{% gist kenzo0107/1524267337a7b1f2a478 %}

* Workaround for the error that occurs when installing various modules with pip [command 'gcc' failed with exit status 1]

{% gist kenzo0107/f204c7af2b764d15a6c6 %}



### Install Redis

{% gist kenzo0107/6f4475e8a161cf9c8f9f %}


### Install MySQL

{% gist kenzo0107/94509f453f2d49fc2500 %}


### Initial MySQL setup for Sentry

{% gist kenzo0107/427c9c31fad07e8e8e76 %}



### Install NginX / configure firewall to allow HTTP traffic

{% gist kenzo0107/f779db05456c5b9f3d98 %}


### NginX /etc/nginx/conf.d/default.conf configuration for Sentry

{% gist kenzo0107/3a865cab9e69ceaa5187 %}




## Procedure

### Install / start Sentry

{% gist kenzo0107/c1ee50b121dd0a8f6d4f %}

### Start celery

{% gist kenzo0107/d29b9a730520c6e04e39 %}


If celery isn't installed, install it as follows
```
pip install celery
```

### Access the URL
Access http://192.168.33.10

The login page is displayed.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150409/20150409112616.png)




Below, I'll carry out the steps needed for logging.
- Login account
- Create a team
- Create a project
- Logging


### Please log in.
* If you don't have an account, create one from the "Create a new account" link

### Create a team

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150409/20150409113751.png)

### Create a project

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150409/20150409114037.png)

A new project has been created.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150409/20150409114415.png)

Clicking the "Go It !" button takes you to the page of the project you created.

### Click the "Settings" tab on the project page

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150411/20150411020105.png)



## Let's actually send a log.

### Check the API key. Click the "API Keys" link in the left menu

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150411/20150411020922.png)

Copy the Default key

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150411/20150411021820.png)


### Test send
Run the following from the macOS X Terminal.
Send asynchronously with raven.

```
raven test (the Default API key you copied)
```

If raven isn't installed, install it with brew as follows.

{% gist kenzo0107/f9de3b92e9635c83f0d0 %}



### You can see that the event was added in the Stream tab.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150411/20150411022906.png)






## Sending a log from PHP

The instructions are provided, so let's check them.

### After clicking the Settings tab, click "Setup & Installation"

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150411/20150411023142.png)

### Click the PHP icon

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150411/20150411023448.png)


On your local macOS,
pull raven-php from git and set it up.
```
git clone https://github.com/getsentry/raven-php
cd raven-php/
```

Create a new file "t.php"

* t.php

{% gist kenzo0107/b62bc3ef9785511d5a27 %}

Run t.php
```
php t.php
```

As shown below, you can also confirm the log sent to Sentry from PHP.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150411/20150411024245.png)

You can also send logs from Python and Go.
Please give it a try.

That's all
