---
layout: post
title: Dealing with a Flood of Alerts from Datadog NTP Monitoring
category: Monitoring
date: 2018-07-30
lang: en
translation_id: datadog_ntp_alert
permalink: en/2018/07/30/datadog_ntp_alert/
tags:
  - Datadog
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180730/20180730133759.jpg
---

## Overview

When monitoring server time with Datadog, we ran into an issue where unnecessary alerts fired because the reference sources for standard time differed.

By default, Datadog references `pool.ntp.org`.

Since the Chrony configured on our AWS EC2 instances was set up to reference `ntp.nict.jp` by default, one day we suddenly got hit with a flood of alerts.

As a countermeasure, we configured Datadog and Chrony to use a unified reference source.

<!-- more -->

## Unifying the Time Server Host

In this case we were using AWS, and since AWS also provides an NTP server, we decided to reference that.

The [AWS Time Sync Service](https://aws.amazon.com/jp/blogs/news/keeping-time-with-amazon-time-sync-service/) host is `169.254.169.123`.

Since it is accessible via the link-local IP address `169.254.169.123`, it can be reached even from a private subnet.
The fact that it is an IP address is a bit nerve-wracking, since it would be painful if it suddenly changed one day, but so far that hasn't happened.

- /etc/datadog-agent/conf.d/ntp.d/conf.yaml

```yml
init_config:

instances:
  - offset_threshold: 60
    host: 169.254.169.123 # 追加
```

- /etc/chrony/chrony.conf

```yml
# server ntp.nict.jp minpoll 4 maxpoll 4  # コメントアウト
server 169.254.169.123 prefer iburst # 追加
```

After applying the settings above, restart the services.

```sh
$ sudo systemctl restart chrony
$ sudo systemctl restart datadog-agent
```

The steps above resolved the alerts.

## References

- [Keeping time with Amazon Time Sync Service](https://aws.amazon.com/jp/blogs/news/keeping-time-with-amazon-time-sync-service/)
- [How do I use pool.ntp.org?](https://www.pool.ntp.org/ja/use.html)
