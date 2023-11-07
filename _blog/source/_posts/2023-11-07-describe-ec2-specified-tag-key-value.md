---
title: AWS CLI で EC2 インスタンス名一覧を取得
date: 2023-11-07
category: AWS
---

AWS CLI で EC2 に設定されたタグから特定のキーを指定し、その値をリストするスクリプトです。
以下は Key = Name でその値を取得しています。

EC2 インスタンス名の一覧を取得したい意図です。

```console
aws ec2 describe-instances --query 'Reservations[*].Instances[*].Tags[?Key == `Name`].Value' --output text
```

以上
参考になれば幸いです。
