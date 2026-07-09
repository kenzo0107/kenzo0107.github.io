---
title: Langfuse 設定管理用 Terraform プロバイダー terraform-provider-langfuse を作った
category: Terraform
date: 2026-07-09
lang: ja
translation_id: terraform-provider-langfuse
cover: /img/cover/2026-07-09-terraform-provider-langfuse.svg
tags:
  - Terraform
  - Go
  - Langfuse
  - LLM
  - IaC
---

LLM 監視・評価基盤 [Langfuse](https://langfuse.com/) のプロジェクト・メンバー・プロンプト・評価設定などを Terraform で管理できるプロバイダー [kenzo0107/terraform-provider-langfuse](https://github.com/kenzo0107/terraform-provider-langfuse) を作り、Terraform Registry に公開しました。18種のリソースと1種のデータソースで、Langfuse の管理画面上の設定作業をコード化できます。

<!-- more -->

## 作った背景

Langfuse は Web UI からプロジェクト作成・メンバー招待・プロンプト管理・評価設定などをポチポチ設定できますが、環境が増えたり構成をレビュー可能な形で残したくなると、Web UI だけでは次の点が難しくなってきました。

- 開発 / 検証 / 本番など複数プロジェクトの設定を横断して同じ形に揃えたい
- 誰が何の設定を変えたか、PR で差分レビューしたい
- プロジェクト API キー・LLM 接続・カスタムモデルの価格設定などを、他の IaC（AWS リソース等）と同じワークフローで管理したい

2026年7月時点で Langfuse 公式の Terraform プロバイダーは提供されていなかったため、Langfuse の Public API を使って自作しました。Terraform Plugin Framework で実装しています。

[kenzo0107/terraform-provider-langfuse](https://github.com/kenzo0107/terraform-provider-langfuse)

## 対応しているリソース・データソース

現時点で 18 個のリソースと 1 個のデータソースをカバーしています。

### プロジェクト・認証

| リソース | 役割 |
|---|---|
| `langfuse_project` | プロジェクトの作成・管理 |
| `langfuse_project_api_key` | プロジェクトの API キー発行（`secret_key` は作成時のみ取得可能） |

データソース `langfuse_project` で既存プロジェクトを参照できます。

### メンバー・アクセス管理

| リソース | 役割 |
|---|---|
| `langfuse_organization_member` | Organization 内でのメンバーのロール（`OWNER`/`ADMIN`/`MEMBER`/`VIEWER`）管理 |
| `langfuse_project_member` | プロジェクト内でのメンバーのロール管理（対象ユーザーは事前に Organization メンバーである必要あり） |
| `langfuse_scim_user` | SCIM 経由のユーザー管理（Organization スコープの SCIM 権限付き API キーが必要） |

### プロンプト・データセット

| リソース | 役割 |
|---|---|
| `langfuse_prompt` | プロンプトの管理。更新すると新しいバージョンが作られる |
| `langfuse_dataset` | データセットの管理（API 側が削除に未対応のため、destroy は Terraform state からの削除のみ） |
| `langfuse_dataset_item` | データセット内アイテムの管理 |

### 評価・スコアリング

| リソース | 役割 |
|---|---|
| `langfuse_score` | スコアの記録（全属性 immutable、変更は re-create） |
| `langfuse_score_config` | スコアの評価基準定義（削除非対応、destroy は archive 化） |
| `langfuse_evaluator` | LLM-as-a-Judge 等の Evaluator 定義（⚠️ Langfuse の unstable API `/api/public/unstable/` を使用） |
| `langfuse_evaluation_rule` | Evaluator をトレースに適用するルール（⚠️ 同じく unstable API を使用） |
| `langfuse_annotation_queue` | 人手レビュー用のアノテーションキュー |
| `langfuse_annotation_queue_item` | キューに追加するトレース／オブザベーション |
| `langfuse_comment` | トレース・オブザベーション・セッション・プロンプトへのコメント（API 側が更新・削除に未対応） |

### 連携・コスト管理

| リソース | 役割 |
|---|---|
| `langfuse_llm_connection` | Playground / 評価で使う LLM 接続（OpenAI、Azure OpenAI 等） |
| `langfuse_blob_storage_integration` | S3 / GCS 等へのデータエクスポート設定（`access_key_id` / `secret_access_key` は write-only） |
| `langfuse_custom_model` | コスト集計用のカスタムモデル定義（料金・マッチパターン） |

## 使い方

Terraform Registry に公開しているので、`required_providers` に追加すればすぐ使えます。

```hcl
terraform {
  required_providers {
    langfuse = {
      source  = "kenzo0107/langfuse"
      version = "~> 0.2"
    }
  }
}

provider "langfuse" {
  public_key = var.langfuse_public_key
  secret_key = var.langfuse_secret_key
  # host = "https://cloud.langfuse.com" # 省略時のデフォルト。セルフホストならここを変更
}

resource "langfuse_project" "example" {
  name = "my-project"
}

resource "langfuse_project_api_key" "example" {
  project_id = langfuse_project.example.id
  note       = "CI/CD pipeline key"
}
```

認証は `public_key` / `secret_key`（もしくは `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` 環境変数）を使った Basic Auth です。`host` を変更すればセルフホスト環境にも対応できます。

## 実装のポイント

- Go 1.24 / Terraform Plugin Framework で実装
- `internal/provider/` にリソースごとの実装、`langfuse/` に Langfuse Public API を叩く HTTP クライアントを分離
- ドキュメントは `go generate`（tfplugindocs）で `docs/` 配下に自動生成
- CI では `go build` と静的解析に加え、`make testacc`（アクセプタンステスト）を実行

## テストについてのお断り

`langfuse_organization_member` / `langfuse_project_member` / `langfuse_scim_user` の3つについては、アクセプタンステストを書いていません。

Langfuse はプラン（Hobby など）によっては Organization へのメンバー招待自体ができず、複数メンバーが存在する状態を用意できないため、実 API に対する受け入れテストで動作を保証できませんでした。CRUD の実装自体はドキュメント通りに API を呼び出しているだけですが、実際に「他のメンバーを招待 → ロール変更 → 削除」まで確認できていない、という点は正直に書いておきます。

より上位プランでメンバーを複数招待できる環境が用意できたら、テストを追加する予定です。もし試していただいて不具合があれば [Issue](https://github.com/kenzo0107/terraform-provider-langfuse/issues) をいただけると助かります。

## もっとこうなったらいいのに

- `langfuse_evaluator` / `langfuse_evaluation_rule` は unstable API に依存しているため、Langfuse 側の仕様変更に追従する必要がある
- メンバー系リソースのアクセプタンステスト（プランが許せば追加したい）
- Import 未対応のリソース（`project_api_key` 等、API の制約でやむを得ない部分もある）の整理

## まとめ

- Langfuse の Public API をラップした Terraform プロバイダーを作り、Terraform Registry に公開しました
- プロジェクト・メンバー・プロンプト・データセット・評価・連携まで 18 リソース + 1 データソースをカバー
- メンバー招待系の3リソースは、プランの制約で実 API によるアクセプタンステストをスキップしています
- ソースは公開しているので、Langfuse の設定を IaC 化したい方はぜひ試してみてください

- リポジトリ: [kenzo0107/terraform-provider-langfuse](https://github.com/kenzo0107/terraform-provider-langfuse)
- Terraform Registry: [registry.terraform.io/providers/kenzo0107/langfuse](https://registry.terraform.io/providers/kenzo0107/langfuse/latest)
