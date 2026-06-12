---
layout: post
title: Bulk Deregistering AWS ECS Tasks by Specifying a Prefix
date: 2018-05-18
lang: en
translation_id: ecs_prefix
permalink: en/2018/05/18/ecs_prefix/
tags:
  - AWS
  - ECS
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180606/20180606115540.jpg
---

## Overview

Since awscli does not provide a way to deregister task definitions in bulk, I quickly put together a shell script for it.

{% gist kenzo0107/adadc860e85f8b136ad040c71d249a3d %}

<!-- more -->

## Usage

```
sh deregister_all_tasks_filtered_by_family_prefix.sh <profile> <task definition family prefix>
```

Delete them in one shot.
