---
title: 使っていない Google Cloud サービスの新規作成を IAM Deny Policy で組織全体禁止にした話
date: 2026-08-26
lang: ja
translation_id: gcp-iam-deny-policy-guardrails
cover: /img/cover/2026-08-26-gcp-iam-deny-policy-guardrails.svg
categories:
- [Google Cloud]
- [Security]
tags:
- Google Cloud
- IAM
- Organization Policy
- Security
- Terraform
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

利用実績のない Google Cloud サービス（Compute Engine の VM、GKE、Cloud SQL、AlloyDB など）の新規作成を、**IAM Deny Policy で組織全体禁止**にしました。

AWS をメインに利用し、Google Cloud を全面的に使うのではなく、データ分析や一部のマネージドサービスなど**特定の用途に限って使う**構成は珍しくないと思います。この場合に困るのが、使う予定のないサービスも「作ろうと思えば作れる」状態のまま残り続けることです。動いていないサービスであっても、有効な API と作成できる権限がある限り攻撃対象領域として存在し続けますし、認証情報が漏れた場合には野良 VM（クリプトマイニングや踏み台化）を立てられる余地にもなります。

見つけて消す運用より、そもそも作れなくする方が確実です。この記事では Organization Policy との使い分け、dry-run がない Deny Policy で影響ゼロを担保した方法、未サポート権限のハマりどころを書きます。

<!-- more -->

## Organization Policy と IAM Deny Policy の使い分け

ガードレールの実装手段は複数あり、以下のように使い分けています。

| 手段 | 使いどころ | dry-run |
| --- | --- | --- |
| Org Policy（managed constraint） | 該当する既製制約がある場合の第一候補 | `dry_run_spec` 対応 |
| Org Policy（legacy constraint） | boolean 系で影響範囲が限定的なもの | **非対応**（設定すると apply が失敗する） |
| Org Policy（カスタム制約 / CEL） | 既製制約が要件に合わない場合 | 対応 |
| **IAM Deny Policy** | **特定の権限だけ**を狙い撃ちで禁止したい場合 | **機能自体がない** |

VM 作成禁止に IAM Deny Policy を選んだのは、Org Policy の managed constraint に「VM 作成のみ」を狙い撃ちできるものがなく、かといって `gcp.restrictServiceUsage` で compute API 自体を禁止すると、**現役で使っている VPC ネットワーキング（Cloud Run の VPC コネクタや Cloud SQL Private IP が依存する Subnetwork / Firewall / Route）を巻き込んで壊すリスク**があったためです。

## dry-run がないので、3つの独立した方法で「影響ゼロ」を証明した

IAM Deny Policy には dry-run がありません。組織配下の全プロジェクトに一発で効いてしまうため、適用前に以下の3方式で裏取りしました。

1. **Cloud Asset Inventory の組織横断検索**: Instance / InstanceTemplate / InstanceGroupManager 等の対象リソースが全プロジェクトで0件であることを確認。このとき Bucket や Project など**必ずヒットするはずの資産で検索範囲のサニティチェック**をし、「0件」が「検索できていないだけ」でないことを確認
2. **Compute API 有効化済みプロジェクトへの直接実行**: CAI のキャッシュに依存しない検証として、`gcloud compute instances list` を対象プロジェクトへ直接実行
3. **組織監査ログの全件精査**: 過去2ヶ月分の Admin Activity ログから `compute.instances.insert` 等の新規作成イベントが0件であることを確認。**これを dry-run の代替**と位置づけ

```hcl
resource "google_iam_deny_policy" "deny_unused_services" {
  parent = urlencode("cloudresourcemanager.googleapis.com/organizations/${local.org_id}")
  name   = "deny-unused-gcp-services"

  rules {
    deny_rule {
      denied_principals = ["principalSet://goog/public:all"] # 全プリンシパル
      denied_permissions = [
        "vmwareengine.googleapis.com/privateClouds.create",
        "gkehub.googleapis.com/memberships.create",
        "gkeonprem.googleapis.com/bareMetalAdminClusters.create",
        "gkeonprem.googleapis.com/bareMetalClusters.create",
        "gkeonprem.googleapis.com/vmwareClusters.create",
        "alloydb.googleapis.com/clusters.create",
        "alloydb.googleapis.com/instances.create",
        "container.googleapis.com/clusters.create",
        "dataproc.googleapis.com/clusters.create",
        "file.googleapis.com/instances.create",
        "redis.googleapis.com/instances.create",
        # Cloud SQL の deny policy 上の FQDN は sqladmin ではなく cloudsql
        "cloudsql.googleapis.com/instances.create",
      ]
    }
  }
}
```

Terraform 上の細かい点として、`parent` には `urlencode()` が必要です。また IAM Deny Policy の管理には `roles/iam.denyAdmin` が必要で、**`roles/resourcemanager.organizationAdmin` には `iam.denypolicies.*` が含まれない**ため、CI 用 SA に別途付与しました。

## ハマりどころ

### 未サポート権限を入れると apply が 400 で失敗する

IAM Deny Policy は**すべての IAM 権限を deny できるわけではありません**。公式の [Permissions supported in deny policies](https://cloud.google.com/iam/docs/deny-permissions-support) に載っている権限のみです。実際、リージョナル MIG の権限を含めたところ apply が失敗しました。

```
Error: Error creating DenyPolicy: googleapi: Error 400: The following permissions
are not valid on this resource type:
compute.googleapis.com/regionInstanceGroupManagers.create.
```

`regionInstanceGroupManagers` はどの動詞もサポート一覧になく、代替不可でした。ただし `instanceTemplates.create` を拒否しているため、新規テンプレートを必要とするリージョナル MIG の作成も実質塞がれる、と整理して削除しました。
この反省から、後続の PR では**追加する権限すべてを事前にサポート一覧と突き合わせて存在確認**してから apply しています。権限名にも罠があり、Cloud SQL の deny policy 上のサービス FQDN は API 名の `sqladmin.googleapis.com` ではなく `cloudsql.googleapis.com` です。

### 「利用実績0件」だけでは禁止の十分条件にならない

除外判断にも学びがありました。

- **Cloud Spanner / Cloud Bigtable**: 一部のマネージドサービスは、機能を有効化・登録した時点で**バックエンドとして裏で別のサービスを自動プロビジョニングします**。調査の過程で、まさにその形で起動されていたリソースが見つかりました。この種の間接プロビジョニングは「自分たちが作成した実績」としては現れないため、禁止すると**将来マネージドサービス側の都合で壊れる**可能性があります。禁止対象から除外しました
- **Cloud TPU / Bare Metal Solution**: サポート一覧に権限が1件もなく、技術的に禁止不可能

つまり、CAI・監査ログ・Terraform コード検索がすべて0件でも、それは「誰も明示的に作っていない」ことの証明にしかなりません。**マネージドサービスが裏で使う可能性のあるサービスは、実績0件でも禁止しない**という判断軸が別途必要でした。

## 段階的展開のパターン（Org Policy 側）

dry-run に対応している Org Policy の managed constraint は、以下の段階的展開をテンプレートにしています。SA キー作成禁止（`iam.managed.disableServiceAccountKeyCreation`）で実践中です。

1. `dry_run_spec` のみ enforce=TRUE で導入（監査モード）
2. Cloud Audit Logs に記録される dry-run 違反を一定期間観測（Slack 通知）
3. 実ログと連携先リポジトリの Terraform コードから、恒久的にキー作成が必要なプロジェクトを特定して**例外を先に敷設**
4. live spec を enforce に昇格

例外プロジェクトでは live spec と **dry_run_spec の両方を例外化**しています。既知・許容済みの操作について dry-run 違反通知が鳴り続けると、アラート疲れで本当の違反を見逃すためです。

```hcl
resource "google_org_policy_policy" "disable_sa_key_creation_exception" {
  for_each = toset(local.sa_key_exception_projects)

  name   = "projects/${each.value}/policies/iam.managed.disableServiceAccountKeyCreation"
  parent = "projects/${each.value}"

  spec {
    inherit_from_parent = false
    rules { enforce = "FALSE" }
  }

  dry_run_spec {
    inherit_from_parent = false
    rules { enforce = "FALSE" }
  }
}
```

例外の根拠も2種類ありました。直近30日の実ログで作成元と確認できたプロジェクトのほか、**監査ログには作成イベントがないが、連携先の Terraform コードに `google_service_account_key` リソースがあり、鍵ローテーションや state 再構築時に再作成されうる**プロジェクトです。外部 SaaS のデータ連携コネクタが Workload Identity Federation に非対応で static key を要求する、というのはよくあるパターンで、この手のプロジェクトは「直近に作成イベントがない」だけで判断すると enforce 昇格後に壊れます。監査ログだけでなく、キーを発行している側のコードまで確認する必要がありました。

なお、SA キー放置の検出・予防の全体像は以前の記事 [Google Cloud のサービスアカウントキーを放置しないためにやっていること](/2026/07/09/2026-07-10-gcp-service-account-key-hygiene/) に書いています。

## まとめ

- 使っていないサービスの新規作成禁止は、既製の Org Policy 制約がなければ IAM Deny Policy で権限を狙い撃ちにする
- Deny Policy に dry-run はないため、CAI 横断検索（サニティチェック付き）+ 直接実行 + 監査ログ全件精査の3方式で影響ゼロを証明してから適用する
- deny できる権限はサポート一覧に載っているものだけ。権限名の FQDN が API 名と異なるサービス（Cloud SQL）もあるため、事前の突き合わせが必須
- 「利用実績0件」でも、マネージドサービス経由で間接的に起動されるサービス（Spanner / Bigtable）は禁止しない
- dry-run 対応の Org Policy は「監査モード → 観測 → 例外敷設 → enforce 昇格」を型にする

参考になれば幸いです。

## 参考

- [IAM Deny Policy](https://cloud.google.com/iam/docs/deny-access)
- [Permissions supported in deny policies](https://cloud.google.com/iam/docs/deny-permissions-support)
- [Organization Policy: dry-run 対応制約](https://docs.cloud.google.com/organization-policy/test-policies)
- [google_iam_deny_policy](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/iam_deny_policy)
