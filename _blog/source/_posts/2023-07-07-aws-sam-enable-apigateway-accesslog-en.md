---
title: Enabling API Gateway Access Logs Managed by a SAM Project
date: 2023-07-07
lang: en
translation_id: aws-sam-enable-apigateway-accesslog
permalink: en/2023/07/07/aws-sam-enable-apigateway-accesslog/
cover: /img/cover/2023-07-07-aws-sam-enable-apigateway-accesslog.svg
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## Overview

This is a story about the trouble I ran into when enabling access logs for an API Gateway managed by a SAM project, in order to comply with the AWS Config rule `api-gw-execution-logging-enabled`.

For an API Gateway created with `Events.*.Type = Api`, you cannot configure access log enablement within SAM.

I investigated how to enable access logs for the API Gateway.

<!-- more -->

### SAM template.yml configuration

```yaml
Resources:
  Function:
    Type: AWS::Serverless::Function
    Properties:
      ...
      Events:
        Message:
          Type: Api # API Gateway generated with this setting cannot have access logs enabled
          Properties:
            Path: /message
            Method: post
```

## Conclusion

As of 2023-07-07, the only option is to create a new API Gateway and switch over to it.
In that case, unless you use a custom domain, the API Gateway domain will change.

By separately creating an API Gateway such as `Type: AWS::Serverless::Api` and referencing it via `RestApiId`, I was able to enable access logs and X-Ray Tracing.

```yaml
Resources:
  Lambda:
    Type: AWS::Serverless::Function
    Properties:
      Events:
        foo:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /message
            Method: post

  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      StageName: Prod
      TracingEnabled: true # Enable X-Ray Tracing
      AccessLogSetting:
        DestinationArn: !GetAtt ApiGatewayAccessLogGroup.Arn
        Format: '{ "requestId":"$context.requestId", "ip": "$context.identity.sourceIp", "caller":"$context.identity.caller", "user":"$context.identity.user","requestTime":"$context.requestTime", "httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath", "status":"$context.status","protocol":"$context.protocol", "responseLength":"$context.responseLength" }'
      MethodSettings:
        - DataTraceEnabled: false # Setting true logs everything, so set false to limit to errors only
          LoggingLevel: ERROR # log errors only
          ResourcePath: '/*' # target all resource paths
          HttpMethod: '*' # target all HTTP methods
```

If you cannot accept a domain change, it is possible to enable access logs from the console.
I have confirmed that the above settings remain unchanged even after `sam deploy`.

## What I Tried (List of Failures)

- When I defined it with AWS::Serverless::Api and tried to import the API Gateway, the following error occurred:

  ```
  ResourceTypes [AWS::Serverless::Api] are not supported for Import
  ```

  Reference: [Resources that support import and drift detection operations](https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/resource-import-supported-resources.html)

- When I defined it with AWS::ApiGateway::RestApi and tried to import the API Gateway, the following error occurred:

  ```
  You have modified resources [ServerlessRestApi, ServerlessRestApiDeployment2ababeb14f, ServerlessRestApiProdStage, FunctionMessagePermissionProd] in your template that are not being imported. Update, create or delete operations cannot be executed during import operations.
  ```

  It seems the settings for other resources were insufficient.

- When I tried to import only AWS::ApiGateway::Stage, the following error occurred:
  ```
  abcd1a2b3c|Prod already exists in stack arn:aws:cloudformation:ap-northeast-1:123456789012:stack/Bot-Stack/e50458c0-1234-12ab-a12f-123a4b5c6d7e
  ```

That's all.
I hope this is helpful.
