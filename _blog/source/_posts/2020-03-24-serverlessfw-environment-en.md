---
title: How to Override and Add Configuration Values in the Serverless Framework
tags:
- AWS
- Lambda
date: 2020-03-24
categories:
  - [AWS]
  - [Infrastructure]
lang: en
translation_id: serverlessfw-environment
permalink: en/2020/03/24/serverlessfw-environment/
cover: /img/cover/2020-03-24-serverlessfw-environment.svg
---

This is a summary of the points I got stuck on when overriding settings in the Serverless Framework.

Basically, I referred to the official documentation below while testing a few implementation patterns.

<!-- more -->

Let's try configuring things using environment variables as an example.

[Environment Variables](https://serverless.com/framework/docs/providers/aws/guide/functions#environment-variables)

## Common Setting Across Stages

```yml
provider:
  environment:
    key: 'hello,world'
```

With the configuration above, the environment variable is set as follows.

* key: hello,world


## Overriding a Single Value

Reference: [Overwriting Variables](https://serverless.com/framework/docs/providers/openwhisk/guide/variables#overwriting-variables)

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

With the configuration above, the environment variable settings after deployment are as follows.

* When deployed with `sls deploy`
  * key: dev
* When deployed with `sls deploy --stage hoge`
  * key: hoge


## Adding and Overriding the environment per Stage

The default settings are specified in `provider.environment`, and the per-stage settings can be added or overridden via `self:custom.${self:provider.stage}.environment`.

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

With the configuration above, the environment variable settings after deployment are as follows.

* When deployed with `sls deploy --stage hoge`
  * project: hogeproject
  * slackChannel: #hoge
  * key: hello,world
* When deployed with `sls deploy --stage moge`
  * project: hogeproject
  * slackChannel: #hoge
  * key: moge-key   `<-- updated`
  * key2: moge-key2 `<-- added`

The reason for overriding `functions.trigger.environment` is that if you write it as follows,

```yml
functions:
  trigger:
    # environment: ${self:custom.${self:provider.stage}.environment, self:provider.environment}
    environment: ${self:custom.${self:provider.stage}.environment}
```

there is no `self:custom.hoge.environment` setting, which causes a Warning.

```sh
 Serverless Warning --------------------------------------

  A valid service attribute to satisfy the declaration 'self:custom.hoge.environment' could not be found.
```

That's all.
I hope this helps.
