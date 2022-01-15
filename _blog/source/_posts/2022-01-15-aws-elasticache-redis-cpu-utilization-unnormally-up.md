---
title: 2022-01-15 AWS ElastiCache CPU 使用率の異常上昇について
date: 2022-01-15
category: AWS
---

2022-01-15 11:40 頃 AWS ElastiCache (ap-northeast-1) のいくつかの node で CPU 使用率が 100 % を優に超える値を記録する事象が確認されました。

![](https://i.imgur.com/JHvTN3N.png)

状況整理し特段ユーザ影響がないことを確認しています。

## CPU 使用率上昇時の状況整理

* [Service Health Dashboard](https://status.aws.amazon.com/) には特に記録なし
* キャッシュヒット率が一時的に92% → 78% (-14%) 程度下がった
* アプリケーションの利用箇所で 5xx エラーはなし
* worker のジョブも影響なし
* エンジン CPU 使用率 (=Redis エンジンスレッドの CPU 使用率) が低いことから Redis の処理自体の影響はないと思われる
* CPU 使用率 (Redis 以外のホスト全体の CPU 使用率) が高騰したことから、 AWS 側でホストに対する更新があったと思われる
    - この辺の影響だろうか？
        https://aws.amazon.com/jp/about-aws/whats-new/2022/01/amazon-elasticache-streaming-storing-redis-engine-logs/

参考: https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/CacheMetrics.Redis.html

TODO: サポート問い合わせし、追記します。
