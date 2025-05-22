---
title: AWS リソースの年間予約購入
date: 2023-12-07
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

AWS リソースの年間予約購入について備忘録です。

## 年間予約購入まとめ

<!-- more -->

- Reserved Instance

  - 対象:
    - RDS
    - ElastiCache
    - RedShift
    - OpenSearch
  - 以下指定し購入
    - インスタンスタイプ
    - 個数
    - 前払い
    - 年数（弊社は 1 年指定）
  - 期限切れ通知
    - [RI アラート管理](https://us-east-1.console.aws.amazon.com/cost-management/home#/ri/alert) で設定
  - Pros:
    - どのリソースに対して購入するかが決定しやすい

- Savings Plans

  - 対象: コンピュートリソース（EC2 専用の Savings Plans もある）
    - EC2
    - ECS
    - Lambda
  - 以下指定し購入
    - コンピュートリソースの利用量に対するコミット値
    - 年数
    - 前払い
  - 期限切れ通知
    - [Savings Plans アラート管理](https://us-east-1.console.aws.amazon.com/cost-management/home#/savings-plans/overview/alert) で設定
  - コミット値
    - 過去・今後の推定利用量から算出する or AWS 推奨値を設定する
  - Pros:
    - EC2 から ECS のリプレイス後も適用される
  - Cons:
    - どのリソースに対して購入したかが分かりづらい

- CloudFront Security Bundle
  - 対象:
    - CloudFront
    - WAF
  - 以下指定し購入
    - CloudFront の利用量に対するコミット値
    - 年数
    - 前払い
  - 期限切れ通知
    - 現状ない (2023-12-07 時点)
  - コミット値
    - 過去・今後の推定利用量から算出する or AWS 推奨値を設定する

## RI 期限切れ通知 設定

RI の期限が切れるとオンデマンド料金となりコスト増となります。
コストが上がってから気づく、ということがないように期限切れ前に通知する機能があります。

以下ページから設定できます。

- [RI アラート管理](https://us-east-1.console.aws.amazon.com/cost-management/home#/ri/alert)
  ![](https://i.imgur.com/Kq3llTo.png)
  ![](https://i.imgur.com/cnwPI8X.png)

- On the day of expiration: 期限切れ当日
- 7 days: 期限切れ 7 日前
- 30 days: 期限切れ 30 日前
- 60 days: 期限切れ 60 日前
- Email recipients: メールアドレスが複数ある場合は `,` で区切る
  - Slack Email アプリで発行したメールアドレスを設定すると Slack 通知できる

## Reserved Instance 購入前後のコスト削減額の計算

RI は以下で年間コスト削減額を計算できます。

```
オンデマンド料金/hour × 365 days × 24 hours - (RI前払い料金 + RI 適用後料金/hour × 365 days × 24 hours)
```

RDS, ElastiCache, RedShift の各料金は AWS ドキュメントで確認可能です。

- [Aurora MySQL](https://aws.amazon.com/jp/rds/aurora/pricing/#Aurora_MySQL-Compatible_Edition)
- [Aurora PostgreSQL](https://aws.amazon.com/jp/rds/aurora/pricing/#Aurora_PostgreSQL-Compatible_Edition)
- [MySQL](https://aws.amazon.com/jp/rds/mysql/pricing/#RDS_for_MySQL)
- [PostgreSQL](https://aws.amazon.com/jp/rds/postgresql/pricing/#RDS_for_PostgreSQL)
- [ElastiCache](https://aws.amazon.com/jp/elasticache/pricing/#Reserved_nodes)
- [RedShift](https://aws.amazon.com/jp/redshift/pricing/#Reserved_Instance_pricing)

## Savings Plans コスト削減額 計算

### AWS Savings Plans コミット値推奨値を利用する場合

以下ページでコスト削減額の結果が確認できます。

- [AWS Savings Plans 推奨値](https://us-east-1.console.aws.amazon.com/cost-management/home#/savings-plans/recommendations?lookbackPeriodInDays=SEVEN_DAYS&paymentOption=ALL_UPFRONT&scope=PAYER&spType=COMPUTE_SP&termInYears=ONE_YEAR&tokens=%5B%5D)
  ![](https://i.imgur.com/vBbJUik.png)

- Savings Plans type: 節約プランタイプ

  - Compute Savings Plans: コンピュートリソースに対する節約プラン
    - 対象:
      - EC2
      - ECS
      - Lambda
    - EC2 から ECS へリプレイスを検討している、という場合に有利
  - EC2 Instance Savings Plans: EC2 に対する節約プラン
    - 対象:
      - EC2
    - EC2 に特化しているため Compute Savings Plans よりコスト削減できる
  - SageMaker Savings Plans: SageMaker に対する節約プラン
    - 対象:
      - SageMaker

- Term: 予約購入する期間 (最低 1 年)

  - 3-year: 3 年の予約購入 (最もコスト削減率が高い)
    - 3 年後まで現状のインフラ構成が見込めない場合は 1-year を選択した方が良い
  - 1-year: 1 年の予約購入

- Payment Option: 前払いのタイプです。

  - All upfront: 全額前払い（最もコスト削減率が高い）
  - Partial upfront: 一部前払い
  - No upfront: 前払いしない

- Based on the past の値は推奨値を算出する為の過去の運用日数
  - 直近が安定しているのであれば 7 日間 を選択
  - 日常的に EC2, ECS タスクのスケーリングを繰り返している場合は 30 or 60 日間を選択

今後 1 年を見越して利用量が大きく減ることがなければ、過去の利用量から AWS が算出した推奨値を採用する、で問題ありません。

### AWS Savings Plans 自前でコミット値を設定する場合

自前でコミット値を設定する場合はコスト削減額が表示されません。

- [Savings Plans: 自前でコミット値を設定する](https://us-east-1.console.aws.amazon.com/cost-management/home?region=us-east-1#/savings-plans/purchase)
  ![](https://i.imgur.com/7KIypok.png)

今後利用量に変化がありそう、スケーリングのタイミングなどで利用料が安定しない場合は自前で計算し設定します。

## CloudFront Security Bundle コスト削減額

以下ページで確認できます。

- [CloudFront: 推奨値](https://us-east-1.console.aws.amazon.com/cloudfront/v3/home#/savings-bundle/purchase)
  ![](https://i.imgur.com/2yW95Gh.png)

- Term: 1-year のみ
- Payment option: Monthly のみ
- Auto renew: 自動更新
  - 購入には稟議を通す必要がある等の理由でオフにすることが多いです（個人の感想）
- 期限切れ通知機能がないので適宜チェックする必要がある

AWS で過去の利用量を元にどの程度コスト削減できるか表示されます。

自動更新の有効・無効については適宜判定してください。

以上
参考になれば幸いです。
