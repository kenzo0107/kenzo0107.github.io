---
title: Serverless Framework の設定値の上書き・追加 方法
tags:
- AWS
- Lambda
date: 2020-03-24
---

Serverless Framework での上書き設定について詰まった点をまとめました。

基本的には以下公式ドキュメントを参考にしつつ、いくつか実装パターンを試験しました。

<!-- more -->

環境変数を例にとって設定してみます。

[Environment Variables](https://serverless.com/framework/docs/providers/aws/guide/functions#environment-variables)

## stage 共通で設定

```yml
provider:
  environment:
    key: 'hello,world'
```

上記設定の場合、環境変数は以下の様に設定されます。

* key: hello,world


## 1つの値を上書きする場合

参考: [Overwriting Variables](https://serverless.com/framework/docs/providers/openwhisk/guide/variables#overwriting-variables)

```yml
provider:
  name: openwhisk
  stage: dev

custom:
  myStage: ${opt:stage, self:provider.stage}

functions:
  trigger:
    environment:
      key: ${self:custom.myStage}
```

上記設定の場合、デプロイ後の環境変数の設定は以下の様になります。

* `sls deploy` でデプロイした場合
  * key: dev
* `sls deploy --stage hoge` でデプロイした場合
  * key: hoge


## stage 毎に envorinment を追加・上書き

デフォルトの設定を provider.environment で指定し、各 stage 毎の設定は `self:custom.${self:provider.stage}.environment` で追加・上書きできる様にしています。

```yml
provider:
  environment:
    project: ${self:custom.${self:provider.stage}.project}
    slackChannel: ${self:custom.${self:provider.stage}.slack.channel}
    key: 'hello,world'

custom:
  hoge:
    project: hoge
    slack:
      channel: '#hoge'
  moge:
    project: moge
    slack:
      channel: '#moge'
    environment:
      key: 'moge-key'
      key2: 'moge-key2'

functions:
  trigger:
    environment: ${self:custom.${self:provider.stage}.environment, self:provider.environment}
```

上記設定の場合、デプロイ後の環境変数の設定は以下の様になります。

* `sls deploy --stage hoge` でデプロイした場合
  * project: hogeproject
  * slackChannel: #hoge
  * key: hello,world
* `sls deploy --stage moge` でデプロイした場合
  * project: hogeproject
  * slackChannel: #hoge
  * key: moge-key   `<-- 更新`
  * key2: moge-key2 `<-- 追加`

functions.trigger.environment を上書き設定する理由は、以下の様にした場合、

```yml
functions:
  trigger:
    # environment: ${self:custom.${self:provider.stage}.environment, self:provider.environment}
    environment: ${self:custom.${self:provider.stage}.environment}
```

`self:custom.hoge.environment` の設定がなく、 Warning が発生する為です。

```sh
 Serverless Warning --------------------------------------

  A valid service attribute to satisfy the declaration 'self:custom.hoge.environment' could not be found.
```

以上
参考になれば幸いです。
