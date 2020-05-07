---
layout: post
title: ECR にログイン(aws ecr get-login)無しでプッシュする
date: 2018-03-07
tags:
- AWS
- ECR
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180307/20180307231703.png
---

## 概要

Docker version 1.11 で実装された credential-helper を利用し
ECR へのプッシュを安全に簡易的に行う仕組みを実装します。

## Docker ver 1.11 以上にアップグレード

```sh
$ sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
$ sudo sh -c "echo deb https://apt.dockerproject.org/repo ubuntu-trusty main\
> /etc/apt/sources.list.d/docker.list"
$ sudo apt-get purge lxc-docker docker
$ sudo apt-get update
$ sudo apt-get install docker-engine
$ sudo service docker restart
```

## pull Dockerized ECR credential helper

```sh
$ docker pull pottava/amazon-ecr-credential-helper
```

## 認証設定

以下3つの中から1つ利用ください。
EC2 であれば、`1. インスタンスロールで認証` が一番すっきりしていてコードの見通しが良いです。

1. インスタンスロールで認証
2. credential で認証
3. 環境変数で認証

### 1. インスタンスロールで認証

```sh
docker run --rm \
  -e REGISTRY=123457689012.dkr.ecr.us-east-1.amazonaws.com \
  pottava/amazon-ecr-credential-helper
```

```sh
sudo sh -c 'cat << EOF > /usr/bin/docker-credential-ecr-login
#!/bin/sh
SECRET=\$(docker run --rm \\
  -e METHOD=\$1 \\
  -e REGISTRY=\$(cat -) \\
  pottava/amazon-ecr-credential-helper)
echo \$SECRET | grep Secret
EOF'

sudo chmod +x /usr/bin/docker-credential-ecr-login
```

### 2. credential で認証

```sh
docker run --rm \
  -e REGISTRY=123457689012.dkr.ecr.us-east-1.amazonaws.com \
  -v $HOME/.aws/credentials:/root/.aws/credentials \
  pottava/amazon-ecr-credential-helper
```

```sh
sudo sh -c 'cat << EOF > /usr/bin/docker-credential-ecr-login
#!/bin/sh
SECRET=\$(docker run --rm \\
  -e METHOD=\$1 \\
  -e REGISTRY=\$(cat -) \\
  -v $HOME/.aws/credentials:/root/.aws/credentials \\
  pottava/amazon-ecr-credential-helper)
echo \$SECRET | grep Secret
EOF'

sudo chmod +x /usr/bin/docker-credential-ecr-login
```

### 3. 環境変数で認証


* 環境変数セット

```sh
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

```sh
docker run --rm \
  -e REGISTRY=123457689012.dkr.ecr.us-east-1.amazonaws.com \
  -e AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY \
  pottava/amazon-ecr-credential-helper
```

```sh
sudo sh -c 'cat << EOF > /usr/bin/docker-credential-ecr-login
#!/bin/sh
SECRET=\$(docker run --rm \\
  -e METHOD=\$1 \\
  -e REGISTRY=\$(cat -) \\
  -e AWS_ACCESS_KEY_ID \\
  -e AWS_SECRET_ACCESS_KEY \\
  pottava/amazon-ecr-credential-helper)
echo \$SECRET | grep Secret
EOF'
sudo chmod +x /usr/bin/docker-credential-ecr-login
```

## credential 保存設定

```sh
mv $HOME/.docker/config.json $HOME/.docker/config.json.org

cat << EOF > $HOME/.docker/config.json
{
    "credsStore": "ecr-login"
}
EOF
```

これで `aws ecr get-login` から解放されます♪
