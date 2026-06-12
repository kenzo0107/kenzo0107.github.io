---
layout: post
title: Handling Dynamic IP Updates for AWS Instances with no-ip ~ Always Access via the Same Domain Name ~
date: 2016-02-04
lang: en
translation_id: no-ip-aws-instance-dynamic-ip
permalink: en/2016/02/04/no-ip-aws-instance-dynamic-ip/
cover: /img/cover/2016-02-04-no-ip-aws-instance-dynamic-ip.svg
tags:
- AWS
- no-ip
---

## Overview

Unless you assign an Elastic IP, starting and stopping an AWS instance
changes its Public IP.

Once you assign an Elastic IP, you are charged for it even while the AWS instance is stopped.

For instances used temporarily, such as test environments,
notifying everyone involved that the IP has changed at each startup is a hassle.

For that reason, I used No-IP to pin a domain and handle IP changes.

No-IP is a free domain service that also distributes a Linux module for detecting dynamic IP changes.

## Environment
- Amazon Linux AMI release 2015.09
- noip 2.1.9


## Steps

First, sign up on the noip site and register the domain you want to use.
For now, any IP will do.

[http://www.noip.com/](http://www.noip.com/)



```
// Run as the root user
$ sudo su
# cd /usr/local/src

// noip module
# wget http://www.no-ip.com/client/linux/noip-duc-linux.tar.gz
# tar xzf noip-duc-linux.tar.gz
# cd noip-2.1.9
# make
# make install

// Create the startup script
# cp redhat.noip.sh /etc/init.d/noip
# chmod 755 /etc/init.d/noip

// Startup configuration
# /sbin/chkconfig noip on

// Start
# /etc/init.d/noip start
```

After startup, you can confirm on the No-IP console that the IP of the specified domain
switches over in less than a minute.

## Going Forward

No-IP had become a hotbed of malware according to Microsoft, which, in order to protect users,
petitioned a federal court to suspend 22 No-IP domains, and the petition was granted.

No-IP, for its part, said it could have responded had it been consulted, and after the petition
it took action and has been progressively restoring the domains.

You do need to use it with some degree of security in mind.
So far, with AWS security groups in particular there has been no external access,
and it has been working without issue.


Also,
there was an article from GREE like the following.

[The Best Way to Obtain a Public IP on AWS EC2](https://labs.gree.jp/blog/2016/02/15825/)

I think I'll ask the people involved internally.

=== Addendum ===

Regarding the GREE article, I asked the people involved internally, and apparently they only use it on Ubuntu.
