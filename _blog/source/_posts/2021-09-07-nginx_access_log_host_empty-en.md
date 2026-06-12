---
title: Investigating Why Nginx access_log $host Becomes _
date: 2021-09-07
category: Infrastructure
lang: en
translation_id: nginx_access_log_host_empty
permalink: en/2021/09/07/nginx_access_log_host_empty/
cover: /img/cover/2021-09-07-nginx_access_log_host_empty.svg
---

This post summarizes my investigation into cases where the `$host` specified in the Nginx access_log ends up as `_`.

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## What is $host?

https://www.nginx.com/resources/wiki/#-24host
> $host
>
> This variable is equal to line Host in the header of request or name of the server processing the request if the Host header is not available.
>
> This variable may have a different value from $http_host in such cases: 1) when the Host input header is absent or has an empty value, $host equals to the value of server_name directive; 2) when the value of Host contains port number, $host doesn't include that port number. $host's value is always lowercase since 0.8.17.

It is the same as the Host in the request header, or, when the Host header is not available, it becomes the name of the server processing the request.


## Access Log Configuration

```nginx.conf
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request_method https://$host$request_uri $server_protocol" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent"';
```

The reason I use `"$request_method https://$host$request_uri $server_protocol"` instead of `"$request"` is that `$request` does not include the host information.

I wanted to use `$host` because I was building a site that handles multiple host names.

## Sending a Request with an Empty Host Header

```
curl -H "Host: " "https://example.com/?test=kenzo.tanaka"

<html>
<head><title>400 Bad Request</title></head>
<body>
<center><h1>400 Bad Request</h1></center>
<hr><center>nginx</center>
</body>
</html>
```


Checking the logs, I was able to reproduce the issue.

```
xxx.xxx.xxx.xxx - - [07/Sep/2021:11:16:16 +0900] "GET https://_/?test=kenzo.tanaka HTTP/1.1" 400 150 "-" "-"
```

Since I ran it with curl, there is no User Agent either.


## Conclusion

Because the access source IPs are mostly overseas and there is no User-Agent and so on, I suspect these are bots.
I don't think normal browser operations would ever send a request without specifying the host information in the header, so I figured there is no impact on regular users.

However, if a bot attacks frequently and puts pressure on server resources, configuring a WAF, such as blocking the IP, becomes essential.

That's all.
I hope this is helpful.
