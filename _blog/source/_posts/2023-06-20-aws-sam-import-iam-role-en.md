---
title: Importing Existing Resources into a SAM Template - IAM Role Edition -
date: 2023-06-20
lang: en
translation_id: aws-sam-import-iam-role
permalink: en/2023/06/20/aws-sam-import-iam-role/
cover: /img/cover/2023-06-20-aws-sam-import-iam-role.svg
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

Previously I imported a CloudWatch LogGroup, but this time it is an example of configuring the import of an IAM Role.

The basic procedure is the same as for the CloudWatch LogGroup, so I will only describe the parts that differ.

## Procedure

### Retrieve the CloudFormation template and add the resource you want to import to template.yml

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

We import the IAM Role used to deliver logs to the log group that manages the API Gateway access logs.

<!-- more -->

### Describe the resource you want to import in import.json

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

Add the resource to be imported to import.json and save it in the same directory as the template.yml from earlier.

```console
$ aws cloudformation create-change-set \
    --stack-name xxx-Bot-Stack \
    --change-set-name import-cwlogs-role \
    --resources-to-import file://import.json \
    --change-set-type IMPORT \
    --template-body file://template.yml \
    --capabilities CAPABILITY_NAMED_IAM
```

The capabilities must be set to CAPABILITY_NAMED_IAM. This is used when you want to give an IAM Role resource a custom name.

Reference: https://docs.aws.amazon.com/ja_jp/serverlessrepo/latest/devguide/acknowledging-application-capabilities.html

After that, proceed with the rest of the steps in the same way.

That's all.
I hope this is helpful.
