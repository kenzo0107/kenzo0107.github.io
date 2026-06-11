---
title: LLM 監視ツール比較 Langfuse vs Datadog LLM Observability
date: 2026-06-11
category: Monitoring
tags:
  - LLM
  - Langfuse
  - Datadog
  - Observability
---

LLM 監視ツールの Langfuse と Datadog LLM Observability を一次資料（公式ドキュメント・GitHub）をもとに比較しました。

※ 本記事は **2026年6月11日時点**の調査です。両者とも変化の速い領域のため、導入前に最新の公式ドキュメントの確認を推奨します。

<!-- more -->

## 結論

| 重視するポイント | おすすめ |
|---|---|
| データ主権（セルフホスト・エアギャップ環境）、プロンプト管理、OSS | **Langfuse** |
| 既に Datadog を利用中、計装の手軽さ、マネージド評価・セキュリティ統合 | **Datadog** |

両者とも「トレーシング + 評価 + セキュリティ系機能」という構成は共通ですが、提供モデルが対照的です。

- **Langfuse**: 中核機能がすべて MIT ライセンスの OSS。セルフホスト可能で利用量制限なし
- **Datadog**: SaaS 専用。自動計装とマネージド評価、既存 Datadog 基盤（APM / ログ / Sensitive Data Scanner）との統合が強み

※ Datadog 側は「LLM Observability」から「**Agent Observability**」へ改称が進行中です（2026年6月時点）。

## 比較表

| 観点 | Langfuse | Datadog |
|---|---|---|
| デプロイ | セルフホスト / Cloud 両対応、エアギャップ可 | SaaS のみ |
| ライセンス | 中核は MIT（Enterprise 機能は商用） | プロプライエタリ |
| トレーシング | プロンプト・応答・トークン・コスト・ツール呼び出しを構造化記録 | 自動計装でコード変更ほぼ不要 |
| 評価 | LLM-as-a-Judge、実験、データセット | マネージド評価 + 9種テンプレート + Custom LLM-as-a-Judge |
| プロンプト管理 | あり（バージョニング・デプロイ） | 確認できず |
| ガードレール | （公式に明確な記載を確認できず） | Sensitive Data Scanner 統合 + AI Guard（Preview） |
| 既存 APM との統合 | 標準では弱い | APM / ログ / RUM と同一基盤 |

## Langfuse

### メリット

**1. 中核機能がすべて MIT ライセンス・利用量無制限**

トレーシング、LLM-as-a-Judge 評価、プロンプト管理、実験、データセット、アノテーション、プレイグラウンドまで MIT ライセンスで提供されます。GitHub README にも「MIT licensed, except for the ee folders」と明記されています。

**2. セルフホスト可能・エアギャップ環境でも動作**

公式が「ラップトップからエアギャップクラスタまで人為的な利用上限なしに実行できる」と明言しており、データを社外に出せない要件（医療・金融等）に適合します。

**3. プロンプト管理を明確に提供**

バージョニング・デプロイを含むプロンプト管理機能があり、今回の調査で Datadog 側には確認できなかった差別化要素です。

**4. LLM 特化のトレーシングデータモデル**

プロンプト・応答・トークン使用量・レイテンシ・ツール呼び出し・リトリーバルステップを構造化記録します。コスト / トークン追跡は generation / embedding 型オブザベーションが対象です。

### デメリット

- **Enterprise 機能は商用ライセンスが必要**: セルフホスト時、SCIM・監査ログ・データ保持ポリシー等は OSS 版に含まれません
- **運用負担は自前**: v3 では ClickHouse 等を含むインフラの構築・運用を自分たちで担う必要があります
- **既存 APM・ログ基盤との一体運用は標準では得られない**

**参考**:
- [Langfuse Open Source](https://langfuse.com/docs/open-source)
- [Langfuse Self-Hosting](https://langfuse.com/self-hosting)
- [Langfuse Pricing (Self-Host)](https://langfuse.com/pricing-self-host)
- [GitHub - langfuse/langfuse](https://github.com/langfuse/langfuse)

## Datadog LLM Observability（Agent Observability）

### メリット

**1. 自動計装でコード変更がほぼ不要**

OpenAI・LangChain・AWS Bedrock・Anthropic・Vertex AI 等と統合し、プロンプト / 出力・トークン使用量とコスト・レイテンシ・エラー・モデルパラメータ（temperature 等）を自動キャプチャします（SDK 有効化の設定自体は必要）。

**2. 多層的なマネージド評価**

- UI からコード不要で公開できるマネージド評価
- 自然言語で評価ロジックを定義する Custom LLM-as-a-Judge
- 9種の公式テンプレート（Hallucination、Prompt Injection、Toxicity、エージェント向けの Tool Selection / Tool Argument Correctness 等）

全評価が個々のスパンに紐付き、評価根拠となった入出力をトレース上で確認できます。

**3. 既存 Datadog 基盤との統合**

ログ / APM / RUM と同じ Sensitive Data Scanner で LLM 入出力の機密情報を自動検出・リダクションできます（10K リクエストごとに 1GB の SDS 割当をバンドル）。本番トラフィックの自動トピッククラスタリング「Patterns」や異常検知の Insights も提供されます。

**4. リアルタイムガードレール「AI Guard」**

プロンプトインジェクション・ジェイルブレイク・ツール誤用・機密データ持ち出しからの保護を謳います（**Preview 段階**）。

**5. 多言語 SDK**

Python（3.7+）/ Node.js（16+）/ Java（8+）に対応。llm・workflow・agent・tool・task・embedding・retrieval の7種のスパン種別と親子関係の自動トレースをサポートします。

### デメリット

- **セルフホスト不可（SaaS 専用）**: データは Datadog に送信されます。Langfuse との最大の構造的差異です
- **プロンプト管理機能は確認できず**: バージョニング・デプロイといった機能は公式ドキュメントから確認できませんでした
- **Datadog エコシステムへのロックイン**: 評価・SDS・Patterns 等の強みは Datadog 契約が前提です
- **AI Guard は Preview**: GA 時期・課金は未確定です

**参考**:
- [Datadog Agent Observability](https://docs.datadoghq.com/llm_observability/)
- [Evaluations](https://docs.datadoghq.com/llm_observability/evaluations/)
- [SDK Reference](https://docs.datadoghq.com/llm_observability/instrumentation/sdk/)
- [AI Guard](https://docs.datadoghq.com/security/ai_guard/)

## 注意点

- **料金の具体的な数値は本記事では扱っていません**。Datadog の LLM リクエスト単価や Langfuse Cloud の料金ティアは変動があるため、[Langfuse Pricing](https://langfuse.com/pricing) と [Datadog Pricing](https://www.datadoghq.com/pricing/list/) を直接確認してください
- Langfuse の既存 APM 統合（OpenTelemetry 連携の深さ）は今回未検証です
- Datadog はリブランド進行中でドキュメント URL・名称が変わる可能性があります

## まとめ

- **Langfuse**: OSS・セルフホストでデータ主権とコスト統制を握りたい、プロンプト管理まで一体で使いたいチーム向け
- **Datadog**: 既に Datadog で監視基盤を構築済みで、自動計装とマネージド評価・セキュリティ統合を手早く使いたいチーム向け
