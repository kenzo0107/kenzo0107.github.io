---
layout: post
title: Installing Nginx on CentOS7
date: 2015-08-20
lang: en
translation_id: install-nginx-on-centos7
permalink: en/2015/08/20/install-nginx-on-centos7/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150820/20150820232103.png
tags:
- Nginx
---

I wrote this down for setting up Kibana.

## Environment
- CentOS7

## Installing Nginx

- Create the repository for Nginx

```
# vim /etc/yum.repos.d/nginx.repo
```

- Add the following

```
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/mainline/centos/7/$basearch/
gpgcheck=0
enabled=1
```

#### Installing the Nginx module

```
$ sudo yum install --enablerepo=nginx nginx
```

##### Registering the service

Configure Nginx to start when the server boots or reboots.

```
$ sudo systemctl disable httpd
$ sudo systemctl enable nginx
$ sudo systemctl start nginx
$ systemctl status nginx

nginx.service - nginx - high performance web server
   Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled)
   Active: active (running) since Mon 2015-08-03 06:07:44 UTC; 2s ago
     Docs: http://nginx.org/en/docs/
  Process: 12642 ExecStart=/usr/sbin/nginx -c /etc/nginx/nginx.conf (code=exited, status=0/SUCCESS)
  Process: 12641 ExecStartPre=/usr/sbin/nginx -t -c /etc/nginx/nginx.conf (code=exited, status=0/SUCCESS)
 Main PID: 12645 (nginx)
   CGroup: /system.slice/nginx.service
           ├─12645 nginx: master process /usr/sbin/nginx -c /etc/nginx/nginx....
           └─12646 nginx: worker process

Aug 03 06:07:44 ip-172-31-19-253 systemd[1]: Starting nginx - high performan....
Aug 03 06:07:44 ip-172-31-19-253 nginx[12641]: nginx: the configuration file...k
Aug 03 06:07:44 ip-172-31-19-253 nginx[12641]: nginx: configuration file /et...l
Aug 03 06:07:44 ip-172-31-19-253 systemd[1]: Failed to read PID from file /r...t
Aug 03 06:07:44 ip-172-31-19-253 systemd[1]: Started nginx - high performanc....
Hint: Some lines were ellipsized, use -l to show in full.
```

## Verifying access

http://<IP address or domain>

If you see something like the following, you are good to go.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150820/20150820232103.png" width="100%">
</div>

That's all.
