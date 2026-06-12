---
layout: post
title: Docker Command Cheat Sheet
date: 2017-04-14
category: Infrastructure
lang: en
translation_id: teat-docker
permalink: en/2017/04/14/teat-docker/
tags:
  - Docker
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170414/20170414222435.png
---

## Version

```
docker --version

Docker version 17.04.0-ce, build 4845c56
```

## Containers

```
docker ps                     # List running containers
docker ps -a                  # List all containers
docker start <CONTAINER ID>   # Start a container
docker restart <CONTAINER ID> # Restart a container
docker stop <CONTAINER ID>    # Stop a container
docker kill <CONTAINER ID>    # Force-kill a container
docker attach <CONTAINER ID>  # Attach to a container
docker top <CONTAINER ID>     # Show container processes
docker logs -f <CONTAINER ID> # Show container logs
docker inspect <CONTAINER ID> # Show container details
docker rm <CONTAINER ID>      # Remove a container by container ID
dockre rm <CONTAINER NAME...> # Remove containers by container name(s)
docker container prune        # Remove stopped containers

dockr run -it -h <host name> <IMAGE>[:TAG] <command>  # Start a container from an image and run a command
```

## Images

```
docker pull <IMAGE NAME>[:tag]     # Download an image
docker images ls              # List images
docker inspect <IMAGE ID>     # Show image details
docker rmi <IMAGE ID>         # Remove an image
```

## Building Images

```
docker build -t NAME[:TAG]
docker commit -m "<comment here>" <CONTAINER ID> <IMAGE NAME>[:TAG]
```

## Docker Compose

```
docker-compose up -d    # Start containers from images in detached mode
docker-compose ps       # List containers
docker-compose stop     # Stop all containers managed by docker compose
docker-compose start    # Start all containers managed by docker compose
docker-compose rm       # Remove all stopped containers managed by docker compose
```
