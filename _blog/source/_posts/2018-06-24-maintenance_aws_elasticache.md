---
layout: post
title: ElastiCache メンテナンス対応 ~2018年梅雨~
date: 2018-06-24
tags:
- AWS
- ElastiCache
---

2018年6月頃 AWS ElastiCache のメンテナンス通知が大量発生した時の備忘録です。

{% twitter https://twitter.com/fujiwara/status/1008956888086503425 %}

<!-- more -->

## メンテ時に参照したリンク

[Redis 用 Amazon ElastiCache](https://docs.aws.amazon.com/ja_jp/AmazonElastiCache/latest/red-ug/CacheNodes.html#ReplaceStandalone)

基本、ノードのリプレイスが必要です。

以下、手動実行する時の手順です。

### node = 1 の場合

スタンドアローンな ElastiCache の場合、

1. バックアップをとる
2. リードレプリカを追加
3. レプリカを昇格しプライマリにする
4. レプリカとなった元ノードを削除

これでノードのリプレイスが完了しました。

### node = N (>=2)

複数ノードある場合、

1. バックアップをとる
2. フェールオーバー実施

AWS Support 曰く、
> フェールオーバー API は障害をシミュレートするので、フェイルオーバー後にノードの置き換えも行われます。

とのこと


## メンテナンス完了の確認方法

<b>正確にステータス確認するにはサポートに確認する</b>以外はないかなと思います。

イベントには操作ログが残りメンテが実施されたというログは一切残りません。

また、アラートもすぐさま消えません。正確にはわかりませんが、数時間程度経過したら消えていました。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180624/20180624213819.png" width="100%">
</div>

## 手動実行せず放っておいた場合

メンテナンスはメンテナンスウィンドウで指定した時間帯に実施されました。

ちなみに、放っておいた時のイベントログは以下のようになっていました。

n = 1
<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180624/20180624220417.png" width="100%">
</div>

n = 2
<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180624/20180624220358.png" width="100%">
</div>

n= 2 でフェールオーバーが自動実行されているのがわかります。

メンテナンス自体の経過時間はデータ量にもよるので一概には言えませんので
本番前に一度リハーサルして概算とっておくのが良いかなと思います。

以上
ご参考になれば幸いです。
