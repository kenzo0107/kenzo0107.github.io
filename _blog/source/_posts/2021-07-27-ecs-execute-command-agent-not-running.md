---
title: ecs execute command が失敗した際に調査したこと
category: AWS
tags:
- AWS
date: 2021-07-27
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## 概要

execute command を有効化させたが、 ecs execute command を実行した際にエラーが発生した為、その調査方法をまとめました。

```
An error occurred (InvalidParameterException) when calling the ExecuteCommand operation: The execute command failed because execute command was not enabled when the task was run or the execute command agent isn't running. Wait and try again or run a new task with execute command enabled and try again.
```

## まずは本当に有効化されているか調査する

ECS Service で enableExecuteCommand = true が返ることを確認する。

```
$ aws ecs describe-services --cluster example-cluster --services example-service | jq '.services[].enableExecuteCommand'

true
```

起動 Task で enableExecuteCommand = true が返ることを確認する。

```
$ aws ecs describe-tasks --cluster example-cluster --tasks 61cf31d333cd43508a412e1437814e19 | jq '.tasks[].enableExecuteCommand'

true
```

どちらも true が返るのに何故？

## Task Role が権限を所持しているか

大丈夫そう♪

```
  statement {
    actions = [
      "ssmmessages:CreateControlChannel",
      "ssmmessages:CreateDataChannel",
      "ssmmessages:OpenControlChannel",
      "ssmmessages:OpenDataChannel",
    ]
    resources = ["*"]
  }
```

## 他のコンテナで試してみる

```
$ aws ecs execute-command \
    --cluster example-cluster \
    --task 61cf31d333cd43508a412e1437814e19 \
    --container other_container \
    --interactive \
    --command "ps aux"

他コンテナだと ecs execute-command を実行できた
```

ここまでくると対象のコンテナが怪しい

## 対象のコンテナを再度実行

rails コンテナだと `the execute command agent isn't running.` が発生していた。

```
$ aws ecs execute-command \
    --cluster example-cluster \
    --task 61cf31d333cd43508a412e1437814e19 \
    --container rails \
    --interactive \
    --command "ps aux"

An error occurred (InvalidParameterException) when calling the ExecuteCommand operation: The execute command failed because execute command was not enabled when the task was run or the execute command agent isn't running. Wait and try again or run a new task with execute command enabled and try again.
```

`rails c` をよく利用するから OOM でやられたか???


## 同一タスクで強制デプロイでタスクを入れ替える

同一タスクで強制デプロイ実行後、 `ecs execute-command` 実行すると成功した！

一時的な問題だった様でした。

## まとめ

`The execute command failed because execute command was not enabled when the task was run or the execute command agent isn't running.` が発生した場合は、各コンテナの都合で発生する場合もあるので要注意です。

同様のエラーが発生した際に、この記事のリンクをぽんっと貼ってもらえたら何よりです。

以上
参考になれば幸いです。
