---
layout: post
title: Push to ECR Without Logging In (aws ecr get-login)
date: 2018-03-07
lang: en
translation_id: push-to-ecr-without-login-ecr
permalink: en/2018/03/07/push-to-ecr-without-login-ecr/
tags:
  - AWS
  - ECR
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180307/20180307231703.png
---

## Overview

Using the credential-helper introduced in Docker version 1.11, we will set up a mechanism
to push to ECR safely and easily.

## Upgrade to Docker ver 1.11 or higher

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

## Authentication Setup

Choose one of the following three options.
For EC2, `1. Authenticate with an instance role` is the cleanest and keeps the code easy to follow.

1. Authenticate with an instance role
2. Authenticate with credentials
3. Authenticate with environment variables

### 1. Authenticate with an instance role

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

### 2. Authenticate with credentials

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

### 3. Authenticate with environment variables

- Set the environment variables

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

## Credential Storage Setup

```sh
mv $HOME/.docker/config.json $HOME/.docker/config.json.org

cat << EOF > $HOME/.docker/config.json
{
    "credsStore": "ecr-login"
}
EOF
```

With this, you are freed from `aws ecr get-login` ♪
