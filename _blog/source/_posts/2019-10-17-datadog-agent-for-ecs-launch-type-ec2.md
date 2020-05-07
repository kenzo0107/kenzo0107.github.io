---
layout: post
title: Datadog Agent for ECS Launch Type=EC2
date: 2019-10-17
tags:
- Datadog
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20191017/20191017124709.png
---

## 概要

ECS 起動タイプ EC2 にてタスク定義に datadog/agent:latest を設定したが
メトリクスが取得できない事象がありました。

Infrastructure > Containers には datadog/agent:latest を設置したタスク定義内のコンテナ情報は一覧に表示されてますが、メトリクスが取れていない、という状況でした。

<!-- more -->

## 結論

[ttps://docs.datadoghq.com/json/datadog-agent-ecs.json](https://docs.datadoghq.com/json/datadog-agent-ecs.json) 参考に、以下の様な volume mount の設定が必要でした。

```yml
  datadog:
    image: datadog/agent:latest
    environment:
      DD_API_KEY: ${DD_API_KEY}
    logging:
      driver: awslogs
      options:
        awslogs-group: ${LOG_GROUP}
        awslogs-region: ${REGION}
        awslogs-stream-prefix: datadog
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc/:/host/proc:ro
      - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
```


ドキュメントよく読もう、を身につまされる想いでした。

## 参考

[Amazon Elastic Container Service (ECS)](https://docs.datadoghq.com/ja/integrations/amazon_ecs/?tab=python)
