---
title: AWS CloudWatch Application Signals の料金体系
date: 2025-12-19
category: AWS
cover: https://i.imgur.com/Ozk9mO9.png
---

[AWS Pricing MCP](https://github.com/awslabs/mcp/tree/main/src/aws-pricing-mcp-server) を利用し取得した価格データから AWS CloudWatch Application Signals の料金体系は以下の通りです。

<!-- more -->

## Application Signalsシグナル料金

階層型の従量課金制

- 最初の1億シグナル: $1.50 / 100万シグナル
- 次の9億シグナル（1億～10億）: $0.75 / 100万シグナル
- 10億シグナル超過分: $0.30 / 100万シグナル

## Application Signals Bytesデータ取り込み料金

データ量に基づく階層型課金

- 最初の10TB: $0.35 / GB
- 次の20TB（10TB～30TB）: $0.20 / GB
- 30TB超過分: $0.15 / GB

### 料金体系の特徴

1. 完全従量課金制
  - 使用した分だけ課金
  - 最小利用料金なし
2. 階層型割引
  - 使用量が増加するにつれて単価が下がる
  - 大規模利用時のコスト効率が向上
3. リージョン別料金
  - 東京リージョン（ap-northeast-1）の価格
  - 他リージョンでは若干異なる場合あり

## コスト例（月間利用）

| 利用規模 | シグナル数 | データ量 | 概算月額 |
| --- | --- | --- | --- |
| 小規模 | 1,000万 | 100GB | $50-70 |
| 中規模 | 5,000万 | 500GB | $250-300 |
| 大規模 | 2億 | 2TB | $900-1,100 |

## 関連コスト

Application Signalsを使用する際の追加的なコスト要因

- CloudWatchメトリクス料金
- X-Rayトレース料金（有効化している場合）
- Lambda、ECS、EKS等の関連サービス料金
- 他リージョンへのデータ転送料金

Application Signalsは比較的新しいサービスで、アプリケーションの可観測性を向上させる強力な機能を提供しますが、利用量に応じてコストが積み上がる点に注意が必要です。

以上<br>
参考になれば幸いです。
