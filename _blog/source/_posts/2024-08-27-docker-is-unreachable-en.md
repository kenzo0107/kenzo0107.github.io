---
title: 'Error: Docker is unreachable. Docker needs to be running to build inside a container.'
date: 2024-08-27
lang: en
translation_id: docker-is-unreachable
permalink: en/2024/08/27/docker-is-unreachable/
cover: /img/cover/2024-08-27-docker-is-unreachable.svg
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

When I ran a build with `sam build --use-container`, the following error occurred.

```
Error: Docker is unreachable. Docker needs to be running to build inside a container.
```

<!-- more -->

## Specifying DOCKER_HOST

Check the current context.

```console
$ docker info | grep 'Context:'

 Context:    desktop-linux
```

Check the endpoint.

```console
$ docker context ls | grep desktop-linux

desktop-linux *     moby                Docker Desktop                            unix:///Users/kenzo.tanaka/.docker/run/docker.sock
```

By specifying DOCKER_HOST and running the command again, I was able to avoid the error.

```console
$ env SAM_CLI_TELEMETRY=0 \
    DOCKER_HOST=unix:///Users/kenzo.tanaka/.docker/run/docker.sock \
    sam build --use-container --cached --parallel
```

That's all.
For your reference.
