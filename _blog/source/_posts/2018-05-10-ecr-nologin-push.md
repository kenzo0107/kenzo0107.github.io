---
layout: post
title: 続　ECR にログイン(aws ecr get-login)無しでプッシュする
date: 2018-05-10
tags:
- AWS
- ECR
---

## 概要

前回 ECR への Docker イメージをプッシュする際の認証コマンドを実行せずにプッシュできる様にしました。

[ECR にログイン(aws ecr get-login)無しでプッシュする](http://kenzo0107.hatenablog.com/entry/2018/03/07/230736)


ですが、
設定が手間というのがあり、CircleCI, AWS CodeBuild 等でワンライナーでささっと書きたいときには不便です。

## 解決

`awscli profile` で設定した profile を利用し ecs-cli を利用することで認証をよろしくやってくれます。

```
ecs-cli push <image> --aws-profile <profile> --region <region>
```

## 設定 Step

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

以上で `aws ecr get-login` を使用せず、ECR へプッシュができる様になりました♪
