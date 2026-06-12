---
layout: post
title: Monitoring System Load and Investigating Its Causes
date: 2016-09-21
categories:
  - [AWS]
  - [Infrastructure]
lang: en
translation_id: heavy-load-the-reason
permalink: en/2016/09/21/heavy-load-the-reason/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160921/20160921223252.png
tags:
  - MachineLearning
---

## Overview

A simple set of notes intended as an explanation for new graduates.

| -_Item_- | -_Explain_-                                                  |
| -------- | ------------------------------------------------------------ |
| %user    | CPU usage in user space                                      |
| %system  | CPU usage in kernel space                                    |
| %iowait  | Percentage of time spent waiting for I/O                     |
| %idle    | Percentage of time the CPU is idle and not waiting for I/O   |

## Investigating the cause from CPU-related graphs in Zabbix + Grafana on a given day

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160921/20160921223252.png" width="100%">
</div>

## (1) %iowait is exceptionally high

- %iowait high
- %user low
- %system low

### Cause

Heavy swapping may be occurring.

### Investigation steps

#### 1. Check SwapIn & SwapOut

```sh
$ sar -W
```

#### 2. System-wide memory usage

```sh
$ free
```

#### 3. Sort by memory usage and identify the processes consuming memory

```sh
$ top
```

- Shift+p: sort by CPU usage
- Shift+m: sort by memory usage

##### The actual cause

Since it occurred periodically at the same time, I checked the cron configuration with `crontab -l` and found a batch job running that nobody knew about. *sweat*

## (2) %user is exceptionally high

- %iowait low
- %user high
- %system low

### Cause

CPU usage is high.

### Investigation steps

#### 1. Sort by CPU usage in descending order to identify the process

```
$ top
```

- Shift+p: sort by CPU usage

This is only a small part, but I hope it helps.
That's all.
