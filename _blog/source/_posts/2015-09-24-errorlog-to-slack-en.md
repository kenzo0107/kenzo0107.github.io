---
layout: post
title: Sending Error Logs to Slack
date: 2015-09-24
category: Monitoring
lang: en
translation_id: errorlog-to-slack
permalink: en/2015/09/24/errorlog-to-slack/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150924/20150924011032.png
tags:
- Fluentd
---

## Environment

- CentOS Linux release 7.1.1503 (Core)
- td-agent: 0.12.12
- Nginx: 1.8.0

## Overview

Since Slack-based collaboration has been taking off internally
and we've been consolidating log management into fluentd,
I decided to give it a shot and have error logs trigger Slack notifications when something happens.

I'm envisioning a flow like the following.

> Nginx error.log ---> fluentd ---> slack


I thought "Should I build a gem?" but there are already plenty of Slack plugins out there,
so I'll gladly ride on their coattails!

## Preparation
Make sure fluentd can access /var/log/nginx/error.log.

If you can't tail the logs for some reason, see the following.

{% linkPreview http://kenzo0107.hatenablog.com/entry/2015/08/21/011624 _blank %}



## fluentd Plugins to Use

- [sowawa/fluent-plugin-slack](https://github.com/sowawa/fluent-plugin-slack)
- [sonots/fluent-plugin-record-reformer](https://github.com/sonots/fluent-plugin-record-reformer)
- [fluent/fluent-plugin-rewrite-tag-filter](https://github.com/fluent/fluent-plugin-rewrite-tag-filter)

## td-agent.conf Configuration

{% gist kenzo0107/8dd7e6f07158987e8b4d %}

#### error.log Format Configuration

- Assume that Nginx's error logs are formatted and output as follows.

```
2015/11/18 18:01:47 [error] 23029#0: *9086 open() "/var/golang/src/img/tmp.png" failed (2: No such file or directory), client: ***.**.**.****, server: hogehoge.jp, request: "GET /img/tmp.png HTTP/2.0", host: "hogehoge.jp", referrer: "http://hogehoge.jp"
```

- fluentd format configuration

```
format /^(?<time>.+) \[(?<level>[^\]]+)\] *(?<message>.*)$/
```

With the format configuration above, you can extract the data in a `key : value` structure as follows.

```
time : 2015/11/18 18:01
level : error
message : or] 23029#0: *9086 open() "/var/www/html/img/tmp.png" failed (2: No such file or directory), client: ***.**.**.****, server: hogehoge.jp, request: "GET /img/tmp.png HTTP/2.0", host: "hogehoge.jp", referrer: "http://hogehoge.jp"
```

Depending on the configuration, the notifications didn't come through properly and I got stuck for a bit. (sweat)

#### Rewriting the tag Name

We rewrite the tag based on the key:value extracted above.

In the example below,
when `level` is `error`, the tag is rewritten to `slack.error.${tag} (slack.error.nginx.error)`.
The same goes for warn and fatal.

```
<match nginx.error>
  type rewrite_tag_filter
  rewriterule1 level error slack.error.${tag}
  rewriterule2 level warn slack.warn.${tag}
  rewriterule3 level fatal  slack.fatal.${tag}
</match>
```

You can also match cases where the value extracted in `message`<br/>
contains a specific string.

e.g.) When `message` contains a string starting with "PHP Fatal Error", rewrite it to slack.fatal.${tag}.

```
<match nginx.error>
  type rewrite_tag_filter
  rewriterule1 level error slack.error.${tag}
  rewriterule2 level warn slack.warn.${tag}
  rewriterule3 level fatal  slack.fatal.${tag}

  rewriterule4 message ^PHP Fatal Error.*$ slack.fatal.${fatal}    # added
</match>
```



#### Adding a Field

- Adding source_id

In addition to time, level, and message, we add `source_id`.
In the example below, tag_suffix[1] is specified for `source_id`.

```
<match slack.**>
  type record_reformer
  tag reformed.${tag}
  <record>
    source_id ${tag_suffix[1]}
  </record>
</match>
```

#### About tag_suffix
If the tag is reformed.slack.error.nginx.error,
the specification is as follows.

```
tag_suffix[0] → reformed.slack.error.nginx.error
tag_suffix[1] → slack.error.nginx.error
tag_suffix[2] → error.nginx.error

tag_suffix[-1] → error
tag_suffix[-2] → nginx.error
```


#### Slack Notification

- Set the Webhook URL from an Incoming Webhook

```
<match reformed.slack.**>
  type slack
  webhook_url https://hooks.slack.com/services/xxxxxxxxx/xxxxxxxxx/xxxxxxxxxxxxxxxxxxxxxxxx
  channel flag_production
  username fluentd
  title_keys source_id
  title %s
  color danger
  flush_interval 5s
</match>
```

## Notification Result

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150924/20150924011032.png" width="100%">
</div>


## A Side Note

Even if you send notifications to Slack, it often happens that people don't check work messages on their days off,
so there's also a plugin that notifies you by phone via Twilio.

[y-ken/fluent-plugin-twilio](https://github.com/y-ken/fluent-plugin-twilio)

It's a paid service provided by KDDI Web Communications Inc.
It's relatively inexpensive, so please consider adopting it.

### Twilio Pricing Table

[twilio price](http://twilio.kddi-web.com/price/)

It's nice that the old "Sorry, I didn't see the email 💦"
situations seem like they'll be a thing of the past.


That's all.
