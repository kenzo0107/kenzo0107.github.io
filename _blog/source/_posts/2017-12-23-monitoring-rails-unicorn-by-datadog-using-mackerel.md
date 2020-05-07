---
layout: post
title: Datadog で Rails Unicorn の Memory, Idle|Busy Worker 監視 〜呉越同舟〜
date: 2017-12-23
tags:
- Datadog
- Rails
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171223/20171223193555.png
---

## 概要

Rails の乗っているホストへ Datadog で Unicorn を監視しようとした所、
それらしい Integration がありません((あったら教えてください >_< ))。

ということで独自スクリプトを作成しようと思いました！


## 独自スクリプトを書こうとしてたら...

同僚「Mackerel なら plugin ありますよ？」

自分「えっ？...」


## Mackerel 入ってる

Mackerel に unicorn 監視用の plugin がありました。

[mackerel-plugin-unicorn](https://github.com/mackerelio/mackerel-agent-plugins/tree/master/mackerel-plugin-unicorn)

はてなさんもOSSで出して頂いている、
車輪の再開発は時間の無駄、
人生は一度しかないのでこの Mackerel プラグインを Datadog で使わせて頂こうと思いました。


## Mackerel + Datadog 呉越同舟スクリプト

* /etc/dd-agent/unicorn_check.py

```python
from checks import AgentCheck
import subprocess
import re
class UnicornCheck(AgentCheck):
  def check(self, instance):
    pidfile = instance['pidfile']
    cmd = "/usr/bin/mackerel-plugin-unicorn -pidfile=%s" % (pidfile)

    res = self.exeCmdWithStripLF(cmd)

    for r in res:
        y = re.split(r'\t+', r.rstrip('\t'))
        metrics = y[0]
        out     = y[1]
        self.gauge(metrics, out)

  # コマンド実行結果から改行コードから取り除く
  def exeCmdWithStripLF(self, cmd):
    res = self.exeCmd(cmd)
    return [str(x).rstrip("\n") for x in res]

  # コマンド実行
  def exeCmd(self, cmd):
    return subprocess.Popen(
      cmd,
      stdout=subprocess.PIPE,
      shell=True
    ).stdout.readlines()
```

* /etc/dd-agent/conf.d/unicorn_check.yaml

Unicorn の PID ファイルを指定します。

```yml
init_config:

instances:

  - pidfile: /path/to/rails_project/shared/tmp/pids/unicorn.pid
```

## Datadog Agent 設定ファイルチェック

```sh
$ sudo dd-agent configcheck

unicorn_check.yaml is valid
```

## Datadog Agent 再起動

```sh
$ sudo service datadog-agent restart
```

## 数分後グラフを見てみる

出てきた！

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171223/20171223203723.png" width="100%">
</div>


## 総評

これで呉越同舟型モニタリングができました！

自分自身が呉でも越でもない所に若干の背徳感がありますが
手っ取り早く舟をこしらえたことに本記事の意味があるかと
筆を取りました。

参考になれば幸いです。
