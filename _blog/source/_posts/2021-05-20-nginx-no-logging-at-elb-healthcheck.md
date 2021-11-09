---
title: Nginx で ELB のヘルスチェックのログを出力させない
tags:
- AWS
date: 2021-05-20
---

## 概要

ELB のヘルスチェック時の User-Agent (`$http_user_agent`) が `ELB-HealthChecker` の場合に、ログをオフにする設定の備忘録です。

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

`access_log` のパラメータ `if` で条件を指定でき、アクセスログの出力の on/off が可能です。

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## 設定例

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

以上
参考になれば幸いです。
