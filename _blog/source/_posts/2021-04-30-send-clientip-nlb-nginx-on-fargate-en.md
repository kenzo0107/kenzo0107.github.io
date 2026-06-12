---
title: Delivering the Client IP to Fargate with NLB + Fargate
tags:
  - AWS
date: 2021-04-30
categories:
  - [AWS]
  - [Infrastructure]
lang: en
translation_id: send-clientip-nlb-nginx-on-fargate
permalink: en/2021/04/30/send-clientip-nlb-nginx-on-fargate/
cover: https://i.imgur.com/4xB6wVP.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

A Target Group behind an NLB has a feature that lets it pass the originating client IP to the target without altering it.

Using this, you can implement IP-based access control.

However, with an NLB + Fargate setup, I confirmed that the IP reaching Fargate was the NLB's private IP.

(With EC2 the client IP was passed through without any problem.)

I had the following kind of configuration in Nginx, and yet... Why??

```
    set_real_ip_from  10.10.0.0/16;
    real_ip_header    X-Forwarded-For;
    real_ip_recursive on;
```

## Cause

https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-target-groups.html#client-ip-preservation

> If the target group protocol is TCP or TLS, client IP preservation is disabled by default.

It turns out that for an NLB, when the Target Group protocol is TCP or TLS, client IP preservation is disabled by default.

To add some context:
Because Fargate specifies target type = IP in the Target Group, the client IP is not preserved by default.

EC2, on the other hand, specifies an instance ID in the Target Group, and in that case client IP preservation is enabled.

## Solution

As described in the AWS documentation below, enable proxy protocol v2.

https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-target-groups.html#proxy-protocol

### Target Group configuration

```
resource "aws_lb_target_group" "app_https" {
  ...
  target_type       = "ip"
  proxy_protocol_v2 = true # enable proxy protocol
  ...
}
```

### Nginx configuration

Configure Nginx to accept proxy_protocol requests.

```
server {
    listen 443 ssl proxy_protocol;
    server_name _;
```

## Result

I successfully delivered the client IP to Fargate!

However,
when I set the Nginx error log level to debug,
I could see a message saying that proxy protocol v2 was not supported.

![](https://i.imgur.com/WRZ3nNp.png)

Looking at https://github.com/nginx/nginx/commit/9207cc84b21e94283478cee7a953b1859c4434cb, it seems to be handled without any problem.

The official docs also state that it is supported from Nginx 1.13.11 onward, so there should be no issue.

https://docs.nginx.com/nginx/admin-guide/load-balancer/using-proxy-protocol/

> To accept the PROXY protocol v2, NGINX Plus R16 and later or NGINX Open Source 1.13.11 and later

While the log message is a bit concerning,
from the LB's perspective the client IP is being delivered to Fargate, and Nginx appears to be interpreting it correctly.
