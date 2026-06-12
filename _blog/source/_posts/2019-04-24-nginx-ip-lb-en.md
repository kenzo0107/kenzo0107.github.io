---
layout: post
title: Nginx - Block Direct IP Access & Configure LB Health Checks
date: 2019-04-24
category: Infrastructure
lang: en
translation_id: nginx-ip-lb
permalink: en/2019/04/24/nginx-ip-lb/
tags:
  - Nginx
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190424/20190424103347.png
---

Here is a summary of how I commonly configure Nginx configuration files to route requests based on the request origin.

```
LB → Nginx → Rails
```

<!-- more -->

## Nginx Configuration

- conf.d/default.conf

```
# cannot allow ip direct
server {
  listen       80;
  server_name  _;
  return       444;
}

# healthcheck from LB
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  root /work/app/public;

  location = /healthcheck.html {
    access_log  off;
    proxy_pass https://puma;
  }
}

server {
  listen  80;
  server_name example.com;
  ...
```

### Blocking Direct IP Access

By setting `server_name _`, we target direct IP access.

```
server {
  listen       80;
  server_name  _;
  return       444;
}
```

### Health Checks from the LB

By setting the target of the LB's health checks as `default_sever`, the health checks reference this `server` directive.

```
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  root /work/app/public;

  location = /healthcheck.html {
    access_log  off;
    proxy_pass https://puma;
  }
}
```

In the config file above, the AWS ALB health check path is set to `/healthcheck.html`, and its target is the Rails puma server.

On the Rails side, you can either point it to the `ok_computer` gem as shown below, or return your own custom response.

```ruby
get 'healthcheck.html', to: 'ok_computer/ok_computer#index'
```

### Specifying a Domain

This `server` directive is referenced when accessed via `example.com`.

```
server {
  listen  80;
  server_name example.com;
  ...
```

### A Bad Example of Specifying a Domain

Previously, I handled direct IP access and health checks by specifying the configuration as follows.

```
server {
    listen 80;
    server_name example.com;

    if ($host != &#34;example.com&#34;) {
        return 444;
    }

    location = /healthcheck.html {
      access_log  off;
      proxy_pass https://puma;
    }
    ...
}
```

Of course, this works too. However, the readability is somewhat poor.

When supporting multiple domains with direct IP access disabled, this `if` statement keeps getting longer and longer.

For that reason, I found that splitting things into small `server {}` blocks according to the intended target leads to higher readability and better maintainability in actual operation.

That's all.
I hope this is helpful.
