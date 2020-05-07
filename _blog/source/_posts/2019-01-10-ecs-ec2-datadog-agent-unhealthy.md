---
layout: post
title: ECS EC2 上で起動する Datadog Agent コンテナが unhealthy になる時の処方箋
date: 2019-01-10
tags:
- AWS
- ECS
- Datadog
---

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190110/20190110112818.png" width="100%">
</div>

## 概要

```sh
$ docker ps

CONTAINER ID        IMAGE                            COMMAND                  CREATED             STATUS                    PORTS                NAMES
8baa0e2cff47        datadog/docker-dd-agent:latest   "/entrypoint.sh supe…"   31 hours ago        Up 31 hours (unhealthy)   8125/udp, 8126/tcp   ecs-dd-agent-task-1-dd-agent-f6d3d5eb9febcab9c601
```

ある日、ECS で起動させている Datadog Agent コンテナが unhealthy になってしまう事象が発生しました。
その原因と対応法をまとめました。

## 結論

Datadog Agent イメージを現時点の最新バージョン 6 系にすることで解決できました。

Datadog サポートに問い合わせた所、
今回のケースでは Datadog Agent イメージのバージョンが 5 系だったことに起因していました。

### datadog/docker-dd-agent:latest は 5系の最新だった！

バージョン5が最新だった時には設定手続きは以下に沿って実施していました。
[https://docs.datadoghq.com/integrations/faq/agent-5-amazon-ecs/](https://docs.datadoghq.com/integrations/faq/agent-5-amazon-ecs/)

上記手順にて登場する datadog agent の ECS での起動用タスクが以下になります。
ここで指定しているイメージ (datadog/docker-dd-agent:latest) が 5系でした。

[https://docs.datadoghq.com/json/dd-agent-ecs.json](https://docs.datadoghq.com/json/dd-agent-ecs.json)

`datadog/docker-dd-agent:latest` は 5系の最新だった！

### datadog/agent:latest が 2019.01.10 時点最新の 6系 ！

現最新バージョン 6系を扱うには以下設定手続きを参照します。
[https://docs.datadoghq.com/integrations/amazon_ecs](https://docs.datadoghq.com/integrations/amazon_ecs)

手続きで変更点はタスク定義の変更くらいです。

[https://docs.datadoghq.com/json/datadog-agent-ecs.json](https://docs.datadoghq.com/json/datadog-agent-ecs.json)

今の所、`datadog/agent:latest` が6系の最新になっています。
7系になった際には是非とも互換維持してほしいです。

## おまけ

### サポートへの問い合わせ

サポートに問い合わせると、 caseID という問い合わせの ID をいただけます。
その後、caseID を設定し、起動時のログファイル (tar.gz) を取得し、サポート宛に添付しました。

ECS の管理下にある EC2 に ssh ログインし以下実行します。

```sh
$ docker run --rm -v /tmp:/tmp -e API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx datadog/docker-dd-agent:latest /etc/init.d/datadog-agent flare <caseID>

2019-01-03 12:27:44,472 | ERROR | dd.collector | utils.dockerutil(dockerutil.py:148) | Failed to initialize the docker client. Docker-related features will fail. Will retry 0 time(s). Error: Error while fetching server API version: ('Connection aborted.', error(2, 'No such file or directory'))
...
2019-01-03 12:27:45,807 | INFO | dd.collector | utils.flare(flare.py:161) | Saving all files to /tmp/datadog-agent-2019-01-03-12-27-44.tar.bz2
/tmp/datadog-agent-2019-01-03-12-27-44.tar.bz2 is going to be uploaded to Datadog.
...
```

EC2 ホスト上に `/tmp/datadog-agent-2019-01-03-12-27-44.tar.bz2` ファイルが取得できるので、それをサポート宛にメール添付しました。

上記でログも含めサポートに連絡した所、API バージョンにより接続中止されている、という指摘を受け、バージョン上げて！という話になりました。

```sh
2019-01-03 12:27:44,472 | ERROR | dd.collector | utils.dockerutil(dockerutil.py:148) | Failed to initialize the docker client. Docker-related features will fail. Will retry 0 time(s). Error: Error while fetching server API version: ('Connection aborted.', error(2, 'No such file or directory'))
```


サポートさんありがとう♪

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190110/20190110112453.png" width="100%">
</div>

以上です。
参考になれば幸いです。
