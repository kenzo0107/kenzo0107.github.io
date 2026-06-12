---
layout: post
title: Handling MFA When Using Account-Switch Credentials Obtained via boto3 AssumeRole
date: 2018-12-06
categories:
  - [AWS]
  - [Python]
lang: en
translation_id: boto3-assumerole-credentials-mfa
permalink: en/2018/12/06/boto3-assumerole-credentials-mfa/
tags:
  - AWS
  - Python
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20181206/20181206121637.png
---

## Overview

Just a memo for myself.

This shows how to authenticate with a boto3.Session when you hold the credentials obtained from an account switch via AssumeRole.

I've also included the case where MFA is enabled.

<!-- more -->

## Implementation

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

Here, the credentials obtained from AssumeRole via STS are passed to boto3.Session.

That's all.
