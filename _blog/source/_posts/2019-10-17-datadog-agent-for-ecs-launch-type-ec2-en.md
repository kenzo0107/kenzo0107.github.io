---
layout: post
title: Datadog Agent for ECS Launch Type=EC2
date: 2019-10-17
category: AWS
lang: en
translation_id: datadog-agent-for-ecs-launch-type-ec2
permalink: en/2019/10/17/datadog-agent-for-ecs-launch-type-ec2/
tags:
  - Datadog
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20191017/20191017124709.png
---

## Overview

On ECS launch type EC2, I set `datadog/agent:latest` in the task definition, but
there was an issue where metrics could not be collected.

Under Infrastructure > Containers, the container information from the task definition that included `datadog/agent:latest` was listed, but the metrics were not being collected.

<!-- more -->

## Conclusion

Referring to [ttps://docs.datadoghq.com/json/datadog-agent-ecs.json](https://docs.datadoghq.com/json/datadog-agent-ecs.json), the following volume mount configuration was required.

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

It was a painful reminder to read the documentation carefully.

## References

[Amazon Elastic Container Service (ECS)](https://docs.datadoghq.com/ja/integrations/amazon_ecs/?tab=python)
