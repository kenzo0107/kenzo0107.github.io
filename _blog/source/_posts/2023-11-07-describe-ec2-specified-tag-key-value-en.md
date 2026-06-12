---
title: List EC2 Instance Names with the AWS CLI
date: 2023-11-07
lang: en
translation_id: describe-ec2-specified-tag-key-value
permalink: en/2023/11/07/describe-ec2-specified-tag-key-value/
cover: /img/cover/2023-11-07-describe-ec2-specified-tag-key-value.svg
category: AWS
---

This is a script that uses the AWS CLI to specify a particular key from the tags set on EC2 instances and list its values.
The example below retrieves the values where Key = Name.

The intent is to get a list of EC2 instance names.

```console
aws ec2 describe-instances --query 'Reservations[*].Instances[*].Tags[?Key == `Name`].Value' --output text
```

That's all.
I hope you find this helpful.
