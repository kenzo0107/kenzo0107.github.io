---
title: Kafka への流入量の試算
date: 2025-07-17
lang: ja
translation_id: aws-aurora-cdc-calculator
cover: /img/cover/2025-07-17-aws-aurora-cdc-calculator.svg
tags: [AWS, Aurora, CDC, CloudWatch, MySQL, PostgreSQL]
category: Data Analytics
---

AWS RDS の CDC を Kafka でストリーミングし Iceberg テーブルへ配信し分析基盤を構築しました。
その際に RDS のメトリクスから Kafka への流入量を試算するスクリプトを作成しましたので公開します。

SaaS への見積もりで流入量が必要だったので、スクリプトで試算した数値と合わせてスクリプトも提出した所、概ね問題ないことを確認いただけました。

<!-- more -->

流入量・流出量はコスト見積もりの要でしたが、試算方法がわからず苦戦していたので一助になればと思います。

## 背景

CDC（Change Data Capture）は、データベースの変更をリアルタイムでキャプチャして他のシステムに配信する技術です。<br/>
AWS MSK, Confluent などの SaaS 等、 CDC サービスを利用する際、適切な容量計画が重要になります。

しかし、Aurora の WriteThroughput メトリクスがそのまま CDC スループットになるわけではありません。<br/>
エンジン固有のオーバーヘッドを考慮した正確な推定が必要です。

## ツール概要

本ツールは、Aurora MySQL / PostgreSQL クラスターの CDC スループットを CloudWatch メトリクスから算出するシェルスクリプトを Claude Code と壁打ちしながら作成しました。

### 主な特徴

- **エンジン別最適化**: MySQL と PostgreSQL それぞれに特化した係数を使用
- **インタラクティブ操作**: 複数クラスターから対象を選択可能
- **包括的メトリクス**: WriteThroughput、WriteIOPS、ログ使用量を総合的に分析
- **容量計画対応**: ピーク値と平均値の両方を提供

## 技術仕様

### Aurora MySQL 分析 (aurora-mysql.sh)

https://gist.github.com/kenzo0107/610df8182f47476e263bc080d164e840

**主要メトリクス:**
- WriteThroughput（クラスター・インスタンスレベル）
- WriteIOPS（クラスター・インスタンスレベル）
- BinLogDiskUsage（MySQL固有）

**CDC 計算式:**
```
CDC throughput = WriteThroughput × 0.576
```

MySQL の binlog フォーマットとレプリケーションオーバーヘッドを考慮した係数です。

0.576 という係数は複数の Aurora MySQL で `実際のCDCスループット / WriteThroughputメトリクス` から求められた値です。<br/>
今後 Engine バージョンが変更された際にはまた異なる可能性はあります。

### Aurora PostgreSQL 分析 (aurora-postgresql.sh)

https://gist.github.com/kenzo0107/1cb26379891ee8b14773609367d5c81e

**主要メトリクス:**
- WriteThroughput（クラスター・インスタンスレベル）
- WriteIOPS（クラスター・インスタンスレベル）
- TransactionLogsDiskUsage（WAL使用量）

**CDC 計算式:**
```
CDC throughput = WriteThroughput × 0.8
```

PostgreSQL の WAL（Write-Ahead Log）オーバーヘッドを考慮した係数です。<br/>
こちらの係数も同様の試算方法です。

## 使用方法

### 実行例

```bash
# Aurora MySQL クラスターの分析
./aurora-mysql.sh

# Aurora PostgreSQL クラスターの分析
./aurora-postgresql.sh
```

### 出力例

```console
=== Aurora MySQL CDC Analysis ===

Cluster: production-mysql-cluster
Writer Instance: production-mysql-cluster-writer

=== Metrics Summary (Past 7 days) ===

Cluster WriteThroughput:
  Maximum: 24,584,000 bytes/sec
  Average: 32,674 bytes/sec

Writer Instance WriteThroughput:
  Maximum: 24,584,000 bytes/sec
  Average: 65,348 bytes/sec

BinLog Disk Usage (Max): 2,147,483,648 bytes

=== CDC Throughput Estimates ===

Based on Cluster WriteThroughput:
  Peak CDC    : 14,160,505 bytes/sec (113.284 Mbps)
  Average CDC : 18,818 bytes/sec (0.151 Mbps)

Based on Writer Instance WriteThroughput:
  Peak CDC    : 14,160,505 bytes/sec (113.284 Mbps)
  Average CDC : 37,637 bytes/sec (0.301 Mbps)
```

## 実装のポイント

### エンジン固有の最適化

**MySQL (係数: 0.576)**
- binlog のバイナリフォーマット
- レプリケーション時の圧縮効果
- イベントヘッダーのオーバーヘッド

**PostgreSQL (係数: 0.8)**
- WAL の物理ログ構造
- 論理レプリケーション時の変換コスト
- チェックサム・メタデータのオーバーヘッド

## 容量計画への活用

### 1. Confluent Cloud の設定指針

**スループット設定:**
- **最大値**: ピーク CDC × 1.2〜1.5（安全マージン）
- **平均値**: CDC パフォーマンス監視のベースライン

**パーティション数:**
```
Required partitions = Peak CDC throughput / 10 MB/s per partition
```

### 2. PostgreSQL 固有の設定

```sql
-- 論理レプリケーション有効化
ALTER SYSTEM SET rds.logical_replication = 1;

-- WAL キャッシュサイズ調整
ALTER SYSTEM SET rds.logical_wal_cache = '64MB';

-- 設定反映
SELECT pg_reload_conf();
```

## まとめ

AWS Aurora の CloudWatch Metrics から CDC スループット推定が可能になりました。<br/>
エンジン固有の係数を使用することで、ストリーミングサービス流入量の容量計画がより正確に実施できます。

**主な利点:**
- **正確性**: 実測値に基づく係数による高精度な推定
- **効率性**: CloudWatch API を活用した自動化
- **実用性**: 容量計画に直接活用できる形式での出力

このツールを活用することで、CDC パイプラインの安定運用と適切なリソース配分を実現できます。

以上<br/>
参考になれば幸いです。
