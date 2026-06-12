---
layout: post
title: Cleaning Up Unused Docker Resources with Compose
date: 2018-07-11
lang: en
translation_id: cleanup_docker_no_required_resource
permalink: en/2018/07/11/cleanup_docker_no_required_resource/
tags:
  - Docker
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180711/20180711135636.png
---

## Overview

On ECS EC2, I ran into a situation where some containers kept repeating a cycle of start → fail → start → fail,
which eventually caused the server to run out of capacity and hit `no space left`.

This post summarizes how I handled it at the time.

<!-- more -->

## Deleting Unused Docker Resources

To delete unused Docker resources, you can run commands like the following.

```sh
// コンテナ削除
$ docker ps -aq | xargs docker rm

// イメージ削除
$ docker images -aq | xargs docker rmi

// タグ無しイメージ一括削除
$ docker volume ls -qf dangling=true | xargs docker volume rm
```

dangling ... hanging down, dangling loosely

## Using Spotify's Cleanup Images

```sh
$ docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v /etc:/etc spotify/docker-gc
$ docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/docker:/var/lib/docker martin/docker-cleanup-volumes
```

## Turning It into a docker-compose.yml

Putting this into docker-compose.yml format makes image management easier.

```docker-compose.yml
version: '2'

services:
  docker-gc:
    image: spotify/docker-gc
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /etc:/etc

  docker-cleanup-volumes:
    image: martin/docker-cleanup-volumes
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/lib/docker:/var/lib/docker

```

## Running a One-Off Container on ECS EC2 to Clean Up

```sh
ecs-cli compose \
        --debug \
        --project-name <project name> \
        --file docker-compose.yml \
    run \
        --cluster <cluster name> \
        --region ap-northeast-1 \
        --aws-profile <profile>
```

## ToDo

I think we need to introduce a mechanism to scan for vulnerabilities in public containers we use for the first time.
I'd like to write up more on this topic in a future post.
