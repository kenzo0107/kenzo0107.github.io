---
layout: post
title: Common Pitfalls When Configuring Fluentd
date: 2015-08-21
category: Monitoring
lang: en
translation_id: fluentd-failpattern
permalink: en/2015/08/21/fluentd-failpattern/
cover: /img/cover/2015-08-21-fluentd-failpattern.svg
tags:
- Fluentd
---

I'll add more as I go.

## Environment

- CentOS Linux release 7.1.1503 (Core)
- Fluentd 0.12.12
- Nginx 1.8.0


## Permission denied

- Permission error!

```
# tail -f /var/log/td-agent/td-agent.log

2015-08-19 14:17:14 +0900 [error]: Permission denied @ xxxxxxx - /var/log/nginx/error.log
  2015-08-19 14:17:14 +0900 [error]: suppressed same stacktrace
```

### Solution

Change the user that runs td-agent to `root`.

```
$ sudo vim /etc/init.d/td-agent

- TD_AGENT_USER=td-agent
- TD_AGENT_GROUP=td-agent

+ TD_AGENT_USER=root
+ TD_AGENT_GROUP=root
```

Reload the daemon.

```
sudo systemctl daemon-reload
```

### Verification

You can confirm that `tail` is now running correctly, as shown below.

```
# tail -f /var/log/td-agent/td-agent.log

2015-08-19 14:17:15 +0900 [info]: following tail of /var/log/nginx/access.log
2015-08-19 14:17:15 +0900 [info]: following tail of /var/log/nginx/error.log
```


## [warn]: pattern not match

This one really tripped me up.

When forwarding Nginx logs, I had seen many articles describing the format below, so I
configured it that way and then got an error (; >_<)

- /etc/td-agent/td-agent.conf

```
<source>
  type tail
  format nginx
  path /var/log/nginx/access.log
  pos_file /var/log/td-agent/nginx-access.pos
  tag nginx.access
</source>
```

### Solution

Fix it as follows.

- /etc/td-agent/td-agent.conf

```
<source>
  type tail
  format /^(?<remote>[^ ]*) (?<host>[^ ]*) (?<user>[^ ]*) \[(?<time>[^\]]*)\] "(?<method>\S+)(?: +(?<path>[^ ]*) +\S*)?" (?<code>[^ ]*) (?<size>[^ ]*)(?: "(?<referer>[^\"]*)" "(?<agent>[^\"]*)" "(?<forwarder>[^\"]*)")?/
  time_format %d/%b/%Y:%H:%M:%S %z
  path /var/log/nginx/access.log
  pos_file /var/log/td-agent/nginx-access.pos
  tag nginx.access
</source>
```

Restart td-agent.

```
$ sudo systemctl restart td-agent
```

That does it.

## Duplicate buffer_path

```
[error]: failed to configure sub output redshift: Other '' plugin already use same buffer_path: type = , buffer_path = *
```

Originally my configuration looked like this.
There was a problem with the td-agent destination, so the buffer piled up, ran into a duplicate, and raised an error.

```
buffer_path /logs/td-agent/nginx/logs
```

Example) When you have tags like the following, buffer_path ends up being the same `/logs/td-agent/nginx/logs`.

hogehoge.20170101.log
hogehoge.20170102.log

### Solution

Solved by using tag_parts to make buffer_path unique per tag, as shown below.

```
buffer_path /logs/td-agent/nginx/logs_${tag_parts[0]}_${tag_parts[1]}
```


I'll keep adding more whenever something comes up.
