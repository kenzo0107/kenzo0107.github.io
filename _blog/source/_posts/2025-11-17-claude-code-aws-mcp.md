---
title: Claude Code + AWS 関連MCP で調査を円滑にする
date: 2025-11-17
---

Claude Code + MCP で自然言語で調査指示できる様になった話です。

<!-- more -->

## 事前準備

- uv 導入

```console
curl -LsSf https://astral.sh/uv/install.sh | sh
```

- awsume で MFA 回避用 profile 作成

```console
awsume dummy --output-profile dummy-tmp
```

## Claude Code + CloudWatch Logs MCP　でログ調査

```console
claude mcp add -s user aws-cwlogs \
  -e AWS_PROFILE="dummy-tmp" \
  -e AWS_REGION="ap-northeast-1" \
  -e FASTMCP_LOG_LEVEL="ERROR" \
  -- uvx awslabs.cloudwatch-logs-mcp-server@latest
```

<details>
<summary>例: ロググループの一覧を出して</summary>

```console
claude

> ロググループの一覧を出して

> ⏺ AWSのCloudWatchロググループの一覧を取得しますね。

⏺ Bash(aws logs describe-log-groups --query 'logGroups[*].[logGroupName,creationTime,storedBytes]' --outpu
t table)
  ⎿  -----------------------------------------------------------------------------------------
     |                                   DescribeLogGroups                                   |
     +---------------------------------------------------------+----------------+------------+
     … +28 lines (ctrl+o to expand)

⏺ CloudWatchロググループの一覧を取得しました。以下の情報が表示されています：

  ロググループ概要

  | ロググループ名                                                | 作成時刻          | 保存容量(bytes) |
  |--------------------------------------------------------|---------------|-------------|
  | /aws/codebuild/dummy-build-ecrm                    | 1762390572331 | 4,150       |
  | /aws/ecs/autoscaling/dummy-app                     | 1762996301329 | 0           |
  | /aws/ecs/containerinsights/dummy-main/performance | 1756366249199 | 0           |
  | /aws/rds/cluster/dummy-cluster/postgresql         | 1756195223282 | 10,705,811  |
  | RDSOSMetrics                                           | 1756195285485 | 53,837,909  |

  その他、CodeBuildやECSのアプリケーション固有のロググループも複数存在しています。

  最も容量が大きいのはRDSOSMetrics（約51MB）で、次に/aws/rds/cluster/dummy-cluster/postgresql（約10MB
）となっています。
```
</details>


## Claude Code + Cost Explorer MCP　でコスト調査

```console
claude mcp add -s user aws-ce \
  -e AWS_PROFILE="dummy-tmp" \
  -e AWS_REGION="ap-northeast-1" \
  -e FASTMCP_LOG_LEVEL="ERROR" \
  -- uvx awslabs.cost-explorer-mcp-server@latest
```

<details>
<summary>例: aws-ce MCPを使って AWSアカウント 123456789012 の先月の料金は？</summary>

```console
claude

> aws-ce MCPを使って AWSアカウント 123456789012 の先月の料金は？

⏺ AWS アカウント 123456789012 - 2025年10月の料金

  合計料金: $246.06

  サービス別内訳（上位項目）

  | サービス                               | 料金（USD） |
  |------------------------------------|---------|
  | Amazon Relational Database Service |  $87.08 |
  | EC2 - Other                        |  $50.54 |
  | Tax（税金）                            |  $22.36 |
  | Amazon Elastic Load Balancing      |  $18.08 |
  | Amazon Inspector                   |  $16.64 |
  | Amazon CloudWatch                  |  $12.65 |
  | AWS WAF                            |   $9.00 |
  | AWS Key Management Service         |   $8.00 |
  | CodeBuild                          |   $4.06 |
  | Amazon Virtual Private Cloud       |   $3.72 |
  | Amazon Elastic Container Service   |   $3.60 |
  | Amazon GuardDuty                   |   $3.19 |
  | AWS CodePipeline                   |   $2.23 |

  主要コスト要因

  1. RDS（$87.08） - 最大のコスト要因
  2. EC2 - Other（$50.54） - EC2関連の追加コスト
  3. ELB（$18.08） - ロードバランサー
  4. セキュリティサービス - Inspector（$16.64）、GuardDuty（$3.19）、Security Hub（$1.28）

  税金を除いた実際のAWSサービス利用料金は $223.70 でした。
```
</details>

## Claude Code + AWS Pricing MCP　で料金確認

```console
claude mcp add -s user aws-price \
  -e AWS_PROFILE="dummy-tmp" \
  -e AWS_REGION="ap-northeast-1" \
  -e FASTMCP_LOG_LEVEL="ERROR" \
  -- uvx awslabs.aws-pricing-mcp-server@latest
```

<details>
<summary>例: aws-price MCP を利用し Aurora Serverless v2 と db.t4g.medium 2台で 1年全額前払いのリザーブドインスタンスだとどちらが安いか損益分岐点を求めてください。</summary>

```console
claude

> aws-price MCP を利用し Aurora Serverless v2 と db.t4g.medium 2台で 1年全額前払いのリザーブドインスタンスだとどちらが安いか損益分岐点を求めてください。

  前提条件・料金設定

  Aurora Serverless v2（東京リージョン）

  - ACU料金: $0.15/時間（2024年11月値下げ後）
  - 最小容量: 0.5 ACU
  - スケール範囲: 0.5〜128 ACU
  - ストレージ: $0.10/GB月（別途課金）

  Aurora PostgreSQL Reserved Instance - db.t4g.medium（東京リージョン）

  - スペック: 2 vCPU、4GB RAM
  - On-Demand料金: 約$0.09/時間（東京リージョン推定）
  - Reserved Instance（1年、No Upfront）: 約$0.063/時間（30%割引）
  - Reserved Instance（3年、All Upfront）: 約$0.031/時間（65%割引）
  - 2インスタンス: Writer 1台 + Reader 1台

  月額コスト比較

  Aurora Serverless v2 使用量別コスト

  | 平均ACU   | 月額コスト | 想定リソース使用量      |
  |---------|-------|----------------|
  | 0.5 ACU | $54   | 軽負荷（1GB RAM相当） |
  | 1.0 ACU | $108  | 中負荷（2GB RAM相当） |
  | 1.5 ACU | $162  | 高負荷（3GB RAM相当） |
  | 2.0 ACU | $216  | 高負荷（4GB RAM相当） |
  | 3.0 ACU | $324  | 負荷集中時          |

  Aurora PostgreSQL Reserved Instance（2台）コスト

  | 契約タイプ          | 月額コスト | 備考                        |
  |----------------|-------|---------------------------|
  | 1年 No Upfront  | $90.7 | ($0.063 × 2台 × 24h × 30日) |
  | 3年 All Upfront | $44.6 | ($0.031 × 2台 × 24h × 30日) |

  損益分岐点分析

  1年契約 Reserved Instance（$90.7/月）との比較

  損益分岐点: 0.84 ACU/月平均
  - Aurora Serverless v2が有利：平均0.84 ACU未満
  - Reserved Instanceが有利：平均0.84 ACU以上

  3年契約 Reserved Instance（$44.6/月）との比較

  損益分岐点: 0.41 ACU/月平均
  - Aurora Serverless v2が有利：平均0.41 ACU未満
  - Reserved Instanceが有利：平均0.41 ACU以上

  使用パターン別シナリオ

⏺ シナリオ1: 開発・テスト環境

  使用パターン: 平日9-18時のみ稼働（40%稼働率）
  - Serverless v2: 0.5 ACU × 0.4 = 平均0.2 ACU → $21.6/月
  - 1年RI: $90.7/月（常時課金）
  - 結果: Serverless v2が約70%安い

  シナリオ2: 変動負荷本番環境

  使用パターン: 夜間0.5 ACU、日中1.5 ACU（平均0.8 ACU）
  - Serverless v2: 平均0.8 ACU → $86.4/月
  - 1年RI: $90.7/月
  - 結果: Serverless v2がわずかに安い

  シナリオ3: 安定負荷本番環境

  使用パターン: 常時1.2 ACU程度の負荷
  - Serverless v2: 1.2 ACU → $129.6/月
  - 1年RI: $90.7/月
  - 結果: Reserved Instanceが30%安い

  シナリオ4: 高負荷本番環境

  使用パターン: 常時2.0 ACU程度の負荷
  - Serverless v2: 2.0 ACU → $216/月
  - 3年RI: $44.6/月
  - 結果: Reserved Instanceが79%安い

  リソース使用量の目安

  db.t4g.medium（4GB RAM）との等価性

  - 1 ACU ≈ 2GB RAM → db.t4g.medium ≈ 2 ACU
  - db.t4g.mediumと同等の処理能力には約2 ACUが必要

  実際のワークロード対応

  - 軽負荷: 0.5-1.0 ACU（開発環境、小規模アプリ）
  - 中負荷: 1.0-2.0 ACU（通常のWebアプリケーション）
  - 高負荷: 2.0+ ACU（大規模アプリケーション、分析処理）

  追加コスト要素

  Serverless v2の注意点

  - CPU Credits: T4gインスタンスのCPU Credits（$0.09/vCPU時間）はない
  - I/O Cost: 含まれる（Aurora Standardの場合）
  - スケール遅延: 負荷変動時の数十秒のスケール時間

  Reserved Instanceの注意点

  - CPU Credits: $0.09/vCPU時間の追加料金（バースト時）
  - 固定コスト: 使用量に関係なく固定課金
  - 柔軟性: サイズ変更はInstance Family内で可能

  推奨判断基準

⏺ Aurora Serverless v2を選ぶべき場合

  1. 開発・テスト環境（非稼働時間が多い）
  2. 変動負荷（平均0.8 ACU未満）
  3. 予測困難な負荷パターン
  4. 運用開始初期（負荷が見えない段階）
  5. 短期プロジェクト（1年未満）

  Aurora PostgreSQL Reserved Instanceを選ぶべき場合

  1. 安定した本番環境（平均1.0 ACU以上）
  2. 予測可能な負荷
  3. 長期運用確定（1年以上）
  4. コスト最適化重視
  5. CPU集約的ワークロード

  まとめ

  損益分岐点

  - 1年RI: 平均0.84 ACU（約1.7GB RAM使用量）
  - 3年RI: 平均0.41 ACU（約0.8GB RAM使用量）

  実用的な選択指針

  1. 月間平均メモリ使用量 < 1.5GB → Serverless v2
  2. 月間平均メモリ使用量 > 3GB → Reserved Instance
  3. 1.5-3GBの範囲 → 負荷変動パターンで判断

  重要な考慮事項

  - Reserved Instanceは3年契約で最大79%の節約
  - Serverless v2は運用柔軟性で優位
  - 実際のワークロード測定が最も重要な判断材料

  2024年11月の値下げにより、Aurora Serverless v2の競争力が大幅に向上し、中負荷環境でもReserved
  Instanceと遜色ないコストパフォーマンスを実現しています。
```

</details>


## Claude Code + AWS Documentation MCP　でドキュメント参照

```console
claude mcp add -s user aws-docs \
  -e AWS_PROFILE="dummy-tmp" \
  -e AWS_REGION="ap-northeast-1" \
  -e FASTMCP_LOG_LEVEL="ERROR" \
  -- uvx awslabs.aws-documentation-mcp-server@latest
```

<details>

<summary>例: aws-docs MCP を使って CloudFront 署名付きURLで S3 Object を参照させる際の
CloudFront の設定を教えて</summary>

```console
claude

> aws-docs MCP を使って CloudFront 署名付きURLで S3 Object を参照させる際の
CloudFront の設定を教えて

⏺ CloudFrontで署名付きURLを使ってS3オブジェクトを参照させる設定について、AWS
  公式ドキュメントを基にまとめます。

  CloudFront 署名付きURL + S3 オリジンの設定

  1. Origin Access Control (OAC) の設定

  S3バケットポリシーの設定
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "AllowCloudFrontServicePrincipalReadOnly",
        "Effect": "Allow",
        "Principal": {
          "Service": "cloudfront.amazonaws.com"
        },
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::your-bucket-name/*",
        "Condition": {
          "StringEquals": {
            "AWS:SourceArn":
  "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/DISTRIBUTION-ID"
          }
        }
      }
    ]
  }

  2. Trusted Key Groups の設定

  公開鍵/秘密鍵ペアの作成
  - RSA 2048またはECDSA 256キーをサポート
  - CloudFrontコンソールまたはAPIでキーグループを作成
  - 公開鍵をキーグループに追加

  3. CloudFront Distribution の設定

  Cache Behavior の設定
  - 署名が必要なパスパターンを設定
  - Trusted Key Groupを指定
  - Origin Access Controlを有効化

  重要な設定項目
  - Origin Access Control: "Sign requests (recommended)" を選択
  - Viewer Protocol Policy: HTTPSの使用を推奨
  - Trusted Key Groups: 署名に使用するキーグループを指定

  4. 署名付きURLの生成

  Canned Policy と Custom Policy の選択

  | 機能          | Canned Policy | Custom Policy |
  |-------------|---------------|---------------|
  | 複数ファイルでの再利用 | ✗             | ✓             |
  | アクセス開始時刻の指定 | ✗             | ✓             |
  | IPアドレス制限    | ✗             | ✓             |
  | URL長        | 短い            | 長い（ポリシー含有）    |

  URLフォーマット例
  https://d1234567890.cloudfront.net/private-content.jpg?Policy=eyJ...&Signa
  ture=abc...&Key-Pair-Id=K1234567890

  5. セキュリティ考慮事項

  必須設定
  - S3バケットへの直接アクセスを制限
  - Origin Access Control (OAC) の使用（OAIより推奨）
  - HTTPS通信の強制
  - 適切な有効期限の設定

  SSE-KMS使用時の追加設定
  KMSキーポリシーにCloudFrontアクセス許可を追加：
  {
    "Sid": "AllowCloudFrontServicePrincipalSSE-KMS",
    "Effect": "Allow",
    "Principal": {
      "Service": ["cloudfront.amazonaws.com"]
    },
    "Action": [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:GenerateDataKey*"
    ],
    "Resource": "*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn":
  "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/DISTRIBUTION-ID"
      }
    }
  }

  6. 実装フロー

  1. ユーザー認証: アプリケーションでユーザーの権限を確認
  2. 署名付きURL生成: 秘密鍵を使用してURLに署名
  3. URLの提供: 認証済みユーザーに署名付きURLを返却
  4. コンテンツアクセス:q
  CloudFrontが署名を検証し、有効な場合のみS3からコンテンツを配信

  この設定により、S3オブジェクトへの安全なアクセス制御が実現できます。
```

</details>

## Claude Code + AWS Terraform MCP で実装

```console
claude mcp add -s user aws-terraform-provider \
  -e AWS_PROFILE="dummy-tmp" \
  -e AWS_REGION="ap-northeast-1" \
  -e FASTMCP_LOG_LEVEL="ERROR" \
  -- uvx awslabs.terraform-mcp-server@latest
```

## Claude Code + AWS Diagram MCP で簡易的な構成図を書かせる

```console
claude mcp add -s user aws-diagram \
  -e AWS_PROFILE="dummy-tmp" \
  -e AWS_REGION="ap-northeast-1" \
  -e FASTMCP_LOG_LEVEL="ERROR" \
  -- uvx awslabs.aws-diagram-mcp-server@latest
```

<details>
<summary>aws-diagram MCP を利用して NAT Gateway でリージョナルとゾーナルの構成図を簡易的に記載して</summary>

## NAT Gatewayの基本アーキテクチャ

### ゾーナルNAT Gateway（従来型）

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AZ-1a         │    │   AZ-1b         │    │   AZ-1c         │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Public Subnet│ │    │ │Public Subnet│ │    │ │Public Subnet│ │
│ │             │ │    │ │             │ │    │ │             │ │
│ │ NAT Gateway │ │    │ │ NAT Gateway │ │    │ │ NAT Gateway │ │
│ │   (1a)      │ │    │ │   (1b)      │ │    │ │   (1c)      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Private Sub  │ │    │ │Private Sub  │ │    │ │Private Sub  │ │
│ │             │ │    │ │             │ │    │ │             │ │
│ │ Resources   │ │    │ │ Resources   │ │    │ │ Resources   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### リージョナルNAT Gateway（新型）

```
┌─────────────────────────────────────────────────────────────────┐
│                        Regional NAT Gateway                     │
│              ┌─────────────────────────────────────────┐        │
│              │         Automatic Expansion             │        │
│              │    ┌──────┐  ┌──────┐  ┌──────┐         │        │
│              │    │ AZ-1a│  │ AZ-1b│  │ AZ-1c│         │        │
│              │    │ NAT  │  │ NAT  │  │ NAT  │         │        │
│              │    └──────┘  └──────┘  └──────┘         │        │
│              └─────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AZ-1a         │    │   AZ-1b         │    │   AZ-1c         │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Private Sub  │ │    │ │Private Sub  │ │    │ │Private Sub  │ │
│ │             │ │    │ │             │ │    │ │             │ │
│ │ Resources   │ │    │ │ Resources   │ │    │ │ Resources   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

</details>

<br/>

適宜追加していきます。

以上<br>
参考になれば幸いです。
