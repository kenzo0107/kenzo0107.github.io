---
layout: post
title: cs-cli バージョン指定してインストール
date: 2018-06-06
tags:
- AWS
---

完全な備忘録です。

## 経緯

6月に入って数日、
ecs-cli の latest をインストールすると latest が 1.6.0 となり
`ecs-cli compose ...` を実行すると以下のようなエラーが出るようになりました。

```sh
level=error msg="Unable to open ECS Compose Project" error="Volume driver is not supported"
```

1.4.0 では問題なかったタスク定義でしたが
1.6.0 では `Volume driver is not supported` となったそうで処理がこけるようになりました。

その対応として 1.4.0 にバージョン固定した設定です。

<!-- more -->

## 結論

latest の部分を `<version>` に変更することで指定のバージョンでインストールが可能です。

* for Linux OS

```sh
curl -s https://amazon-ecs-cli.s3.amazonaws.com/ecs-cli-linux-amd64-v1.6.0 -o /usr/bin/ecs-cli && chmod +x /usr/bin/ecs-cli
```

* for MacOS

```sh
curl -s https://amazon-ecs-cli.s3.amazonaws.com/ecs-cli-darwin-amd64-v1.6.0 -o /usr/bin/ecs-cli && chmod +x /usr/bin/ecs-cli
```

## AWS Documentation では

最新の ecs-cli のみの説明の為、若干ハマりました。

GitHub には `Download specific version` とあるのでこちらの情報を追っておくと良かったです。

[ecs-cli - Download specific version](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ECS_CLI_installation.html)

以上
本当に備忘録でした。
