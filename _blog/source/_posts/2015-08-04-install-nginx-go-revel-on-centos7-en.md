---
layout: post
title: Installing and Verifying Nginx + Go + Revel on CentOS 7
date: 2015-08-04
category: AWS
lang: en
translation_id: install-nginx-go-revel-on-centos7
permalink: en/2015/08/04/install-nginx-go-revel-on-centos7/
cover: https://i.imgur.com/GSsmnDt.png
---

## Environment

- EC2 t2.micro
- CentOS Linux release 7.1.1503 (Core)
- Go version go1.4.2 linux/amd64



Here are the steps.

## Prerequisites

#### SSH login to the EC2 instance

```
$ ssh -i aws.pem centos@xxx.xxx.xxx.xx
```

#### Switch to root privileges

```
$ sudo su -
```

#### Install yum packages

```
# yum update
# yum install -y vim wget '*mercurial*' tree
```

#### Install the latest Git

Since `go get` has been observed to not work correctly when Git is older than 1.8, upgrade Git to the latest version.

* As of 2015-08-03, git version 2.5.0

https://kenzo0107.github.io/2016/02/22/2016-02-23-install-latest-git-on-centos/


## Installing Go

#### Installation

```
# cd /usr/local/src
# wget https://golang.org/dl/go1.4.2.linux-amd64.tar.gz
# tar -C /usr/local/ -xzf go1.4.2.linux-amd64.tar.gz
```

#### Create a workspace for Go

- Source code is managed under this directory.
- Anything fetched with `go get` or installed with `go install` is added to this directory.

```
# mkdir -p /var/golang
```

#### Set the Go execution paths for the root user

- Add the following to /root/.bashrc

```
export GOROOT=/usr/local/go
export GOBIN=$GOROOT/bin
export GOPATH=/var/golang

export PATH=$PATH:$GOBIN
```

- Apply the settings

```
# source /root/.bashrc
```

- Verify that they have been applied

```
# which go
/usr/local/go/bin/go

# go version
go version go1.4.2 linux/amd64
```

If running the commands produces output like the above, everything is fine.


#### Set the Go execution paths for the centos user as well

```
# su - centos
```

- Add the same entries to /home/centos/.bashrc


```
export GOROOT=/usr/local/go
export GOBIN=$GOROOT/bin
export GOPATH=/var/golang

export PATH=$PATH:$GOBIN
```

- Apply the settings

```
$ source /home/centos/.bashrc
```

- Verify that they have been applied

```
$ which go
/usr/local/go/bin/go

$ go version
go version go1.4.2 linux/amd64
```

If running the commands produces output like the above, everything is fine.


## Installing Revel

Install the Revel framework and the Revel command with `go get`.

```
$ go get github.com/revel/revel
$ go get github.com/revel/cmd/revel
```

## Installing Nginx

- Create the Nginx repository

```
# vim /etc/yum.repo.d/nginx.repo
```

- Add the following

```
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/rhel/$releasever/$basearch/
gpgcheck=0
enabled=1
```

#### Install the Nginx module

```
# yum install -y nginx
```

##### Startup configuration

Configure Nginx to start up when the server boots or reboots.

```
# systemctl disable httpd
# systemctl enable nginx
# systemctl start nginx
# systemctl status nginx

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

#### Edit the Nginx configuration file

```
# vim /etc/nginx/conf.d/default.conf
```

```
server {
    listen       80;
    server_name  ec2-xx-xx-xx-xxx.ap-northeast-1.compute.amazonaws.com;

    location / {
        proxy_pass      http://127.0.0.1:9000;
    }
```

## Creating and running an application with Revel

- Create a project named "myapp" with the revel command

```
# revel new myapp
```

- Run it

```
# revel run myapp
```

- Result

* Make sure your security group allows access over HTTP.

![](http://i.imgur.com/GSsmnDt.png)
