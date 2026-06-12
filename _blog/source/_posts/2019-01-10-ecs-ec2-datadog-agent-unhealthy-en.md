---
layout: post
title: A Prescription for When the Datadog Agent Container Running on ECS EC2 Becomes Unhealthy
date: 2019-01-10
categories:
  - [AWS]
  - [Monitoring]
lang: en
translation_id: ecs-ec2-datadog-agent-unhealthy
permalink: en/2019/01/10/ecs-ec2-datadog-agent-unhealthy/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190110/20190110112818.png
tags:
- AWS
- ECS
- Datadog
---

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190110/20190110112818.png" width="100%">
</div>

## Overview

```sh
$ docker ps

CONTAINER ID        IMAGE                            COMMAND                  CREATED             STATUS                    PORTS                NAMES
8baa0e2cff47        datadog/docker-dd-agent:latest   "/entrypoint.sh supe…"   31 hours ago        Up 31 hours (unhealthy)   8125/udp, 8126/tcp   ecs-dd-agent-task-1-dd-agent-f6d3d5eb9febcab9c601
```

One day, I ran into an issue where the Datadog Agent container running on ECS became unhealthy.
Here I summarize the cause and how I dealt with it.

## Conclusion

I was able to resolve it by upgrading the Datadog Agent image to the latest version 6, which is current at the time of writing.

When I reached out to Datadog support, it turned out that in this case the problem stemmed from the Datadog Agent image being a version 5 image.

### datadog/docker-dd-agent:latest was the latest of the version 5 line!

Back when version 5 was the latest, I had set things up following the procedure below.
[https://docs.datadoghq.com/integrations/faq/agent-5-amazon-ecs/](https://docs.datadoghq.com/integrations/faq/agent-5-amazon-ecs/)

The task used to launch the Datadog Agent on ECS, which appears in the procedure above, is the following.
The image specified here (datadog/docker-dd-agent:latest) was a version 5 image.

[https://docs.datadoghq.com/json/dd-agent-ecs.json](https://docs.datadoghq.com/json/dd-agent-ecs.json)

`datadog/docker-dd-agent:latest` was the latest of the version 5 line!

### datadog/agent:latest is the latest version 6, as of 2019.01.10!

To use the current latest version 6, refer to the setup procedure below.
[https://docs.datadoghq.com/integrations/amazon_ecs](https://docs.datadoghq.com/integrations/amazon_ecs)

The only real change in the procedure is updating the task definition.

[https://docs.datadoghq.com/json/datadog-agent-ecs.json](https://docs.datadoghq.com/json/datadog-agent-ecs.json)

For now, `datadog/agent:latest` is the latest of the version 6 line.
When version 7 comes around, I really hope they keep backward compatibility.

## Bonus

### Contacting Support

When you contact support, they give you a caseID, which is the ID for your inquiry.
After that, I set the caseID, collected the log file (tar.gz) generated at startup, and attached it for support.

I SSH'd into the EC2 instance managed by ECS and ran the following.

```sh
$ docker run --rm -v /tmp:/tmp -e API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx datadog/docker-dd-agent:latest /etc/init.d/datadog-agent flare <caseID>

2019-01-03 12:27:44,472 | ERROR | dd.collector | utils.dockerutil(dockerutil.py:148) | Failed to initialize the docker client. Docker-related features will fail. Will retry 0 time(s). Error: Error while fetching server API version: ('Connection aborted.', error(2, 'No such file or directory'))
...
2019-01-03 12:27:45,807 | INFO | dd.collector | utils.flare(flare.py:161) | Saving all files to /tmp/datadog-agent-2019-01-03-12-27-44.tar.bz2
/tmp/datadog-agent-2019-01-03-12-27-44.tar.bz2 is going to be uploaded to Datadog.
...
```

The `/tmp/datadog-agent-2019-01-03-12-27-44.tar.bz2` file is produced on the EC2 host, so I attached it to an email to support.

After contacting support with the logs included as above, they pointed out that the connection was being aborted due to the API version, and the upshot was: please upgrade your version!

```sh
2019-01-03 12:27:44,472 | ERROR | dd.collector | utils.dockerutil(dockerutil.py:148) | Failed to initialize the docker client. Docker-related features will fail. Will retry 0 time(s). Error: Error while fetching server API version: ('Connection aborted.', error(2, 'No such file or directory'))
```


Thanks, support team!

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190110/20190110112453.png" width="100%">
</div>

That's all.
I hope you find it helpful.
