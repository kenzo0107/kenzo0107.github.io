---
title: SAM テンプレートに既存リソースをインポートする手順
date: 2023-06-07
category: AWS
---

## 手順

### CloudFormation のテンプレート取得

![](https://i.imgur.com/nieeIsl.png)

既にデプロイ済みの SAM プロジェクトは CloudFormation に Stack が作成されています。
その `Template` タグで template の内容をローカル環境で `template.yml` で保存しましょう。
保存先はどこでも良いです。

### template.yml にインポートしたいリソースを追記

```yaml
...
Resources:
  ...

  # インポートしたいリソースを追記
  # API Gateway の アクセスログ管理用ロググループ
  ApiGatewayAccessLogGroup:
    Type: AWS::Logs::LogGroup
    # NOTE: リソースを作成せず、Stack にインポートする為の設定
    # see: https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/aws-attribute-deletionpolicy.html
    DeletionPolicy: Retain
    Properties:
      LogGroupName: /aws/apigateway/xxx-Bot-Stack
```

今回は API Gateway のアクセスログ管理用ロググループをインポートします。
`DeletionPolicy: Retain` としているのは、リソースを作成せず、Stack にインポートします。

### import.json にインポートしたいリソースを記載

```import.json
[
    {
        "ResourceType": "AWS::Logs::LogGroup",
        "LogicalResourceId": "ApiGatewayAccessLogGroup",
        "ResourceIdentifier": {
            "LogGroupName":"/aws/apigateway/xxx-Bot-Stack"
        }
    }
]
```

import.json にインポート対象のリソースを追加し
先程の template.yml と同じディレクトリに保存します。

### Change sets を作成する

```bash
$ aws cloudformation create-change-set \
    --stack-name xxx-Bot-Stack \
    --change-set-name import-apigateway-accesslog-loggroup \
    --resources-to-import file://import.txt \
    --change-set-type IMPORT \
    --template-body file://template.yml \
    --capabilities CAPABILITY_IAM
```

※ このコマンド実行した時点ではインポートは実行されません。

コマンド実行後、以下のように `Change sets` にセットが追加されていれば OK です。

![](https://i.imgur.com/5JVMX2A.png)

Change sets の Name がリンクになっているのでクリックします。

### change set を実行 (インポート実行)

![](https://i.imgur.com/EbPH7XZ.png)

右上の `Execute change set` ボタンをクリックし Stack へのインポート処理を実行します。

ステータス= `IMPORT_COMPLETE` でインポート完了となります。
![](https://i.imgur.com/e3pu5ih.png)

#### インポートしたリソースにタグが追加される

![](https://i.imgur.com/3BQeLUv.png)

Stack にインポートしたリソースに Stack で管理されている旨のタグが追加されていることが確認できます。

### SAM プロジェクト template.yml 更新

インポート用に用意した template.yml とは異なるデプロイ時に参照する yml ファイルにインポートしたリソースを定義します。
ここでは `DeletionPolicy: Retain` は不要です。

```yaml
Resources:
  ...
  # 追記
  ApiGatewayAccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/apigateway/xxx-Bot-Stack
      RetentionInDays: 14
```

SAM プロジェクトで管理するテンプレートファイルで `DeletionPolicy: Retain` の差分がある為、変更の差分が出ます。

```bash
$ sam deploy -t ${TEMPLATE_FILE} \
		--stack-name xxx-Bot-Stack \
		--s3-prefix xxx-Bot-Stack \
		--s3-bucket yyy \
		--capabilities CAPABILITY_IAM \
		--region ap-northeast-1 \
		--no-fail-on-empty-changeset \
		--no-progressbar

Initiating deployment
=====================

File with same data already exists at xxx-Bot-Stack/nnn.template, skipping upload


Waiting for changeset to be created..

CloudFormation stack changeset
---------------------------------------------------------------------------------------------------------------------------------
Operation                        LogicalResourceId                ResourceType                     Replacement
---------------------------------------------------------------------------------------------------------------------------------
* Modify                         ApiGatewayAccessLogGroup         AWS::Logs::LogGroup              False
---------------------------------------------------------------------------------------------------------------------------------


Changeset created successfully. arn:aws:cloudformation:ap-northeast-1:123456789012:changeSet/samcli-deploy123/zzz


2023-06-07 12:22:16 - Waiting for stack create/update to complete

CloudFormation events from stack operations (refresh every 5.0 seconds)
---------------------------------------------------------------------------------------------------------------------------------
ResourceStatus                   ResourceType                     LogicalResourceId                ResourceStatusReason
---------------------------------------------------------------------------------------------------------------------------------
UPDATE_COMPLETE                  AWS::Logs::LogGroup              ApiGatewayAccessLogGroup         -
UPDATE_COMPLETE_CLEANUP_IN_PRO   AWS::CloudFormation::Stack       xxx-Bot-Stack              -
GRESS
UPDATE_COMPLETE                  AWS::CloudFormation::Stack       xxx-Bot-Stack              -
---------------------------------------------------------------------------------------------------------------------------------

CloudFormation outputs from deployed stack
------------------------------------------------------------------------------------------------------------------------------------
Outputs
------------------------------------------------------------------------------------------------------------------------------------
Key                 SlackMessageApi
Description         -
Value               https://yyy.execute-api.ap-northeast-1.amazonaws.com/Prod/message/
------------------------------------------------------------------------------------------------------------------------------------


Successfully created/updated stack - xxx-Bot-Stack in ap-northeast-1
```

デプロイ後、再度デプロイしようとすると差分がなくなることを確認できました。

```bash
$ sam deploy -t ${TEMPLATE_FILE} \
		--stack-name xxx-Bot-Stack \
		--s3-prefix xxx-Bot-Stack \
		--s3-bucket yyy \
		--capabilities CAPABILITY_IAM \
		--region ap-northeast-1 \
		--no-fail-on-empty-changeset \
		--no-progressbar

File with same data already exists at xxx-Bot-Stack/7d47ca74f4c587c742cd0df1f7252ecd.template, skipping upload


Waiting for changeset to be created..

No changes to deploy. Stack xxx-Bot-Stack is up to date
```

これにてインポートが問題なくできたことを確認できました。

## おまけ: SAM リソースを管理除外する (import の逆)

Stack > Template を template.yml で保存し、対象リソースを削除し以下コマンドを実行します。

インポートしたロググループを除外する Change set を作成します。

```
aws cloudformation create-change-set \
    --stack-name xxx-Bot-Stack \
    --change-set-name remove-apigateway-loggroup \
    --change-set-type UPDATE \
    --template-body file://template.yml \
    --capabilities CAPABILITY_IAM
```

コンソール上で Execute change set を実行し削除できます。

以上
参考になれば幸いです。
