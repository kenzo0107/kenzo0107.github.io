---
layout: post
title: Install latest Nginx on Ubuntu
date: 2017-07-10
tags:
  - Nginx
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170710/20170710213742.png
---

Just a memo.

## Install Nginx

```
ubuntu%$ sudo su
ubuntu%$ curl http://nginx.org/keys/nginx_signing.key | sudo apt-key add -
ubuntu%$ sh -c "echo 'deb http://nginx.org/packages/ubuntu/ trusty nginx' >> /etc/apt/sources.list"
ubuntu%$ sh -c "echo 'deb-src http://nginx.org/packages/ubuntu/ trusty nginx' >> /etc/apt/sources.list"
ubuntu%$ apt-get update
ubuntu%$ apt-get install -y nginx
```

## Install sysv-rc-conf

SysV is a runlevel configuration tool.

```
ubuntu%$ apt-get install -y sysv-rc-conf
```

## Configure runlevel of nginx.

> The command chkconfig is no longer available in Ubuntu. The equivalent command to chkconfig is update-rc.d. This command nearly supports all the new versions of ubuntu.

- chkconfig ---> sysv-rc-conf

```
ubuntu%$ sysv-rc-conf nginx on
```

### Show runlevel of nginx

```
ubuntu%$ sysv-rc-conf --list nginx
nginx        0:off      1:off   2:on    3:on    4:on    5:on    6:off
```
