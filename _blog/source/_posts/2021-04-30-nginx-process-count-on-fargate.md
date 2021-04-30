---
title: Fargate のタスクサイズ による Nginx の起動プロセス数
tags:
- AWS
date: 2021-04-30
---

備忘録です。

Nginx の設定で、プロセス数を auto にして CPU コア数に委ねる設定があります。

```nginx.conf
worker_processes auto;
```

Fargate のタスクサイズだとプロセス数はどの程度になるか調査しました。

## 結果発表

| cpu | mem | nginx worker process 数 |
| --- | --- | --- |
| 256 | 512 | 2 |
| 1024 | 2048 | 2 |
| 2048 | 4096 | 4 |

タスクサイズを上げれば、ちゃんと auto で worker プロセス数が増えてくれた。

ちなみに
プロセス数が増えても [net.maxsoconn 値は Fargate で変更できない](https://kenzo0107.github.io/2021/04/15/2021-04-16-nginx-on-fargate-somaxconn/) ので
リクエストをより捌く様にするには、タスク数を増やした方が良いです。


ちなみに、以下で同額のコスト♪
* cpu=256, mem=512 × 8 タスク
* cpu=2048, mem=4096 × 1 タスク

タスク数を増やそう！
