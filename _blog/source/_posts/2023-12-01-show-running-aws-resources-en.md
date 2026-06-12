---
title: Listing Running AWS Resources with the AWS CLI
date: 2023-12-01
lang: en
translation_id: show-running-aws-resources
permalink: en/2023/12/01/show-running-aws-resources/
cover: /img/cover/2023-12-01-show-running-aws-resources.svg
category: AWS
---

Just a quick memo.

I often use this when I want to build a list of running resources across multiple AWS accounts.

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

    # With aws rds describe-db-clusters you can't get instance information when clusters aren't being used
    aws rds --profile tmp describe-db-instances \
        | jq -r ".DBInstances[] | select(.DBInstanceStatus==\"available\") | \"$profile,$account_id,\"+ .Engine +\",\"+ .DBInstanceClass +\",1,\"+ .DBInstanceIdentifier"

    aws elasticache --profile tmp describe-cache-clusters \
        | jq -r ".CacheClusters[] | \"$profile,$account_id,\"+ .Engine +\",\"+ .CacheNodeType +\",\"+ (.NumCacheNodes|tostring) +\",\"+ .CacheClusterId"

    aws redshift --profile tmp describe-clusters \
        | jq -r ".Clusters[] | select(.ClusterStatus==\"available\") | \"$profile,$account_id,redshift,\"+ .NodeType +\",\"+ (.NumberOfNodes|tostring) +\",\"+ .ClusterIdentifier"
done
```
