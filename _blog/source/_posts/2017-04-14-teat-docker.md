---
layout: post
title: Docker コマンド早見表
date: 2017-04-14
tags:
  - Docker
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170414/20170414222435.png
---

## バージョン

```
docker --version

Docker version 17.04.0-ce, build 4845c56
```

## コンテナ

```
docker ps                     # running コンテナ一覧
docker ps -a                  # 全コンテナ一覧表示
docker start <CONTAINER ID>   # コンテナ起動
docker restart <CONTAINER ID> # コンテナ再起動
docker stop <CONTAINER ID>    # コンテナ終了
docker kill <CONTAINER ID>    # コンテナ強制終了
docker attach <CONTAINER ID>  # コンテナへアタッチ
docker top <CONTAINER ID>     # コンテナプロセスを表示
docker logs -f <CONTAINER ID> # コンテナログ表示
docker inspect <CONTAINER ID> # コンテナ情報表示
docker rm <CONTAINER ID>      # コンテナID指定でコンテナ削除
dockre rm <CONTAINER NAME...> # コンテナ名(複数)指定でコンテナ削除
docker container prune        # 停止コンテナを削除

dockr run -it -h <host name> <IMAGE>[:TAG] <command>  # イメージよりコンテナ起動 command 実施
```

## イメージ

```
docker pull <IMAGE NAME>[:tag]     # イメージダウンロード
docker images ls              # イメージ一覧
docker inspect <IMAGE ID>     # イメージ情報表示
docker rmi <IMAGE ID>         # イメージ削除
```

## イメージ作成

```
docker build -t NAME[:TAG]
docker commit -m "<comment here>" <CONTAINER ID> <IMAGE NAME>[:TAG]
```

## Docker Compose

```
docker-compose up -d    # デタッチモードでイメージよりコンテナ起動
docker-compose ps       # コンテナ一覧表示
docker-compose stop     # docker compose 管理下全てのコンテナ停止
docker-compose start    # docker compose 管理下全てのコンテナ起動
docker-compose rm       # docker compose 管理下全ての停止コンテナ削除
```
