---
layout: post
title: 'Sequel: Pushing to ECR Without Logging In (aws ecr get-login)'
date: 2018-05-10
lang: en
translation_id: ecr-nologin-push
permalink: en/2018/05/10/ecr-nologin-push/
cover: /img/cover/2018-05-10-ecr-nologin-push.svg
tags:
- AWS
- ECR
---

## Overview

Last time I set things up so that I could push a Docker image to ECR without running the authentication command beforehand.

[Pushing to ECR Without Logging In (aws ecr get-login)](http://kenzo0107.hatenablog.com/entry/2018/03/07/230736)


However,
the setup is a bit of a hassle, which makes it inconvenient when you want to quickly write a one-liner in CircleCI, AWS CodeBuild, and the like.

## Solution

By using a profile configured with `awscli profile` together with `ecs-cli`, authentication is handled for you.

```
ecs-cli push <image> --aws-profile <profile> --region <region>
```

## Setup Steps

```sh
aws configure set --profile hogehoge aws_access_key_id $ACCESS_KEY_ID
aws configure set --profile hogehoge aws_secret_access_key $SECRET_ACCESS_KEY
aws configure set --profile hogehoge region ap-northeast-1
```

```sh
ecs-cli push 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/stg-mogemoge-rails:latest \
	--aws-profile hogehoge \
	--region ap-northeast-1
```

That's it. Now you can push to ECR without using `aws ecr get-login`. ♪
