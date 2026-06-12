---
title: Aurora PostgreSQL db.t4g.medium 相当の Aurora Serverless v2 のキャパシティ設定どのくらい？
date: 2025-12-01
lang: ja
translation_id: aws-aurora-rds-cluster-instance-vs-serverless-v2
category: AWS
cover: https://i.imgur.com/7XgGjaF.png
---

## 概要

Aurora Serverless v2 を導入検討する際に Aurora RDS Cluster Instance の最低インスタンスクラスである db.t4g.medium がどの程度のキャパシティに相当するのか調査した内容をまとめます。

<!-- more -->

## キャパシティ計算

### db.t4g.medium スペック

- **vCPU**: 2
- **メモリ**: 4 GiB
- **ACU相当**: 2 ACU 👀✨

## コスト比較 （ap-northeast-1、2025年12月1日現在）

利用料金の安い Aurora PostgreSQL Standard を前提とします。

|  | USD |
|---|---|
| RI | 710 |
| Serverless v2 (1年フル稼働) | 2,628 |
| Serverless v2 (平日夜間・土日祝停止) | 1,176 |

RI は安いですが、スケーリングの管理は CloudWatch Alarm などで構成する必要があります。

### Aurora PostgreSQL プロビジョンドインスタンス db.t4g.medium

- Aurora Standard: 0.113 USD / hour
- Aurora I/O 最適化: 0.147 USD / hour

#### Aurora Standard を 1年利用した場合

```
989.88 USD
= 0.113 USD / hour x 24 hour x 365 days
```

#### Reserved Instance を利用した場合

```
710 USD
```

### Aurora PostgreSQL Serverless v2

- Aurora Standard: 0.15 USD / ACU / hour
- Aurora I/O 最適化: 0.20 USD / ACU / hour

#### Aurora Standard を 1年利用した場合

```
2,628 USD
= 2 ACU x 0.15 USD / ACU x 24 hours x 365 days / hour
```

以下時間をゼロキャパシティとなる見込みの場合 (3,920 時間/年間)
- 平日 23:00 - 07:00
- 土日祝

```
1,176 USD
= 2 ACU x 0.15 USD / ACU / hour x 3,920 hours
```


## 総評

Aurora Serverless を利用する際の一番のデメリットは実際のワークロードが読めず、意図せぬコスト増となり得ることが一つ要因としてあるかと思います。
その場合は実際のワークロードを想定した検証した上でコストメリットを計算できます。

スケーリングの管理に対する運用負荷が軽減されるメリットは非常に大きいのでこの点は採用するメリットとしては大きいのではないかと思います。

いずれにしても検証大事！

## 参考文献

- [Using Aurora Serverless v2 - Amazon Aurora](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)
- [Hardware specifications for DB instance classes for Aurora](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.DBInstanceClass.Summary.html)
- [Amazon Aurora Pricing](https://aws.amazon.com/rds/aurora/pricing/)
