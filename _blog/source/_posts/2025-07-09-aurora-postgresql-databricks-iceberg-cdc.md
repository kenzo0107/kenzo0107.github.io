---
title: Aurora PostgreSQL から Databricks Iceberg テーブルへの CDC レプリケーション方法
category: AWS
date: 2025-07-09
tags: [AWS, PostgreSQL, Databricks, CDC, Iceberg, DataLake]
---

Aurora PostgreSQL から Databricks の Iceberg テーブルへの Change Data Capture (CDC) レプリケーションを実現するための主要な手法と、それぞれの特徴について説明します。

<!-- more -->

## 概要

Aurora PostgreSQL から Databricks の Iceberg テーブルへの Change Data Capture (CDC) レプリケーションを実現するための主要な手法と、それぞれの特徴について説明します。

## 主要な手法

### 1. AWS DMS + AWS Glue + Iceberg

**仕組み:**
- AWS DMS で Aurora PostgreSQL からの CDC データを取得
- AWS Glue を使用してデータをApache Iceberg形式に変換
- Databricks で Iceberg テーブルとして利用

**特徴:**
- AWS ネイティブソリューション
- Apache Iceberg の UPSERT 機能を活用
- リアルタイム処理が可能

### 2. Amazon Data Firehose (Preview)

**仕組み:**
- Amazon Data Firehose が直接 PostgreSQL の CDC を取得
- Apache Iceberg テーブルを S3 上に自動作成
- Databricks から Iceberg テーブルにアクセス

**特徴:**
- 設定が簡単（数分で構築可能）
- 完全マネージド
- 現在プレビュー段階

### 3. Kafka Connect + Debezium + Iceberg Sink

**仕組み:**
- Debezium で PostgreSQL の WAL（Write-Ahead Log）を監視
- Kafka Connect で Iceberg Sink Connector を使用
- Databricks で Iceberg テーブルを利用

**特徴:**
- オープンソースベース
- 高い柔軟性とカスタマイズ性
- Exactly-Once 処理をサポート

### 4. Databricks Delta Live Tables

**仕組み:**
- Databricks Delta Live Tables の CDC 機能を使用
- AUTO CDC または APPLY CHANGES INTO を利用
- Delta Lake から Iceberg への変換（Unity Catalog使用）

**特徴:**
- Databricks ネイティブ
- 順序不正レコードの自動処理
- SCD Type 1/2 をサポート

### 5. Fivetran

**仕組み:**
- Fivetran の PostgreSQL コネクタでCDC取得
- Databricks Delta Lake に直接書き込み
- Unity Catalog で Iceberg 形式での読み取り

**特徴:**
- 完全マネージド
- 論理レプリケーション対応
- エンタープライズ向け

### 6. Airbyte

**仕組み:**
- Airbyte の PostgreSQL CDCコネクタ
- Databricks Lakehouse コネクタ
- Delta Lake から Iceberg への変換

**特徴:**
- オープンソース版もあり
- 認定済みコネクタ
- 豊富なコネクタエコシステム

## 比較表

| 手法 | 料金 | 安定性 | 得意分野 | 不得意分野 | 備考 |
|------|------|--------|----------|------------|------|
| **AWS DMS + Glue** | 従量課金<br/>（DMS: $0.193/時間〜）<br/>（Glue: $0.44/DPU時間） | 高 | - AWSエコシステム<br/>- 大量データ処理<br/>- バッチ＋リアルタイム | - 複雑な設定<br/>- 複数サービス管理 | AWSネイティブ、実績豊富 |
| **Data Firehose** | 従量課金<br/>（処理データ量による） | 高 | - 簡単設定<br/>- 完全マネージド<br/>- 自動スケーリング | - プレビュー段階<br/>- カスタマイズ制限 | 新サービス、将来性有望 |
| **Kafka Connect + Debezium** | インフラ費用のみ<br/>（EC2, MSK等） | 中〜高 | - 高い柔軟性<br/>- リアルタイム処理<br/>- オープンソース | - 運用が複雑<br/>- 専門知識必要 | 2024年にDatabricksが買収 |
| **Delta Live Tables** | Databricks料金<br/>（$0.30/DBU時間〜） | 高 | - Databricksネイティブ<br/>- 自動最適化<br/>- SCD対応 | - Databricks依存<br/>- 学習コスト | Databricks内で完結 |
| **Fivetran** | MAR課金<br/>（$700-2,667/月〜<br/>200万行時） | 高 | - 完全マネージド<br/>- エンタープライズ対応<br/>- 豊富な機能 | - 高額<br/>- 予算管理困難 | 大量データで急激にコスト増 |
| **Airbyte** | データ量による<br/>（OSS版は無料） | 中 | - オープンソース<br/>- 豊富なコネクタ<br/>- 柔軟な価格 | - 運用負荷<br/>- サポート制限 | コストパフォーマンス良好 |

## 推奨事項

### 小〜中規模（〜10TB）
- **Amazon Data Firehose**（プレビュー版でも可）
    - プレビュー版なので動作保証が確約されていないので要注意
- **Airbyte**（コスト重視）

### 大規模（10TB〜）
- **AWS DMS + Glue**（AWS環境）
- **Kafka Connect + Debezium**（オンプレミス併用）

### エンタープライズ
- **Fivetran**（予算十分）
- **Delta Live Tables**（Databricks中心）

## 実装時の注意点

### Aurora PostgreSQL 設定
- `wal_level = logical` の設定が必要
- `max_replication_slots` と `max_wal_senders` の調整
- PostgreSQL 10以上が必要

### Databricks 設定
- Unity Catalog の有効化
- Iceberg サポートの有効化
- Delta to Iceberg の変換設定

### パフォーマンス最適化
- 適切なパーティション設計
- CDC頻度の調整
- データ圧縮の設定

## まとめ

Aurora PostgreSQL から Databricks Iceberg への CDC レプリケーションは、要件と予算に応じて複数の選択肢があります。完全マネージドを重視する場合は Amazon Data Firehose や Fivetran、コストを抑えたい場合は Airbyte や Kafka Connect、AWS エコシステムを活用する場合は AWS DMS + Glue が適しています。

プレビュー段階の Amazon Data Firehose は将来性が高く、GA 後は有力な選択肢となる可能性があります。

以上<br/>
参考になれば幸いです。
