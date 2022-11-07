---
layout: post
title: Vagrant (Ubuntu) に Docker, Docker Compose インストール
date: 2017-04-13
tags:
  - Docker
  - Vagrant
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170413/20170413222957.png
---

## 概要

開発環境構築用に作成した、
Vagrant (Ubuntu) に Docker と Docker Compose をインストールする手順をまとめました。

## Vagrantfile 作成

かなりシンプルにしてます。

- Vagrantfile

```ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.network "private_network", ip: "192.168.35.101"
end
```

vagrant provision で docker compose をインストールすることも可能ですが
vagrant ならではの provision だと他環境で利用できない為、OS 上でインストールする方針です。

## VM 起動

```
MacOS%$ vagrant up
...
しばし待つ
...

MacOS%$ vagrant ssh

// ssh ログイン成功
vagrant%$
```

## Vagrant Ubuntu 環境情報確認

```
vagrant%$ lsb_release -a

No LSB modules are available.
Distributor ID: Ubuntu
Description:    Ubuntu 14.04.5 LTS
Release:        14.04
Codename:       trusty
```

## カーネルバージョン確認

```
vagrant%$ uname -r
3.13.0-116-generic
```

カーネルバージョンが 3.10 より低いとバグを引き起こす危険性があるので NG。
別のカーネルバージョンの高い box を使用しましょう。

## 古いバージョンをアンインストール

```
vagrant%$ sudo apt-get remove docker docker-engine
```

## extra パッケージインストール

Docker に [aufs](http://docs.docker.jp/engine/userguide/storagedriver/aufs-driver.html) ストレージを使用許可する為です。

```
vagrant%$ sudo apt-get update
vagrant%$ sudo apt-get -y install \
    wget \
    linux-image-extra-$(uname -r) \
    linux-image-extra-virtual
```

## Docker インストール

```
// Docker インストール
vagrant%$ wget -qO- https://get.docker.com/ | sh

// Docker バージョン確認
vagrant%$ docker --version
Docker version 17.04.0-ce, build 4845c56

// vagrant ユーザを docker グループに追加 (一旦ログアウトしログインし直すと有効になることを確認できます)
vagrant%$ sudo usermod -aG docker vagrant
```

## Docker Compose インストール

```
vagrant%$ curl -L "https://github.com/docker/compose/releases/download/1.12.0/docker-compose-$(uname -s)-$(uname -m)" >  ~/docker-compose

// 実行権限付与
vagrant%$ chmod +x ~/docker-compose

// 実行パス移動
vagrant%$ sudo mv docker-compose /usr/bin/

// Docker Compose バージョン確認
vagrant%$ docker-compose --version
docker-compose version 1.12.0, build b31ff33
```

## 一度ログアウトし再度ログイン

```
vagrant%$ exit
MacOS%$ vagrant ssh
vagrant%$
```

## メモリとスワップ利用量の調整

Docker を使用していない時にメモリのオーバーヘッドとパフォーマンス劣化を低減させる様、
GRUB (GRand Unified Bootloader: グラブ or ジーラブ) に設定する必要があります。

- grub 設定

```
vagrant%$ sudo vi /etc/default/grub

# GRUB_CMDLINE_LINUX=""
GRUB_CMDLINE_LINUX="cgroup_enable=memory swapaccount=1"
```

- GRUB (GRand Unified Bootloader: グラブ or ジーラブ) 更新

```
vagrant%$ sudo update-grub

// 念の為、再起動
vagrant%$ sudo reboot
```

以上で準備完了です ♪

## 早速試してみる

簡単なチュートリアルとして nginx コンテナを立ててみます。

```
vagrant%$ docker run --rm -p 80:80 nginx:mainline-alpine

Unable to find image 'nginx:mainline-alpine' locally
mainline-alpine: Pulling from library/nginx
709515475419: Already exists
4b21d71b440a: Pull complete
c92260fe6357: Pull complete
ed383a1b82df: Pull complete
Digest: sha256:5aadb68304a38a8e2719605e4e180413f390cd6647602bee9bdedd59753c3590
Status: Downloaded newer image for nginx:mainline-alpine
```

## ブラウザアクセス

ローカルの Mac からブラウザでアクセス

[http://192.168.35.101](http://192.168.35.101)

※192.168.35.101 ... Vagrant で指定した private ip

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170413/20170413224153.png" width="100%">
</div>

問題なく Welcome ページが表示されました。

先程のログに以下のようにアクセスログが出力されるのがわかります。

```
192.168.35.1 - - [13/Apr/2017:10:45:46 +0000] "GET / HTTP/1.1" 304 0 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36" "-"
```

MacOS → Vagrant → Docker
とアクセスできるようになりました ♪

## 追記

今回作成した Box を Vagrant Cloud に置きました。

https://atlas.hashicorp.com/kenzo0107/boxes/ubuntu14.04.5LTS-docker-dockercompose/

こちら設定を元にこれから様々な環境構築を記載していきたいと思います ♪

## 参照

- [AUFS ストレージ・ドライバの使用](http://docs.docker.jp/engine/userguide/storagedriver/aufs-driver.html)
- [Docker run リファレンス](http://docs.docker.jp/engine/reference/run.html)
