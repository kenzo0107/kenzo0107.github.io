---
title: How to Import Existing Resources into a SAM Template - CloudWatch Logs Edition -
date: 2023-06-07
lang: en
translation_id: aws-sam-import-resource
permalink: en/2023/06/07/aws-sam-import-resource/
cover: https://i.imgur.com/nieeIsl.png
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## Procedure

### Retrieve the CloudFormation Template

![](https://i.imgur.com/nieeIsl.png)

For an already deployed SAM project, a Stack has been created in CloudFormation.
From its `Template` tab, save the template contents locally as `template.yml`.
You can save it anywhere you like.

### Add the Resource You Want to Import to template.yml

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

This time we will import the log group used for managing API Gateway access logs.
We set `DeletionPolicy: Retain` so that the resource is not created but instead imported into the Stack.

<!-- more -->

### Describe the Resource to Import in import.json

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

Add the resource to be imported into import.json and
save it in the same directory as the earlier template.yml.

### Create a Change Set

```bash
$ aws cloudformation create-change-set \
    --stack-name xxx-Bot-Stack \
    --change-set-name import-apigateway-accesslog-loggroup \
    --resources-to-import file://import.json \
    --change-set-type IMPORT \
    --template-body file://template.yml \
    --capabilities CAPABILITY_IAM
```

* The import is not actually executed at the point this command is run.

After running the command, you are good to go if a set has been added to `Change sets` as shown below.

![](https://i.imgur.com/5JVMX2A.png)

The Name of the change set is a link, so click it.

### Execute the Change Set (Run the Import)

![](https://i.imgur.com/EbPH7XZ.png)

Click the `Execute change set` button in the top right to run the import into the Stack.

The import is complete once the status reaches `IMPORT_COMPLETE`.
![](https://i.imgur.com/e3pu5ih.png)

#### Tags Are Added to the Imported Resource

![](https://i.imgur.com/3BQeLUv.png)

You can confirm that a tag indicating the resource is managed by the Stack has been added to the resource imported into the Stack.

### Update the SAM Project template.yml

Define the imported resource in the yml file referenced at deploy time, which is different from the template.yml prepared for the import.
Here, `DeletionPolicy: Retain` is not needed.

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

Because the template file managed by the SAM project has a difference in `DeletionPolicy: Retain`, a change diff appears.

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

After deploying, you can confirm that the diff disappears when you try to deploy again.

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

With this, we confirmed that the import completed without issues.

## Bonus: Removing a SAM Resource from Management (the Reverse of Import)

Save Stack > Template as template.yml, delete the target resource, and run the following command.

This creates a Change set that removes the imported log group.

```
aws cloudformation create-change-set \
    --stack-name xxx-Bot-Stack \
    --change-set-name remove-apigateway-loggroup \
    --change-set-type UPDATE \
    --template-body file://template.yml \
    --capabilities CAPABILITY_IAM
```

You can delete it by running Execute change set in the console.

That's all.
I hope you find this helpful.
