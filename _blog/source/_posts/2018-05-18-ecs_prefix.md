---
layout: post
title: AWS ECS prefix 指定してまとめてタスク登録解除
date: 2018-05-18
tags:
  - AWS
  - ECS
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180606/20180606115540.jpg
---

## 概要

awscli でタスク定義のまとめて登録解除がなかったので簡単に Shell 化しました

{% gist kenzo0107/adadc860e85f8b136ad040c71d249a3d %}

<!-- more -->

## 実行

```
sh deregister_all_tasks_filtered_by_family_prefix.sh <profile> <task definition family prefix>
```

サクッと削除
