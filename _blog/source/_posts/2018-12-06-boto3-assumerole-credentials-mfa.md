---
layout: post
title: boto3 の AssumeRole をしたアカウントスイッチ credentials 利用時の MFA 突破対応
date: 2018-12-06
tags:
  - AWS
  - Python
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20181206/20181206121637.png
---

## 概要

備忘録です。

AssumeRole でのアカウントスイッチで credentials 情報を持っている場合に対応した boto3.Session での認証の仕方です。

MFA 設定してる場合も付けときました。

<!-- more -->

## 実装

```python
# MFA 入力待ち
mfa_TOTP = raw_input("Enter the MFA code: ")

# sts クライアント
client=boto3.client( 'sts' )

# 認証
response = client.assume_role(
    RoleArn='arn:aws:iam::123456789:role/admin_full',
    RoleSessionName='mysession',
    DurationSeconds=3600,
    SerialNumber='arn:aws:iam::987654321:mfa/myaccount',
    TokenCode=mfa_TOTP,
)

# 認証情報
credentials = response['Credentials']

# session に 認証情報付加
session = boto3.Session(profile_name=session_name,
    aws_access_key_id = credentials['AccessKeyId'],
    aws_secret_access_key = credentials['SecretAccessKey'],
    aws_session_token = credentials['SessionToken'],
)

ec2Client = session.client('ec2', region_name='ap-north-east1')
resources = ec2.describe_instances()
```

boto3.Session に sts で AssumeRole で得た credentials 情報を渡してます。

以上です。
