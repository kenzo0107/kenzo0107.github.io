---
layout: post
title: Installing ecs-cli with a Pinned Version
date: 2018-06-06
category: AWS
lang: en
translation_id: specify-ecscli-version
permalink: en/2018/06/06/specify-ecscli-version/
cover: /img/cover/2018-06-06-specify-ecscli-version.svg
tags:
- AWS
---

This is purely a memo for my future self.

## Background

A few days into June, installing the latest ecs-cli pulled in version 1.6.0, and running `ecs-cli compose ...` started producing the following error:

```sh
level=error msg="Unable to open ECS Compose Project" error="Volume driver is not supported"
```

The task definition had worked fine with 1.4.0, but with 1.6.0 it failed with `Volume driver is not supported`.

As a workaround, here is the configuration that pins the version to 1.4.0.

<!-- more -->

## Conclusion

By replacing the `latest` part with `<version>`, you can install a specific version.

* for Linux OS

```sh
curl -s https://amazon-ecs-cli.s3.amazonaws.com/ecs-cli-linux-amd64-v1.6.0 -o /usr/bin/ecs-cli && chmod +x /usr/bin/ecs-cli
```

* for MacOS

```sh
curl -s https://amazon-ecs-cli.s3.amazonaws.com/ecs-cli-darwin-amd64-v1.6.0 -o /usr/bin/ecs-cli && chmod +x /usr/bin/ecs-cli
```

## In the AWS Documentation

The AWS docs only explain how to install the latest ecs-cli, which tripped me up a bit.

GitHub has a `Download specific version` section, so it would have been better to follow that information.

[ecs-cli - Download specific version](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ECS_CLI_installation.html)

That's all.
Truly just a memo.
