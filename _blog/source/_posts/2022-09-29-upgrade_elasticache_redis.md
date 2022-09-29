---
title: AWS ElastiCache Redis バージョンアップ&ノードタイプ変更時の注意点
date: 2022-09-29
thumbnail: https://i.imgur.com/6PU8EYE.png
---

AWS より cache.m3 系から cache.m5 系へのアップグレードを促されました。

> One or more of your Amazon ElastiCache clusters is running on our previous generation node type cache.m3.medium. We strongly recommend that you migrate to one of our latest generation node types, and with ElastiCache it is fast and easy to choose a new instance type for your cluster.
>
> Our latest generation node types offer benefits such as better price per compute performance, higher-performing CPUs, improved memory, network performance, and ElastiCache optimizations such as enhanced I/O that provides improved throughput per node.
>
> Migration to the latest generation node types is available via our scale-up feature. To scale up your cluster:
> First, determine the best upgrade path from your previous generation node type(s) to the latest generation, see https://aws.amazon.com/elasticache/previous-generation

アップグレード時の注意事項をまとめます。

## 結論

1. Redis のスナップショットを取る
2. スナップショットを元に希望のバージョン・ノードタイプの Redis を作成
3. アプリケーションのエンドポイントを変更

バージョンアップ時に再作成となる場合があり上記の対応を取りました。
※ terraform plan でバージョン変更時に再作成となったことで発覚し、コンソール上で試しても実行できないことがわかった。

また、ノードタイプの変更時のデータ保持はベストエフォートとなる為、欠損する可能性があります。
その為、Redis にアクセスされない状態にした上でスナップショットを取り、それを元に新たに Redis を作成することで対応しました。

以上
参考になれば幸いです。
