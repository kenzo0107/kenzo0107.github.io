---
layout: post
title: Monitoring Rails Unicorn Memory and Idle/Busy Workers with Datadog — Strange Bedfellows
date: 2017-12-23
category: Monitoring
lang: en
translation_id: monitoring-rails-unicorn-by-datadog-using-mackerel
permalink: en/2017/12/23/monitoring-rails-unicorn-by-datadog-using-mackerel/
tags:
  - Datadog
  - Rails
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171223/20171223193555.png
---

## Overview

When I tried to monitor Unicorn with Datadog on the host running Rails,
there didn't seem to be any suitable Integration ((if there is one, please let me know >\_< )).

So I figured I'd write my own custom script!

## Just as I was about to write a custom script...

A colleague said: "Mackerel has a plugin for that, you know?"

Me: "Huh? ..."

## Mackerel was already installed

Mackerel turned out to have a plugin for monitoring Unicorn.

[mackerel-plugin-unicorn](https://github.com/mackerelio/mackerel-agent-plugins/tree/master/mackerel-plugin-unicorn)

Since the folks at Hatena have kindly released it as OSS,
and reinventing the wheel is a waste of time,
and you only live once, I decided to use this Mackerel plugin with Datadog.

## A "strange bedfellows" Mackerel + Datadog script

- /etc/dd-agent/unicorn_check.py

```python
from checks import AgentCheck
import subprocess
import re
class UnicornCheck(AgentCheck):
  def check(self, instance):
    pidfile = instance['pidfile']
    cmd = "/usr/bin/mackerel-plugin-unicorn -pidfile=%s" % (pidfile)

    res = self.exeCmdWithStripLF(cmd)

    for r in res:
        y = re.split(r'\t+', r.rstrip('\t'))
        metrics = y[0]
        out     = y[1]
        self.gauge(metrics, out)

  # Strip line breaks from the command output
  def exeCmdWithStripLF(self, cmd):
    res = self.exeCmd(cmd)
    return [str(x).rstrip("\n") for x in res]

  # Execute the command
  def exeCmd(self, cmd):
    return subprocess.Popen(
      cmd,
      stdout=subprocess.PIPE,
      shell=True
    ).stdout.readlines()
```

- /etc/dd-agent/conf.d/unicorn_check.yaml

Specify Unicorn's PID file.

```yml
init_config:

instances:
  - pidfile: /path/to/rails_project/shared/tmp/pids/unicorn.pid
```

## Checking the Datadog Agent configuration file

```sh
$ sudo dd-agent configcheck

unicorn_check.yaml is valid
```

## Restarting the Datadog Agent

```sh
$ sudo service datadog-agent restart
```

## Checking the graph a few minutes later

There it is!

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171223/20171223203723.png" width="100%">
</div>

## Wrap-up

And just like that, we got "strange bedfellows"-style monitoring working!

There's a slight sense of guilt in being neither one camp nor the other,
but I think the value of this article lies in how quickly we cobbled together
a working solution, so I put pen to paper.

I hope you find it useful.
