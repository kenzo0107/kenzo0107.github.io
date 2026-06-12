---
title: Investigating the "Resource temporarily unavailable" Error on Nginx on Fargate
tags:
  - AWS
date: 2021-04-16
lang: en
translation_id: nginx-on-fargate-somaxconn
permalink: en/2021/04/16/nginx-on-fargate-somaxconn/
cover: https://i.imgur.com/UvdQW0r.png
---

I was running Nginx on Fargate, but during testing I kept running into an issue where requests would clog up almost immediately.
Here is a summary of what I investigated at the time.

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## Setting the error log level to debug

It was originally set to `info`, but since I couldn't find any relevant logs,
I set the error log level to `debug` in the nginx configuration file and checked the logs.

```nginx.conf
error_log stderr debug;
```

Then the following log showed up.

```
accept() not ready (11: Resource temporarily unavailable)
```

It says that `accept()` is not ready due to a temporary lack of resources.

Given how Nginx handles communication, the part that `accept()` is responsible for is easy to understand from the diagram below.
![](https://i.imgur.com/PPJozW1.png)

## Looking into net.core.somaxconn

net.core.somaxconn is the maximum length of the queue that stores requests accepted by a TCP socket.

I came up with the hypothesis that the number of requests it can accept might be too small.

I entered the Nginx container and ran the following.

```console
$ sysctl net.core.somaxconn
net.core.somaxconn = 128
```

That's very small!

I wanted to change this setting!

## Trying to change it in the Dockerfile

```
RUN sysctl -w net.core.somaxconn=1024
```

It errored out (T_T).

```
#21 0.370 sysctl: error setting key 'net.core.somaxconn': Read-only file system
```

Could it be done on Fargate?

```
docker run --sysctl net.core.somaxconn=65535 ...
```

## Could it be done through Fargate settings?

[【週刊 Ask An Expert #04】AWS Loft Tokyo で受けた質問まとめ #AWSLoft](https://aws.amazon.com/jp/blogs/startup/weekly-aae-04/)

> Q: I want to change net.core.somaxconn on Fargate
> At present, you can't change it on Fargate, so please solve it by launching more tasks.

## Conclusion

As things stand, the only way to resolve the `Resource temporarily unavailable` error that occurs with Nginx is to simply increase the number of tasks!

It has been raised as an issue on the AWS containers roadmap.

The day Fargate supports this will surely come eventually... I hope!

[https://github.com/aws/containers-roadmap/issues/623](https://github.com/aws/containers-roadmap/issues/623)
