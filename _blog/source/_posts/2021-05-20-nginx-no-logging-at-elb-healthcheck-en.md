---
title: Suppress ELB Health Check Logs in Nginx
tags:
- AWS
date: 2021-05-20
categories:
  - [AWS]
  - [Infrastructure]
lang: en
translation_id: nginx-no-logging-at-elb-healthcheck
permalink: en/2021/05/20/nginx-no-logging-at-elb-healthcheck/
cover: /img/cover/2021-05-20-nginx-no-logging-at-elb-healthcheck.svg
---

## Overview

This is a memo on how to turn off logging when the User-Agent (`$http_user_agent`) of an ELB health check is `ELB-HealthChecker`.

```
http {
  ...
  map $http_user_agent $loggable {
      ~ELB-HealthChecker  0;
      default             1;
  }

  access_log  /var/log/nginx/access.log ltsv if=$loggable;
}
```

You can specify a condition with the `if` parameter of `access_log` to toggle access log output on and off.

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## Configuration Example

* conf/nginx.conf
```
http {
  ...
  # access log を ltsv 形式にする
  log_format ltsv 'domain:$host\t'
                  'host:$remote_addr\t'
                  'user:$remote_user\t'
                  'time:$time_local\t'
                  'method:$request_method\t'
                  'path:$request_uri\t'
                  'protocol:$server_protocol\t'
                  'status:$status\t'
                  'size:$body_bytes_sent\t'
                  'referer:$http_referer\t'
                  'agent:$http_user_agent\t'
                  'response_time:$request_time\t'
                  'cookie:$http_cookie\t'
                  'set_cookie:$sent_http_set_cookie\t'
                  'upstream_addr:$upstream_addr\t'
                  'upstream_cache_status:$upstream_cache_status\t'
                  'upstream_response_time:$upstream_response_time';

  map $http_user_agent $loggable {
      ~ELB-HealthChecker  0;
      default             1;
  }

  access_log  /var/log/nginx/access.log ltsv if=$loggable;

  include /etc/nginx/conf/conf.d/*.conf;
}
```

* conf/conf.d/default.conf
```
server {
  listen 80;
  listen [::]:80;

  # ELB のヘルスチェッカーの場合、 200 を返す
  if ($http_user_agent ~* ELB-HealthChecker) {
      return 200;
  }
  ...
}
```

That's all.
I hope this helps.
