---
layout: post
title: Boot2DockerでMacOSXローカル環境に開発環境構築
date: 2015-06-28
---

# DockerEngine環境構築

## 開発環境

* MacOSX Yosemite 10.3.3
* VirtualBox 4.3.28
* Vagrant 1.7.2

---

Dockerを利用するには以下が必要

#### Docker Engine
* Dockerクライアント
    - docker コマンド実行
* Dockerサーバ
    - Dockerコンテナ実行


#### Docker Engine 構成

* DockerサーバとクライアントはRESTfulなHTTPSで通信する

```
                        +---------+ +----------+
                        |Docker   | |Docker    |
                        |Container| |Container |
                        +---------+ +----------+
                              ↑         ↑
+-----------------+       +---------------+
| Docker Client   | ----> | Docker Server |
|(docker Command) |       +---------------+
+-----------------+
```


上記を構築するために以下をインストールする

#### Boot2Docker

* DockerクライアントとDockerサーバをまとめてセットアップできるソフトウェア

Boot2Docker構成

* Docker Client
* Linux VM
* Docker Server

```
|               | Docker Server |
|               | Linux VM      |
| Docker Client | VirtualBox    |
+-------------------------------+
|      Mac OSX or Windows       |
```

## 導入手順

##### Boot2Docker 公式サイト : <http://boot2docker.io/> より 「MacOSXボタン」クリック

![Boot2Dockerインストール](http://i.imgur.com/vbJj8bW.png)

##### Boot2Docker パッケージインストール

![Boot2Dockerインストーラ](http://i.imgur.com/wJAXyIF.png)

##### インストーラを実行
![Imgur](http://i.imgur.com/GHSOGMG.png)

![Imgur](http://i.imgur.com/1BhLI3z.png)


##### Terminal等で以下実行

* Linux VM作成

```
$ boot2docker init
```

* Linux VM起動

```
$ boot2docker start

Waiting for VM and Docker daemon to start...
...........................ooooooooooooooooo
Started.
Writing /Users/kenzo/.boot2docker/certs/boot2docker-vm/ca.pem
Writing /Users/kenzo/.boot2docker/certs/boot2docker-vm/cert.pem
Writing /Users/kenzo/.boot2docker/certs/boot2docker-vm/key.pem

To connect the Docker client to the Docker daemon, please set:
    export DOCKER_HOST=tcp://192.168.59.103:2376
    export DOCKER_CERT_PATH=/Users/kenzo/.boot2docker/certs/boot2docker-vm
    export DOCKER_TLS_VERIFY=1
```

* Linux VMステータス確認

```
$ boot2docker status
running
```

* 環境変数の設定

`boot2docker start` にて起動時にexport設定を実行する

```
$ export DOCKER_HOST=tcp://192.168.59.103:2376
$ export DOCKER_CERT_PATH=/Users/kenzo/.boot2docker/certs/boot2docker-vm
$ export DOCKER_TLS_VERIFY=1
```

* Docker Engine全体の環境設定確認

```
$ docker info

Containers: 0
Images: 0
Storage Driver: aufs
 Root Dir: /mnt/sda1/var/lib/docker/aufs
 Backing Filesystem: extfs
 Dirs: 0
 Dirperm1 Supported: true
Execution Driver: native-0.2
Logging Driver: json-file
Kernel Version: 4.0.5-boot2docker
Operating System: Boot2Docker 1.7.0 (TCL 6.3); master : 7960f90 - Thu Jun 18 18:31:45 UTC 2015
CPUs: 4
Total Memory: 1.955 GiB
Name: boot2docker
ID: G776:YBRC:OUGN:T7KF:TM43:6BTU:2PVW:HGWW:3CXO:YLCF:23ON:EJVE
Debug mode (server): true
File Descriptors: 9
Goroutines: 15
System Time: 2015-06-28T12:07:33.59750188Z
EventsListeners: 0
Init SHA1:
Init Path: /usr/local/bin/docker
Docker Root Dir: /mnt/sda1/var/lib/docker
```

### 注意点

`docker info`で確認できる `Storage Driver`で`aufs`となっている場合

Dockerコンテナhttpdインストールができない。

利用するStorage Driverを事前に確認する必要がある。


## DockerFileベストプラクティスまとめ

https://docs.docker.com/articles/dockerfile_best-practices/
