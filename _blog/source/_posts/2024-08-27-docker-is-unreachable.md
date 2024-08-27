---
title: 'Error: Docker is unreachable. Docker needs to be running to build inside a container.'
date: 2024-08-27
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

`sam build --use-container` でビルド実行した際に以下エラーが発生しました。

```
Error: Docker is unreachable. Docker needs to be running to build inside a container.
```

<!-- more -->

## DOCKER_HOST を指定する

現在の Context を確認します。

```console
$ docker info | grep 'Context:'

 Context:    desktop-linux
```

エンドポイントを確認します。

```console
$ docker context ls | grep desktop-linux

desktop-linux *     moby                Docker Desktop                            unix:///Users/kenzo.tanaka/.docker/run/docker.sock
```

DOCKER_HOST を指定し再度実行することでエラーを回避できました。

```console
$ env SAM_CLI_TELEMETRY=0 \
    DOCKER_HOST=unix:///Users/kenzo.tanaka/.docker/run/docker.sock \
    sam build --use-container --cached --parallel
```

以上
参考まで
