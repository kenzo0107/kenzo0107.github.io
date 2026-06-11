---
title: RDS Performance Insights が 2026年6月に EOL、 Database Insights への移行を考える
date: 2025-12-05
category: AWS
cover: https://i.imgur.com/wzeyuhw.png
---

## 概要

Performance Insights は 2026年6月30日にデプリケートされる予定です。

{% linkPreview https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_PerfInsights.html _blank %}

> AWS has announced the end-of-life date for Performance Insights: June 30, 2026.

継続してパフォーマンスインサイト相当の機能を利用するには Performance Insights から CloudWatch Database Insights への移行する必要があります。

それぞれの機能差やコストについてまとめました。

<!-- more -->


## モード比較

| 項目 | Performance Insights | Database Insights Standard | Database Insights Advanced |
|------|---------------------|---------------------------|----------------------------|
| **コスト** | $4.76/月 (2vCPU) | 無料 | $18.25/月 (2vCPU) |
| **保持期間** | 7日〜15ヶ月 | 7日 | 15ヶ月 |
| **フリート監視** | ❌ | ✅ | ✅ |
| **統合ダッシュボード** | ❌ | 基本機能 | ✅ |

Database Insights には Standard と Advanced モードがあります。

## Database Insights Standard VS Advanced モード機能比較表

### 共通機能（Standard & Advanced）
- ✅ DB Load の次元別分析
- ✅ データベースメトリクスのクエリ・グラフ化・アラート（7日間保持）
- ✅ SQL テキストなどの機密ディメンションへのアクセス制御

### Advanced Mode 専用機能

| 機能カテゴリ | 機能詳細 | 対応エンジン | 前提条件 |
|-------------|---------|-------------|----------|
| **監視・分析** | OSプロセス詳細監視 | 全エンジン | Enhanced Monitoring必須 |
| **フリート管理** | フリート全体監視ビューの定義・保存 | 全エンジン | - |
| **SQL分析** | SQLロック分析（15ヶ月保持） | Aurora PostgreSQL のみ | - |
| **実行プラン** | SQL実行プラン分析（15ヶ月保持） | Aurora PostgreSQL、RDS Oracle、RDS SQL Server | - |
| **クエリ統計** | クエリ別統計の可視化 | 全エンジン | - |
| **スロークエリ** | スロークエリ分析 | 全エンジン | CloudWatch Logs出力必須 |
| **アプリケーション** | CloudWatch Application Signals連携 | 全エンジン | - |
| **統合ダッシュボード** | メトリクス・ログ・イベント・アプリ統合 | 全エンジン | ログ出力必須 |
| **自動統合** | Performance Insightsメトリクスの自動インポート | 全エンジン | - |
| **イベント監視** | RDSイベントのCloudWatch表示 | 全エンジン | - |
| **オンデマンド分析** | 任意期間のパフォーマンス分析 | Aurora PostgreSQL/MySQL、RDS PostgreSQL/MySQL/MariaDB/Oracle | - |

## 重要な制限事項

### エンジン依存機能
- **SQLロック分析**: Aurora PostgreSQL のみ
- **実行プラン分析**: Aurora PostgreSQL、RDS Oracle、RDS SQL Server のみ
- **オンデマンド分析**: MySQL系、PostgreSQL系、Oracle のみ（SQL Server除く）

### 前提条件
1. **Advanced Mode有効化**: Performance Insights の有効化が必須
2. **スロークエリ分析**: CloudWatch Logs への出力設定が必要
3. **統合ダッシュボード**: ログ出力設定が必要（ログ表示のため）
4. **OSプロセス監視**: Enhanced Monitoring の有効化が必要

### 地域制限
- すべてのAWSリージョンでAdvanced Mode機能が利用可能ではない

## 選択指針

### Standard Mode が適している場合
- 基本的なDB監視で十分
- コストを抑えたい
- 7日間のデータ保持で十分

### Advanced Mode が必要な場合
- フリート全体の一元監視が必要
- 長期的なトレンド分析（15ヶ月）が必要
- SQL実行プランやロック分析が必要
- アプリケーションとの統合監視が必要

## まとめ

- Advanced Mode は高機能ですが、エンジン依存や前提条件があります。
- 最初は Standard モードで利用し、より詳細なボトルネック調査したい場合は Advanced に切り替えはアリ

組織の監視要件と対象エンジンを確認した上で適切なモードを選択してください。

## 参考

### Database Insights
- [CloudWatch Database Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Database-Insights.html)
- [Monitoring Amazon RDS databases with CloudWatch Database Insights](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DatabaseInsights.html)
- [Considerations for Database Insights for Amazon RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DatabaseInsights.Considerations.html)

### 料金情報
- [Amazon CloudWatch Pricing](https://aws.amazon.com/cloudwatch/pricing/)
- [Performance Insights Pricing](https://aws.amazon.com/rds/performance-insights/pricing/)

### 移行・比較情報 - AWS re:Post
- [Transitioning from RDS Performance Insights to CloudWatch Database Insights](https://repost.aws/articles/AR6gPnT__dQdq81Md6Q_A1mA/transitioning-from-rds-performance-insights-to-cloudwatch-database-insights)
- [Performance Insights to CloudWatch Database Insights](https://repost.aws/articles/ARelTfHKHvTBC78mc-CNVqmA/performance-insights-to-cloudwatch-database-insights)

### サードパーティ解説
- [AWS Performance Insights has been deprecated: What to know about CloudWatch Database Insights - pganalyze](https://pganalyze.com/blog/aws-performance-insights-deprecation-database-insights-comparison)
- [Transitioning from RDS Performance Insights to CloudWatch Database Insights - DoiT](https://www.doit.com/blog/transitioning-from-rds-performance-insights-to-cloudwatch-database-insights/)

### 技術仕様 - パフォーマンス監視
- [Performance Insights counter metrics](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PerfInsights_Counters.html)
- [Amazon CloudWatch metrics for Amazon RDS Performance Insights](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PerfInsights.Cloudwatch.html)

### Enhanced Monitoring
- [Enhanced Monitoring for Amazon RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_Monitoring.OS.html)
