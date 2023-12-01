---
title: aws-cli で AWS 起動中のリソース一覧取得する
date: 2023-12-01
category: AWS
---

備忘録です。

複数 AWS アカウントで起動中のリソース一覧作りたい時によく利用しています。

```bash
#!/bin/bash

profiles=(
  <profile names in ~/.aws/credentials>
)

for profile in ${profiles[@]}; do
    awsume $profile --session-name "kenzo.tanaka" --output-profile tmp
    account_id=$(aws sts get-caller-identity --profile tmp --query 'Account' --output text)

    aws ec2 --profile tmp describe-instances --filters "Name=instance-state-name,Values=running" \
        | jq -r ".Reservations[].Instances[] | \"$profile,$account_id,ec2,\"+ .InstanceType +\",1,\"+ (.Tags[]|select(.Key == \"Name\").Value)"

    # aws rds describe-db-clusters だと cluster を利用していない場合に instance 情報が取得できない
    aws rds --profile tmp describe-db-instances \
        | jq -r ".DBInstances[] | select(.DBInstanceStatus==\"available\") | \"$profile,$account_id,\"+ .Engine +\",\"+ .DBInstanceClass +\",1,\"+ .DBInstanceIdentifier"

    aws elasticache --profile tmp describe-cache-clusters \
        | jq -r ".CacheClusters[] | \"$profile,$account_id,\"+ .Engine +\",\"+ .CacheNodeType +\",\"+ (.NumCacheNodes|tostring) +\",\"+ .CacheClusterId"

    aws redshift --profile tmp describe-clusters \
        | jq -r ".Clusters[] | select(.ClusterStatus==\"available\") | \"$profile,$account_id,redshift,\"+ .NodeType +\",\"+ (.NumberOfNodes|tostring) +\",\"+ .ClusterIdentifier"
done
```
