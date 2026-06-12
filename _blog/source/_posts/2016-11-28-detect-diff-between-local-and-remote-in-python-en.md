---
layout: post
title: 'Python: A Tool to Detect File Differences Between Local and Remote Servers'
date: 2016-11-30
category: Python
lang: en
translation_id: detect-diff-between-local-and-remote-in-python
permalink: en/2016/11/28/detect-diff-between-local-and-remote-in-python/
cover: /img/cover/2016-11-28-detect-diff-between-local-and-remote-in-python.svg
tags:
- Python
---

## Overview

Across the several companies I've worked at,
there has almost always been a server
whose current status nobody really knows...

A server that has drifted significantly from `master` on Git as well...

To check the differences between such a server and my local workspace,
I built a tool.

{% linkPreview https://github.com/kenzo0107/DiffTool _blank %}


## Going Forward

Right now,
performance is poor because it opens a new SSH connection every time it downloads a file from the remote (>_<)

I have a feeling performance was better when I first used pysftp to open the SSH connection.
But considering how easy it is to just specify a hostname,
I'll go with the hostname-based approach and work on improving its performance.

That said,
I tried implementing it with pysftp, but it didn't work well for multi-hop SSH access...
I'll resolve that as I go.

I'm also considering boosting performance by trying out concurrent processing in golang.
