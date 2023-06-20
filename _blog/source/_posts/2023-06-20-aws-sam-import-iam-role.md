---
title: SAM テンプレートに既存リソースをインポートする手順 - IAM Role 編 -
date: 2023-06-20
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

{% linkPreview https://kenzo0107.github.io/2023/06/06/2023-06-07-aws-sam-import-resource _blank %}

以前は CloudWatch LogGroup をインポートしましたが
今回は IAM Role をインポートの設定例です。

基本手順は CloudWatch LogGroup と同様ですが、
異なる部分だけ記載します。

## 手順

### CloudFormation のテンプレート取得し template.yml にインポートしたいリソースを追記

```yaml
...
Resources:
  ...

  CWLogRole:
    DeletionPolicy: Retain
    Type: AWS::IAM::Role
    Properties:
      RoleName: xxx-Bot-Stack
      AssumeRolePolicyDocument:
        Version: 2012-10-17
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      Description: Allows API Gateway to push logs to CloudWatch Logs.
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
```

API Gateway のアクセスログ管理用ロググループへログを配信する IAM Role をインポートします。

<!-- more -->

### import.json にインポートしたいリソースを記載

```import.json
[
    {
        "ResourceType": "AWS::IAM::Role",
        "LogicalResourceId": "CWLogRole",
        "ResourceIdentifier": {
            "RoleName":"xxx-Bot-Stack"
        }
    }
]
```

import.json にインポート対象のリソースを追加し
先程の template.yml と同じディレクトリに保存します。

```console
$ aws cloudformation create-change-set \
    --stack-name xxx-Bot-Stack \
    --change-set-name import-cwlogs-role \
    --resources-to-import file://import.json \
    --change-set-type IMPORT \
    --template-body file://template.yml \
    --capabilities CAPABILITY_NAMED_IAM
```

capabilities は CAPABILITY_NAMED_IAM にする必要があります。
IAM Role リソースに独自の命名をしたい場合に利用します。

参考: https://docs.aws.amazon.com/ja_jp/serverlessrepo/latest/devguide/acknowledging-application-capabilities.html

あとは同様に手順を進めます。

以上
参考になれば幸いです。
