---
layout: post
title: Upgrading to Datadog Agent 6.x and Trying Out the Logging Feature!
date: 2018-01-10
lang: en
translation_id: update-datadog-and-try-loggin-feature
permalink: en/2018/01/10/update-datadog-and-try-loggin-feature/
tags:
  - Datadog
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180110/20180110145104.png
---

Upgrading to Datadog Agent 6.x and trying out the Logging feature!

At the end of 2017, Datadog announced its log visualization tool (in beta).

- It offers a feature to reference logs around the time of high load on a graph via Unifying the views
- It looks promising as an alternative to Elasticsearch + Fluentd

With that in mind, I went ahead and gave it a try.

## How to install datadog-agent

As of January 10, 2018, the 5.x version gets installed.

## Main differences between 5.x and 6.x

- Changes to Datadog configuration file paths

|                       | _5.x_                           | _6.x_                                  |
| --------------------- | ------------------------------- | -------------------------------------- |
| Base directory        | /etc/dd-agent                   | /etc/datadog-agent                     |
| Various config files  | /etc/dd-agent/conf.d/nginx.yaml | /etc/dd-agent/conf.d/nginx.d/conf.yaml |
| Metric information    | dd-agent info                   | datadog-agent status                   |

In 6.x, the `dd-agent` command no longer exists.

- I couldn't find a command equivalent to `dd-agent configcheck`. Could anyone tell me where it is? (;>\_<)

## How to upgrade from 5.x

https://github.com/DataDog/datadog-agent/blob/master/docs/beta.md

My environment was Ubuntu 16.04.2 LTS, so I upgraded using the following method.

```sh
$ DD_UPGRADE=true bash -c "$(curl -L https://raw.githubusercontent.com/DataDog/datadog-agent/master/cmd/agent/install_script.sh)"

...
Error: /etc/datadog-agent/datadog.yaml seems to contain a valid configuration, run the command again with --force or -f to overwrite it
Automatic import failed, you can still try to manually run: datadog-agent import /etc/dd-agent /etc/datadog-agent
```

Seeing the word Error gave me a momentary scare, but reading the error message carefully, it says that the 6.x `/etc/datadog-agent/datadog.yaml` appears to be a valid configuration, and that if you want to overwrite it, you should use --force.

The datadog-agent upgrade had completed successfully.

```sh
$ sudo datadog-agent status

Getting the status from the agent.

===================
Agent (v6.0.0-rc.2)
===================
...
...
```

The various configuration files (/etc/datadog-agent/conf.d, checks.d) had also been migrated without any issues.

## Overriding 5.x configuration files into 6.x

The method above works fine on its own, but I'll document how to forcibly override the files.

```sh
// Migrate the files under /etc/dd-agent/conf.d to 6.x
$ /opt/datadog-agent/bin/agent/agent import /etc/dd-agent /etc/datadog-agent --force

Success: imported the contents of /etc/dd-agent/datadog.conf into /etc/datadog-agent/datadog.yaml
Copied conf.d/http_check.yaml over the new http_check.d directory
Copied conf.d/network.yaml over the new network.d directory
Copied conf.d/nginx.yaml over the new nginx.d directory
Copied conf.d/process.yaml over the new process.d directory
Copied conf.d/process_check.yaml over the new process_check.d directory
Copied conf.d/ssl_check_expire_days.yaml over the new ssl_check_expire_days.d directory
Copied conf.d/unicorn_check.yaml over the new unicorn_check.d directory
Error: unable to list auto_conf files from /etc/dd-agent: open /etc/dd-agent/conf.d/auto_conf: no such file or directory

// Migrate the files under /etc/dd-agent/checks.d/ to 6.x
$ sudo -u dd-agent -- cp /etc/dd-agent/checks.d/*.py /etc/datadog-agent/checks.d/
```

## Sending nginx logs to Logging

- `/etc/datadog-agent/conf.d/nginx.d/conf.yaml`

```yml
init_config:

instances:
  - nginx_status_url: http://localhost/nginx_status/

logs:
  - type: file
    service: hogehoge
    path: /var/log/nginx/access.log
    source: nginx
    sourcecategory: nginx_access

  - type: file
    service: hogehoge
    path: /var/log/nginx/error.log
    source: nginx
    sourcecategory: nginx_error
```

Basically, just adding the logs directive is all you need.

- `/etc/datadog-agent/conf.d/fluentd.d/conf.yaml`

```yml
init_config:

instances:
  - monitor_agent_url: http://localhost:24220/api/plugins.json
    tag_by: type

logs:
  - type: file
    service: hogehoge
    path: /var/log/td-agent/td-agent.log
    source: td-agent
    sourcecategory: td-agent
```

## Editing datadog.conf

Add the following setting to `/etc/datadog-agent/datadog.yaml`.

```
log_enabled: true
```

## Applying the configuration

```
$ sudo systemctl restart datadog-agent
```

## When things don't show up in Datadog properly

Let's take a look at the logs.

```
$ sudo tail -f /var/log/datadog/agent.log

...
2018-01-07 11:01:58 JST | INFO | (logs-agent.go:75 in func1) | open /var/log/nginx/access.log: permission denied
...
```

A permission error was occurring, and the `dd-agent` user running `datadog-agent` was unable to access the file.

### The fix

It's not enough to simply grant 0644 (-rw-r--r--) to `/var/log/nginx/access.log`; you also need to be careful about the permissions of new logs generated by logrotate.

```
/var/log/nginx/*.log {
        daily
        missingok
        rotate 14
        compress
        delaycompress
        notifempty
        create 0644 www-data adm
        sharedscripts
        prerotate
                if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
                        run-parts /etc/logrotate.d/httpd-prerotate; \
                fi \
        endscript
        postrotate
                invoke-rc.d nginx rotate >/dev/null 2>&1
        endscript
}
```

It was originally 0640, but I changed it to generate logs with 0644.
This solved the problem ♪

## Checking in Datadog Logging

I was able to confirm that logs were flowing in.
It's built like Kibana's Discover page.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180110/20180110155520.png" width="100%">
</div>

I'm getting my hopes up, wondering whether I'll be able to filter logs and create graphs going forward, and whether the Pro version might let me use this for free.

Please, Datadog! (-人-)
