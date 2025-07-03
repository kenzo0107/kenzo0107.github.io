---
title: Confluent Cloud の料金比較：SaaS版 vs AWS Marketplace版
category: AWS
date: 2025-07-03
tags:
  - Confluent
  - AWS
  - Kafka
---

Confluent Cloud の料金体系について、SaaS版と AWS Marketplace版の比較を調べてみました。

※ 本記事は Claude Code で調べ得た内容を Obsidian にまとめさせブログ化してもらいました。初の試み💓

<!-- more -->

## 💰 料金比較の結論

**Confluent CloudとAWS Marketplace版の料金は同じです。**

AWS Marketplace版のConfluent Cloudの価格設定は、Confluent直販の価格設定と同じです。つまり、どちらを選んでも基本的な料金体系に違いはありません。

## 料金体系の詳細

### 🧮 共通の料金構造

両方とも以下の要素で課金されます：

1. **Kafka クラスター**: eCKUs（Elastic Confluent Units for Kafka）による時間料金、ネットワーキング（GB単位）、ストレージ（GB-時間単位）
2. **Connect**: コネクタの使用はスループット（GB単位）とタスクベース価格（タスク/時間単位）で課金
3. **Stream Processing**: Apache FlinkによるCFUs（分単位）で課金
4. **Stream Governance**: 環境単位（時間単位）で課金

### 主な違い

**支払い方法と統合面**：

- **SaaS版**: Confluent直接支払い
- **AWS Marketplace版**: AWS Marketplaceを通じて直接課金され、既存のAWSコミットを活用でき、事務手続きを省略できます

**特典**：

- AWS Marketplace版では$1,000の無料クレジット（$400即座、$600はプロモコード経由）が提供されます
- AWS Marketplace経由のすべてのConfluent Cloudサインアップには、追加費用なしでConfluent Cloud Engineersによるホワイトグローブオンボーディング、アーキテクチャレビュー、オンデマンドトレーニングが含まれます

## 推奨

料金面では差がないため、以下の要因で選択することをお勧めします：

1. **AWS環境に統合したい場合** → AWS Marketplace版
2. **既存のAWS契約やコミットを活用したい場合** → AWS Marketplace版
3. **統一された請求を希望する場合** → AWS Marketplace版
4. **初期の無料クレジットを活用したい場合** → AWS Marketplace版

料金以外の面では、AWS Marketplace版の方がAWS環境との統合や請求の簡素化において有利と言えるでしょう。

以上
参考になれば幸いです。
