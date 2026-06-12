---
title: LLM 監視ツール比較 Langfuse vs Datadog LLM Observability
date: 2026-06-11
categories:
  - [Monitoring]
  - [AI]
lang: ja
translation_id: langfuse-vs-datadog-llm-observability
categories:
- [Monitoring]
- [AI]
tags:
  - LLM
  - Langfuse
  - Datadog
  - Observability
cover: https://i.imgur.com/0WWWDfD.png
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
| OpenTelemetry | OTLP 受信対応（GenAI 規約準拠） | GenAI 規約スパンを直接取り込み（SDK 不要） |
| AWS との親和性 | 公式 Terraform モジュールでセルフホスト、Bedrock / AgentCore 連携 | Bedrock 自動計装、Bedrock Agents / SageMaker 統合 |

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

## 料金比較（2026年6月時点）

### Langfuse Cloud

| プラン | 月額 | 含まれるユニット | 超過分 | データ保持 |
|---|---|---|---|---|
| Hobby | 無料 | 50k/月 | なし（上限） | 30日 |
| Core | $29 | 100k/月 | $8/100k〜 | 90日 |
| Pro | $199 | 100k/月 | $8/100k〜 | 3年 |
| Enterprise | $2,499 | 100k/月 | $8/100k〜 | 3年 |

- 課金単位（ユニット）は**トレース・オブザベーション・スコアを含むすべてのトレースデータポイント**
- 超過分は段階制: 〜1M は $8/100k、1M〜10M は $7/100k、最大 $6/100k まで逓減
- セルフホスト（OSS）は**無制限・無料**（Enterprise 機能のみ商用ライセンス）

### Datadog LLM Observability（Agent Observability）

| プラン | 月額 | 含まれる LLM スパン | データ保持 |
|---|---|---|---|
| Free | 無料 | 40k/月 | 15日 |
| Pro | $160〜 | 100k/月（超過は従量課金） | 15日（有償で 30/60/90日に延長可） |

- 課金単位（LLM スパン）は **LLM プロバイダーへの1回の呼び出し**。評価（Evals）に別途課金はなく、評価が発行する LLM 呼び出しも LLM スパンとして計上される
- Sensitive Data Scanner は 10K リクエストごとに 1GB 分が利用料に含まれる
- 超過分の公表単価は料金ページに明示がないため、契約時に要確認

### 比較時の注意

**課金単位が異なるため、単純な数量比較はできません**。Langfuse は1トレース内のオブザベーションやスコアも個別にカウントするのに対し、Datadog は LLM 呼び出しのみをカウントします。同じアプリケーションでも計上数は大きく変わります。

また、Langfuse はセルフホストすれば利用量課金がゼロになる（インフラ費は別途）のに対し、Datadog は SaaS のみのため利用量に比例した課金が常に発生します。

**参考**:
- [Langfuse Pricing](https://langfuse.com/pricing) / [Pricing (Self-Host)](https://langfuse.com/pricing-self-host)
- [Datadog Agent Observability](https://www.datadoghq.com/products/ai/agent-observability/)

## OpenTelemetry との親和性

結論: **どちらも OTel GenAI セマンティック規約ベースのトレースを直接受信でき、親和性は高い**です。ただし対応範囲に差があります。

| 観点 | Langfuse | Datadog |
|---|---|---|
| OTLP 受信 | `/api/public/otel`（HTTP/JSON, HTTP/protobuf） | OTLP エンドポイント（http/protobuf + `dd-otlp-source=llmobs` ヘッダー） |
| gRPC | 未対応 | — |
| GenAI セマンティック規約 | 準拠（規約が進化中のため `langfuse.*` 属性を優先） | OTel 1.37+ の GenAI 規約スパンを直接取り込み可（SDK / Agent 不要） |
| OTel ベース計装ライブラリ | OpenLIT、OpenLLMetry、Arize、MLflow 等 | OpenLLMetry v0.47+ 対応 / **OpenInference・OpenLLMetry v0.47 未満は非対応** |
| OTel Collector | 設定例あり（フィルタリング可） | Datadog Distribution of OTel Collector（DDOT）あり |
| 制限 | トレースレベル属性（userId 等）は全スパンへの伝播が必要 | OTel 経由はトレース表示に 3〜5分の遅延、APM トレースにも記録され得る |

- Langfuse は OTel SDK / Collector から環境変数設定だけで送信でき、EU / US / **Japan** / HIPAA リージョンのエンドポイントを提供
- Datadog は OTel 経由でも Prompt Tracking・Experiments・外部評価に対応。ベンダー非依存の計装（OTel）を選んでもどちらにも送信できるため、**OTel で計装しておけば将来の乗り換えコストを抑えられます**

**参考**:
- [Langfuse OpenTelemetry Integration](https://langfuse.com/integrations/native/opentelemetry)
- [Datadog OTel Instrumentation for Agent Observability](https://docs.datadoghq.com/llm_observability/instrumentation/otel_instrumentation/)
- [Datadog Distribution of OTel Collector](https://docs.datadoghq.com/opentelemetry/setup/ddot_collector/)

## AWS との親和性

結論: **アプローチが異なります**。Langfuse は「AWS 上にセルフホストする基盤」として、Datadog は「Bedrock を自動計装する SaaS」として親和性が高いです。

### Langfuse

- **公式 Terraform モジュール**（[langfuse/langfuse-terraform-aws](https://langfuse.com/changelog/2025-05-22-terraform-modules)）で AWS セルフホストを公式サポート。VPC・RDS・S3・ElastiCache を含む高可用構成を ECS Fargate 上にデプロイ（Langfuse Cloud 自体も ECS Fargate で運用）
- **Amazon Bedrock 計装**: LangChain / LlamaIndex / Vercel AI SDK 等のフレームワーク経由、または SDK デコレータによる手動計装。トークン数・モデル ID・パラメータ・エラーを記録
- **Bedrock AgentCore 対応**: AgentCore ランタイムから OTel 経由でトレースを受信（ADOT の無効化設定が必要）。エージェント実行フロー・ツール呼び出し・MCP インタラクションを可視化
- プラットフォーム内部（Playground / Evals）の Bedrock 接続で **AWS SDK デフォルト認証プロバイダーチェーン**（IAM ロール等）を利用可能

### Datadog

- **Bedrock の自動計装**: Bedrock Runtime SDK（boto3 / botocore）の呼び出しをコード変更なしでトレース。Java SDK も Bedrock 対応
- **Bedrock Agents の監視統合**: レイテンシ・エラー率・トークン使用量・ツール呼び出しの詳細を自動取得（[AWS 公式ブログ](https://aws.amazon.com/blogs/machine-learning/monitor-agents-built-on-bedrock-with-datadog-llm-observability/)でも紹介）
- **SageMaker インテグレーション**: ML エンドポイント / ジョブのメトリクス収集・可視化・アラート（既存の Datadog AWS インテグレーションの一部）
- ただしバックエンドは Datadog SaaS のため、トレースデータは AWS 外（Datadog）に送信される

**参考**:
- [Deploy Langfuse on AWS with Terraform](https://langfuse.com/self-hosting/deployment/aws)
- [Langfuse - Amazon Bedrock](https://langfuse.com/integrations/model-providers/amazon-bedrock) / [Bedrock AgentCore](https://langfuse.com/integrations/frameworks/amazon-agentcore)
- [Datadog - Monitor agents built on Amazon Bedrock](https://www.datadoghq.com/blog/llm-observability-bedrock-agents/)
- [Datadog - Amazon SageMaker](https://www.datadoghq.com/blog/monitor-sagemaker-with-datadog/)

## 注意点
- Datadog はリブランド進行中でドキュメント URL・名称が変わる可能性があります

## まとめ

- **Langfuse**: OSS・セルフホストでデータ主権とコスト統制を握りたい、プロンプト管理まで一体で使いたいチーム向け
- **Datadog**: 既に Datadog で監視基盤を構築済みで、自動計装とマネージド評価・セキュリティ統合を手早く使いたいチーム向け
