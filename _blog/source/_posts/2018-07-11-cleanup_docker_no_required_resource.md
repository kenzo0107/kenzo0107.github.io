---
layout: post
title: Docker 不要リソースお掃除 compose
date: 2018-07-11
tags:
  - Docker
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180711/20180711135636.png
---

## 概要

ECS EC2 で一部コンテナが 起動開始 → 失敗 → 起動開始 → 失敗 を繰り返し
サーバが容量不足 `no space left` に陥る事象がありました。

その時の対応をまとめました。

<!-- more -->

## docker 不要リソース削除

docker 不要リソース削除処理コマンドは以下の様なものを実行します。

```sh
// コンテナ削除
$ docker ps -aq | xargs docker rm

// イメージ削除
$ docker images -aq | xargs docker rmi

// タグ無しイメージ一括削除
$ docker volume ls -qf dangling=true | xargs docker volume rm
```

dangling ... ぶら下がる、 ぶらぶら揺れる

## Spotify のお掃除イメージを使う

```sh
$ docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v /etc:/etc spotify/docker-gc
$ docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/docker:/var/lib/docker martin/docker-cleanup-volumes
```

## docker-compose.yml にしてみる

docker-compose.yml フォーマットにすることでイメージ管理が容易になります。

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

## ECS EC2 で one-off Container 実行してお掃除

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

初めて利用する Public Container に対しての脆弱性をチェックする仕組みを導入する必要があるかと思います。
この辺りまとめてまた執筆したいと思います。
