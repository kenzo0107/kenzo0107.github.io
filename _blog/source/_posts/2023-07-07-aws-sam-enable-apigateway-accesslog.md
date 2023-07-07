---
title: SAM プロジェクトで管理する API Gateway のアクセスログを有効化する
date: 2023-07-07
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## 概要

SAM プロジェクトで管理する API Gateway について
AWS Config rule: `api-gw-execution-logging-enabled` に対応すべく、
アクセスログを有効化した際にハマった話です。

`Events.*.Type = Api` で作成した API Gateway では SAM 上でアクセスログ有効化の設定ができません。

どのようにしたら API Gateway のアクセスログ有効化できるか調査しました。

<!-- more -->

### SAM template.yml 設定

```yaml
Resources:
  Function:
    Type: AWS::Serverless::Function
    Properties:
      ...
      Events:
        Message:
          Type: Api # この設定で生成した API Gateway だとアクセスログの有効化の設定ができない
          Properties:
            Path: /message
            Method: post
```

## 結論

2023-07-07 時点、
API Gateway を新たに作成しそちらに乗り換えるしか方法がありません。
その場合、カスタムドメインでない限り、API Gateway のドメインは変更されます。

`Type: AWS::Serverless::Api` 等、別途 API Gateway 作成し、`RestApiId` で参照することで
アクセスログや X-Ray Tracing の有効化が可能でした。

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
      TracingEnabled: true # X-Ray Tracing 有効化
      AccessLogSetting:
        DestinationArn: !GetAtt ApiGatewayAccessLogGroup.Arn
        Format: '{ "requestId":"$context.requestId", "ip": "$context.identity.sourceIp", "caller":"$context.identity.caller", "user":"$context.identity.user","requestTime":"$context.requestTime", "httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath", "status":"$context.status","protocol":"$context.protocol", "responseLength":"$context.responseLength" }'
      MethodSettings:
        - DataTraceEnabled: false # true にし全てのログを記録する為、 false で error のみに絞る
          LoggingLevel: ERROR # error のみログに記録
          ResourcePath: '/*' # 全てのリソースパス対象
          HttpMethod: '*' # 全ての HTTP Method 対象
```

もしドメイン変更を許容しない場合は、コンソール上でアクセスログを有効化することは可能です。
sam deploy 後も上記処理について変更がないことを確認済みです。

## 試したこと (NG 集)

- AWS::Serverless::Api  で定義し  API Gateway  をインポートしようとすると以下エラー発生

  ```
  ResourceTypes [AWS::Serverless::Api] are not supported for Import
  ```

  参考: [インポートおよびドリフト検出オペレーションをサポートするリソース](https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/resource-import-supported-resources.html)

- AWS::ApiGateway::RestApi  で定義し  API Gateway  をインポートしようとすると以下エラー発生

  ```
  You have modified resources [ServerlessRestApi, ServerlessRestApiDeployment2ababeb14f, ServerlessRestApiProdStage, FunctionMessagePermissionProd] in your template that are not being imported. Update, create or delete operations cannot be executed during import operations.
  ```

  他リソースの設定が不足しているようだ。

- AWS::ApiGateway::Stage のみインポートしようとすると以下エラー発生
  ```
  abcd1a2b3c|Prod already exists in stack arn:aws:cloudformation:ap-northeast-1:123456789012:stack/Bot-Stack/e50458c0-1234-12ab-a12f-123a4b5c6d7e
  ```

以上
参考になれば幸いです。
