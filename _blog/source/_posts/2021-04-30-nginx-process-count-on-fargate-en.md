---
title: Number of Nginx Worker Processes by Fargate Task Size
tags:
- AWS
date: 2021-04-30
category: AWS
lang: en
translation_id: nginx-process-count-on-fargate
permalink: en/2021/04/30/nginx-process-count-on-fargate/
cover: /img/cover/2021-04-30-nginx-process-count-on-fargate.svg
---

Just a memo.

Nginx has a setting that sets the number of worker processes to `auto`, delegating the count to the number of CPU cores.

```nginx.conf
worker_processes auto;
```

I investigated how many processes this results in for various Fargate task sizes.

## Results

| cpu | mem | number of nginx worker processes |
| --- | --- | --- |
| 256 | 512 | 2 |
| 1024 | 2048 | 2 |
| 2048 | 4096 | 4 |

When I increased the task size, the worker process count properly grew with `auto`.

By the way,
even if the number of processes increases, [you can't change the net.somaxconn value on Fargate](https://kenzo0107.github.io/2021/04/15/2021-04-16-nginx-on-fargate-somaxconn/), so
to handle more requests, it's better to increase the number of tasks.


Also, the following cost the same amount ♪
* cpu=256, mem=512 × 8 tasks
* cpu=2048, mem=4096 × 1 task

Let's increase the number of tasks!
