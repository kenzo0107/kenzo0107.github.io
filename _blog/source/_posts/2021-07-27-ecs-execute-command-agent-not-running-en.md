---
title: What I Investigated When ecs execute command Failed
category: AWS
tags:
  - AWS
date: 2021-07-27
lang: en
translation_id: ecs-execute-command-agent-not-running
permalink: en/2021/07/27/ecs-execute-command-agent-not-running/
cover: https://i.imgur.com/yK51axc.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## Overview

I had enabled execute command, but an error occurred when running ecs execute command, so I summarized how I investigated it.

```
An error occurred (InvalidParameterException) when calling the ExecuteCommand operation: The execute command failed because execute command was not enabled when the task was run or the execute command agent isn't running. Wait and try again or run a new task with execute command enabled and try again.
```

## First, check whether it is actually enabled

Confirm that the ECS Service returns enableExecuteCommand = true.

```
$ aws ecs describe-services --cluster example-cluster --services example-service | jq '.services[].enableExecuteCommand'

true
```

Confirm that the running Task returns enableExecuteCommand = true.

```
$ aws ecs describe-tasks --cluster example-cluster --tasks 61cf31d333cd43508a412e1437814e19 | jq '.tasks[].enableExecuteCommand'

true
```

Both return true, so why is it failing?

## Does the Task Role have the required permissions?

Looks fine ♪

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

## Try it on another container

```
$ aws ecs execute-command \
    --cluster example-cluster \
    --task 61cf31d333cd43508a412e1437814e19 \
    --container other_container \
    --interactive \
    --command "ps aux"

ecs execute-command worked on the other container
```

At this point, the target container looks suspicious.

## Run the target container again

With the rails container, `the execute command agent isn't running.` was occurring.

```
$ aws ecs execute-command \
    --cluster example-cluster \
    --task 61cf31d333cd43508a412e1437814e19 \
    --container rails \
    --interactive \
    --command "ps aux"

An error occurred (InvalidParameterException) when calling the ExecuteCommand operation: The execute command failed because execute command was not enabled when the task was run or the execute command agent isn't running. Wait and try again or run a new task with execute command enabled and try again.
```

Since I use `rails c` a lot, could it have been killed by OOM???

## Swap out the task with a forced deployment of the same task

After running a forced deployment of the same task, running `ecs execute-command` succeeded!

It seems it was a temporary problem.

## Summary

When `The execute command failed because execute command was not enabled when the task was run or the execute command agent isn't running.` occurs, be aware that it can also happen due to circumstances specific to each container.

If you run into the same error, I'd be more than happy if you could just drop a link to this article.

That's all.
I hope this is helpful.
