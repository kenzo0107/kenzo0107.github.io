---
layout: post
title: エラーログをSlack通知する
date: 2015-09-24
lang: ja
translation_id: errorlog-to-slack
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150924/20150924011032.png
tags:
- Fluentd
---

## 環境

- CentOS Linux release 7.1.1503 (Core)
- td-agent: 0.12.12
- Nginx: 1.8.0

## 概要

社内でSlackによる連携が進み
ログ管理もfluentdにまとめつつあるので
エラーログで何かあったらSlack通知させようと思いチャレンジ♪

以下のような流れを想定しています。

> Nginx error.log ---> fluentd ---> slack


gemでも作るか！と思ったら既にSlack Pluginは豊富なので
あやからせていただきます！

## 準備
fluentdが/var/log/nginx/error.log にアクセスできるようにしておいてください。

ログがtailできないなんてときは以下参照♪

{% linkPreview http://kenzo0107.hatenablog.com/entry/2015/08/21/011624 _blank %}



## 利用するfluentd Plugin

- [sowawa/fluent-plugin-slack](https://github.com/sowawa/fluent-plugin-slack)
- [sonots/fluent-plugin-record-reformer](https://github.com/sonots/fluent-plugin-record-reformer)
- [fluent/fluent-plugin-rewrite-tag-filter](https://github.com/fluent/fluent-plugin-rewrite-tag-filter)

## td-agent.conf設定

{% gist kenzo0107/8dd7e6f07158987e8b4d %}

#### error.logフォーマット設定

- Nginxのエラーログが以下のようにフォーマットされ出力されているとします。

```
2015/11/18 18:01:47 [error] 23029#0: *9086 open() "/var/golang/src/img/tmp.png" failed (2: No such file or directory), client: ***.**.**.****, server: hogehoge.jp, request: "GET /img/tmp.png HTTP/2.0", host: "hogehoge.jp", referrer: "http://hogehoge.jp"
```

- fluentdのformat設定

```
format /^(?<time>.+) \[(?<level>[^\]]+)\] *(?<message>.*)$/
```

上記fomat設定によって以下のように `key : value` 構成で取得できます。

```
time : 2015/11/18 18:01
level : error
message : or] 23029#0: *9086 open() "/var/www/html/img/tmp.png" failed (2: No such file or directory), client: ***.**.**.****, server: hogehoge.jp, request: "GET /img/tmp.png HTTP/2.0", host: "hogehoge.jp", referrer: "http://hogehoge.jp"
```

設定によってはうまく通知させずハマりました汗

#### tag名をリライト

上記 で取得した key:value を元に tagを書き換えます。

以下の例だと、
`level` が `error` の場合、 `slack.error.${tag} (slack.error.nginx.error)` にタグを書き換えてます。
他、warn, fatal も同様です。

```
<match nginx.error>
  type rewrite_tag_filter
  rewriterule1 level error slack.error.${tag}
  rewriterule2 level warn slack.warn.${tag}
  rewriterule3 level fatal  slack.fatal.${tag}
</match>
```

また `message` で取得した値の中に<br/>
特定文字列が含まれている場合等も可能です。

例) message に 「PHP Fatal Error」 で始まる文字列が含まれている場合にslack.fatal.${tag}に書き換える。

```
<match nginx.error>
  type rewrite_tag_filter
  rewriterule1 level error slack.error.${tag}
  rewriterule2 level warn slack.warn.${tag}
  rewriterule3 level fatal  slack.fatal.${tag}

  rewriterule4 message ^PHP Fatal Error.*$ slack.fatal.${fatal}    # 追加
</match>
```



#### フィールド追加

- source_id 追加

time, level, message 以外に `source_id` を追加してます。
以下の例では source_id` に tag_suffix[1] を指定しています。

```
<match slack.**>
  type record_reformer
  tag reformed.${tag}
  <record>
    source_id ${tag_suffix[1]}
  </record>
</match>
```

#### tag_suffix について
tag が reformed.slack.error.nginx.error とすると
以下のような仕様です。

```
tag_suffix[0] → reformed.slack.error.nginx.error
tag_suffix[1] → slack.error.nginx.error
tag_suffix[2] → error.nginx.error

tag_suffix[-1] → error
tag_suffix[-2] → nginx.error
```


#### slack通知

- incoming WebhookからWebhookURLを設定

```
<match reformed.slack.**>
  type slack
  webhook_url https://hooks.slack.com/services/xxxxxxxxx/xxxxxxxxx/xxxxxxxxxxxxxxxxxxxxxxxx
  channel flag_production
  username fluentd
  title_keys source_id
  title %s
  color danger
  flush_interval 5s
</match>
```

## 通知結果

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150924/20150924011032.png" width="100%">
</div>


## 余談

Slackに通知しても休日で業務連絡を見ないということは往々にしてあるので
Twillioで電話通知するpluginもあります。

[y-ken/fluent-plugin-twilio](https://github.com/y-ken/fluent-plugin-twilio)

株式会社KDDIウェブコミュニケーションズが提供する有料サービスです。
比較的安価なので導入検討してみてください。

### Twillio 料金表

[twilio price](http://twilio.kddi-web.com/price/)

かつての「メール見てませんでした💦」
なんてことがなくなりそうなのは良いですね


以上です。
