---
layout: post
title: Install td-agent2 on AWS EC2 (CentOS7) in 3 Minutes!
date: 2015-09-19
lang: en
translation_id: install-td-agent2-centos7
permalink: en/2015/09/19/install-td-agent2-centos7/
cover: /img/cover/2015-09-19-install-td-agent2-centos7.svg
tags:
- Fluentd
- Slack
---

## Environment
- AWS EC2
- CentOS Linux release 7.1.1503 (Core)

## Installing td-agent2

```
$ sudo curl -L http://toolbelt.treasuredata.com/sh/install-redhat-td-agent2.sh | sh
```

## Starting / Registering the Service

```
$ sudo systemctl start td-agent
$ sudo chkconfig td-agent on
```

If you run `systemctl enable`, you'll get scolded and told to use chkconfig instead.

```
$ sudo systemctl enable td-agent

td-agent.service is not a native service, redirecting to /sbin/chkconfig.
Executing /sbin/chkconfig td-agent on
The unit files have no [Install] section. They are not meant to be enabled
using systemctl.
Possible reasons for having this kind of units are:
1) A unit may be statically enabled by being symlinked from another unit's
   .wants/ or .requires/ directory.
2) A unit's purpose may be to act as a helper for some other unit which has
   a requirement dependency on it.
3) A unit may be started when needed via activation (socket, path, timer,
   D-Bus, udev, scripted systemctl call, ...).
[root@ip-172-31-19-253 log]#

```

## Testing

Looking at the configuration file (/etc/td-agent/td-agent.conf), the default settings
log via the `http protocol` from `port:8888` and route the data to td-agent.log (/var/log/td-agent/td-agent.log).

```
# HTTP input
# POST http://localhost:8888/<tag>?json=<json>
# POST http://localhost:8888/td.myapp.login?json={"user"%3A"me"}
# @see http://docs.fluentd.org/articles/in_http
<source>
  type http
  port 8888
</source>

## live debugging agent
<source>
  type debug_agent
  bind 127.0.0.1
  port 24230
</source>
```

Run the following commands and check td-agent.log.

```
$ curl -X POST -d 'json={"json":"TEST!!"}' http://localhost:8888/debug.test

$ sudo tail -f /var/log/td-agent/td-agent.log

2015-09-19 17:34:50 +0900 debug.test: {"json":"TEST!!"}
```

As shown above, we were able to confirm that the data was logged correctly.
