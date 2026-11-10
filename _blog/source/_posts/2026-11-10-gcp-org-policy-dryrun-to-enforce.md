---
title: Google Cloud の組織ポリシーを dry-run から enforce へ段階的に昇格させた進め方と落とし穴
date: 2026-11-10
lang: ja
translation_id: gcp-org-policy-dryrun-to-enforce
cover: /img/cover/2026-11-10-gcp-org-policy-dryrun-to-enforce.svg
categories:
- [Google Cloud]
- [Security]
- [Terraform]
tags:
- Google Cloud
- Organization Policy
- Cloud Audit Logs
- Cloud Storage
- Cloud Run
- Security Command Center
- Terraform
- Security
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

セキュリティ対策の一環として、Google Cloud の組織ポリシー（Organization Policy）を組織全体に入れていきました。dry-run（監査モード）に対応した制約はまず dry-run で入れて違反を観測し、問題がないことを確かめてから enforce に昇格させています。dry-run に対応していない制約は、棚卸しと例外の敷設を先に済ませてから直接 enforce しました。

この記事では、その進め方と、拒否を Slack に通知する仕組み、実際に踏んだ落とし穴（`gcp.resourceLocations` を enforce したら SCC Standard が自動で非アクティブ化された件、UBLA を enforce する前に自動作成バケットを処理した件）をまとめます。

※ 本記事は **2026年11月10日時点**の内容です。

<!-- more -->

## 結論

| 項目 | 内容 |
| --- | --- |
| dry-run できる制約 | custom constraint、managed constraint（`*.managed.*`）、一部の legacy constraint のみ |
| dry-run できる制約の進め方 | live spec を `enforce = FALSE`、`dry_run_spec` を `enforce = TRUE` で入れる → 違反を観測 → 例外を先に敷設 → `dry_run_spec` を `spec` に置き換えて昇格 |
| dry-run できない制約の進め方 | Cloud Asset Inventory（CAI）で組織横断の棚卸し → 必要なプロジェクトに上書きを先に作る → 直接 enforce |
| 昇格の判断材料 | dry-run 違反ログ、監査ログアーカイブの全数スキャン、CAI 棚卸し、陽性対照（わざと違反させるプローブ） |
| 拒否の通知 | 制約の種類によって拒否ログの構造が違う。3 種類のフィルタで拾い、関数側で制約名を取り出して通知する |
| 落とし穴 1 | `gcp.resourceLocations` を enforce すると、自動アクティベートされた SCC Standard が非アクティブ化されることがある |
| 落とし穴 2 | `storage.uniformBucketLevelAccess` を enforce する前に、App Engine / Cloud Build / Vertex AI が自動作成した UBLA 無効バケットを処理しておく |

## 対象にした制約

Google の [secure-by-default](https://docs.cloud.google.com/resource-manager/docs/secure-by-default-organizations) ベースライン（2024年5月3日以降に作成された組織には既定で enforce される）と照らし合わせて、古い組織では未適用だったものを中心に選びました。

| 制約 | 種類 | dry-run | 導入方式 |
| --- | --- | --- | --- |
| `iam.managed.disableServiceAccountKeyCreation`（SA キー作成禁止） | managed | 可 | dry-run → enforce |
| `iam.managed.disableServiceAccountKeyUpload`（SA キーのアップロード禁止） | managed | 可 | dry-run → enforce |
| `iam.managed.preventPrivilegedBasicRolesForDefaultServiceAccounts`（デフォルト SA への基本ロール付与禁止） | managed | 可 | dry-run → enforce |
| `compute.managed.restrictProtocolForwardingCreationForTypes`（プロトコル転送の制限） | managed（パラメータ付き） | 可 | dry-run → enforce |
| `run.managed.requireInvokerIam`（Cloud Run の invoker IAM チェック無効化の禁止） | managed | 可 | dry-run → enforce |
| ドメイン制限共有（custom constraint） | custom | 可 | dry-run → enforce |
| `essentialcontacts.managed.allowedContactDomains`（Essential Contacts の宛先ドメイン制限） | managed（パラメータ付き） | 可 | 棚卸しで対象 0 件のため直接 enforce |
| `gcp.resourceLocations`（国内 + global のみ） | legacy list | 不可 | 棚卸し → 例外 → 直接 enforce |
| `run.allowedIngress`（ingress=all の禁止） | legacy list | 不可 | 棚卸し → 直接 enforce |
| `storage.uniformBucketLevelAccess`（UBLA の強制） | legacy boolean | 不可 | 自動作成バケットを処理 → 直接 enforce |

dry-run に対応する制約は、[Test organization policies](https://docs.cloud.google.com/organization-policy/test-policies) の Limitations に、custom constraint、managed constraint、および一部の legacy managed constraint（Restrict service usage / Restrict endpoint usage / Restrict TLS versions / Restrict TLS cipher suites）だけだと明記されています。それ以外の制約で dry-run ポリシーを作ろうとするとエラーになります。`gcp.resourceLocations` や `storage.uniformBucketLevelAccess` のような legacy constraint は dry-run できないので、別の進め方が必要でした。

なお、ドメイン制限共有の既製の制約 `iam.allowedPolicyMemberDomains` は legacy list constraint で dry-run できません（[Restricting identities by domain](https://docs.cloud.google.com/organization-policy/restrict-domains)）。managed 版の `iam.managed.allowedPolicyMembers` なら dry-run できますが、今回は **dry-run できる custom constraint で書き直して**入れています。

## dry-run できる制約: 監査モード → 観測 → 昇格

### 監査モードで入れる

live の `spec` は `enforce = "FALSE"`（何もしない）にして、`dry_run_spec` 側だけ `enforce = "TRUE"` にします。

```hcl
resource "google_org_policy_policy" "disable_sa_key_upload" {
  name   = "organizations/${var.org_id}/policies/iam.managed.disableServiceAccountKeyUpload"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      enforce = "FALSE"
    }
  }

  dry_run_spec {
    inherit_from_parent = false

    rules {
      enforce = "TRUE"
    }
  }
}
```

`dry_run_spec` だけを書いて `spec` を省略したところ、API が `DryRun feature is not available for the resource` で拒否しました。そのため live spec を no-op で併記しています（この挙動の公式な記載は確認できていません）。

パラメータを持つ managed constraint は、`values` ではなく `parameters` で値を渡します。プロトコル転送を `INTERNAL` だけに制限する例です。

```hcl
resource "google_org_policy_policy" "restrict_protocol_forwarding" {
  name   = "organizations/${var.org_id}/policies/compute.managed.restrictProtocolForwardingCreationForTypes"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      enforce = "FALSE"
    }
  }

  dry_run_spec {
    inherit_from_parent = false

    rules {
      enforce = "TRUE"
      parameters = jsonencode({
        allowedSchemes = ["INTERNAL"]
      })
    }
  }
}
```

Essential Contacts の宛先ドメイン制限も同じ書き方です（`allowedDomains = ["@example.com"]`）。こちらは CAI で Contact が組織全体で 0 件だったため、監査モードを経ずに直接 enforce しました。

ドメイン制限共有の custom constraint は、[公式ドキュメント](https://docs.cloud.google.com/iam/docs/org-policy-custom-constraints)のユースケース例「Only allow organization members to be granted roles」とほぼ同じ CEL です。

```hcl
resource "google_org_policy_custom_constraint" "domain_restricted_sharing" {
  name         = "custom.domainRestrictedSharing"
  parent       = "organizations/${var.org_id}"
  display_name = "ドメイン制限共有"
  description  = "組織配下の principal のみ IAM 付与を許可する"

  action_type    = "ALLOW"
  method_types   = ["CREATE", "UPDATE"]
  resource_types = ["iam.googleapis.com/AllowPolicy"]
  condition      = <<-EOT
    resource.bindings.all(binding,
      binding.members.all(member,
        MemberInPrincipalSet(member, ['//cloudresourcemanager.googleapis.com/organizations/${var.org_id}'])
      )
    )
  EOT
}
```

組織の principal set には Workspace の ID、組織の Workforce Identity Pool、組織内の全 SA と Workload Identity Pool、組織内リソースのサービスエージェントが含まれる旨が公式ドキュメントに書かれているので、WIF やサービスエージェントへの付与は拒否されません。ただし、custom constraint の `name` は後から変えられない（変更すると作り直しになる）ので、最初に付ける名前は慎重に決めたほうがよいです。導入初期は公開エンドポイントのために `allUsers` / `allAuthenticatedUsers` を許可する条件を入れていて、名前にもそれが表れていました。公開エンドポイントを解消したうえで、**enforce に昇格する変更と同時にこの条件を削除**しており、今は名前だけがその名残として残っています。

### 観測する

dry-run 違反は Cloud Audit Logs の policy ログ（`cloudaudit.googleapis.com%2Fpolicy`）に、`OrgPolicyDryRunAuditMetadata` として `dryRunResult: "DENIED"` / `liveResult: "ALLOWED"` で記録されます（[Test organization policies](https://docs.cloud.google.com/organization-policy/test-policies)）。これを後述の通知関数で Slack に流し、制約によって約 1 週間〜約 3 ヶ月観測しました。

dry-run 違反の件数だけでは判断材料として弱いので、昇格前には次の 4 つを揃えました。

- **dry-run 違反の通知**: 監査期間中の違反がゼロ、または既知のもの（陽性対照など）だけであること
- **監査ログアーカイブの全数スキャン**: 組織シンク（`include_children = true`）で GCS に保存している activity ログを数ヶ月分さかのぼり、対象操作（`CreateServiceAccountKey`、`UploadServiceAccountKey`、`allUsers` を含む `SetIamPolicy` など）の発生源を洗い出す。dry-run 導入より前の操作も見える
- **CAI の組織横断棚卸し**: 既存リソースのうち、enforce 後の更新で引っかかりうるもの（`invokerIamDisabled=true` の Cloud Run、ForwardingRule など）を数える
- **陽性対照**: 検証用プロジェクトでわざと違反させ、ログに記録されて Slack まで通知が届くことを確認する。「違反ゼロ」が「検知できていない」ではないことの裏付けになる

陽性対照は意外なところでも役に立ちました。デフォルト SA への基本ロール付与禁止は、監査期間中に Compute Engine API を有効化したプロジェクトで、Google のサービスエージェントがデフォルト SA に editor を自動付与したことが dry-run 違反として通知されました。**enforce 後は新しく API を有効化してもデフォルト SA に editor が付かなくなる**ので、その editor を前提にした手順がないかを確認する材料になりました。

### 例外を先に敷設してから昇格する

業務上どうしても違反する操作が必要なプロジェクトは、昇格の**前に**プロジェクト単位の上書きを作ります。例外側では live spec と `dry_run_spec` の両方を上書きしておくと、既知・許容済みの操作で dry-run 違反の通知が鳴り続けずに済みます（詳細は [IAM Deny Policy の記事](/2026/08/25/2026-08-26-gcp-iam-deny-policy-guardrails/) に書きました）。

昇格は、`dry_run_spec` を消して `spec` 側を `enforce = "TRUE"` にするだけです。

```hcl
resource "google_org_policy_policy" "disable_sa_key_upload" {
  name   = "organizations/${var.org_id}/policies/iam.managed.disableServiceAccountKeyUpload"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      enforce = "TRUE"
    }
  }
}
```

ここで紹介した制約はいずれも新規の作成・更新だけを評価し、既存のキーやバインディング、転送ルールには遡及しません。SA キー作成禁止を enforce しても、既存の USER_MANAGED キーは動き続けます。キーの扱い全般は [SA キーの記事](/2026/07/09/2026-07-10-gcp-service-account-key-hygiene/) にまとめています。

## dry-run できない制約: 棚卸し → 例外 → 直接 enforce

`gcp.resourceLocations` は、CAI で組織全体のリソース（数万件）のロケーションを棚卸しし、`asia-northeast1` 以外に実リソースを持つプロジェクトを洗い出しました。そうしたプロジェクトには上書きを先に作ってから、組織レベルを enforce しています。

```hcl
locals {
  allowed_locations = ["in:jp-locations", "global"]

  # プロジェクト ID => 追加で許可する value group
  resource_location_overrides = {
    "example-analytics" = ["in:us-locations"]
  }
}

resource "google_org_policy_policy" "resource_locations_override" {
  for_each = local.resource_location_overrides

  name   = "projects/${each.key}/policies/gcp.resourceLocations"
  parent = "projects/${each.key}"

  spec {
    inherit_from_parent = true

    rules {
      values {
        allowed_values = concat(local.allowed_locations, each.value)
      }
    }
  }
}

resource "google_org_policy_policy" "resource_locations" {
  name   = "organizations/${var.org_id}/policies/gcp.resourceLocations"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      values {
        allowed_values = local.allowed_locations
      }
    }
  }

  # NOTE: 上書きより先に組織側が反映されると、上書き対象プロジェクトで海外リージョンが一時的に拒否されるため
  depends_on = [google_org_policy_policy.resource_locations_override]
}
```

この制約が効くのは新規作成のリソースだけで、既存リソースはそのまま動き続けます（[Restricting resource locations](https://docs.cloud.google.com/resource-manager/docs/organization-policy/defining-locations)）。許可値の設計で気をつけたのは次の点です。

- `in:jp-locations` は東京と大阪の value group。国内 DR を見越して大阪も含めた
- `global` は必須。自動レプリケーションの Secret Manager シークレットは、`global` が許可されていないと作成に失敗する（[Services that support restricting resource locations](https://docs.cloud.google.com/organization-policy/reference/restrict-locations-supported-services)）
- BigQuery の US マルチリージョンや App Engine（`us-central`、作成後にリージョンを変えられない）を使っているプロジェクトは、新規作成やオートスケールで引っかかりうるので上書きで許可する
- 上書き側にも組織レベルの許可値を明示しておく。組織側と上書き側のどちらが先に反映されても、国内リージョンが拒否される期間ができない

`run.allowedIngress`（`internal` / `internal-and-cloud-load-balancing` のみ許可）も legacy list constraint で dry-run できません。CAI で `ingress=all` の Cloud Run が実質 0 件であることを確かめてから、例外なしで直接 enforce しました。`storage.uniformBucketLevelAccess` については落とし穴の節で書きます。

## 拒否を通知する仕組み

dry-run 違反だけでなく、enforce 後の拒否も Slack に通知しています。enforce 後に「誰かの作業が止まった」ことを、問い合わせが来る前に把握するためです。構成は、組織シンク → Pub/Sub → Cloud Run functions（Node.js）→ Slack です。

### 制約の種類によって拒否ログの構造が違う

実際に拒否させて採取したログを比べると、制約の種類によって構造がまったく違いました。

| 種類 | 記録先 | 拒否の手がかり | 制約名 |
| --- | --- | --- | --- |
| dry-run 違反 | policy ログ | `protoPayload.metadata.dryRunResult="DENIED"` | `metadata.constraint` |
| managed constraint の enforce 拒否 | activity ログ（元操作と同じ `methodName`） | `status.code=9` と `policyViolationInfo.orgPolicyViolationInfo.violationInfo[]` | `violationInfo[].constraint`（`constraints/...`） |
| legacy constraint の enforce 拒否 | activity ログ | `status.code=9` と `status.message` だけ（`policyViolationInfo` も `status.details` もない） | `status.message` 内の `constraints/...` |
| custom constraint の enforce 拒否 | activity ログ | `status.code=9` と `status.message`。サービスによっては `status.details[].reason="CUSTOM_ORG_POLICY_VIOLATION"` | `status.message` 内の **`customConstraints/...`** |

legacy constraint の拒否は、たとえば US にバケットを作ろうとすると `status.message` に `'us' violates constraint 'constraints/gcp.resourceLocations'` とだけ入っていました。最初は `violationInfo` の有無だけで拾っていたので、これを取りこぼしていました。

`ViolationInfo` のフィールド（`constraint` / `checkedValue` / `errorMessage` / `policyType`）は [AuditLog のリファレンス](https://docs.cloud.google.com/php/docs/reference/cloud-common-protos/latest/Audit.ViolationInfo)で確認できました。一方、**どの種類の制約でどのフィールドが埋まるかは公式ドキュメントで明確な記載を確認できず**、上の表は自分の環境で採取したログに基づいています。記録先についても、[Test organization policies](https://docs.cloud.google.com/organization-policy/test-policies) の表では live ポリシーで拒否された場合にも Organization Policy の監査ログが生成されるとされていますが、`dry_run_spec` を外して enforce した後の SA キー作成の拒否は、自環境では元操作と同じ `methodName` の activity ログに記録され、policy ログには見当たりませんでした。

また、IAM の custom constraint で組織リソース自体の `setIamPolicy` が拒否された場合は監査ログが生成されない、と[公式ドキュメント](https://docs.cloud.google.com/iam/docs/org-policy-custom-constraints)に書かれています。この経路の拒否はログベースの通知では拾えません。

### シンクのフィルタ

3 系統をまとめて拾います。`status.message` 側は「`code=9` かつ制約名を含む」に絞り、ほかの `FAILED_PRECONDITION` を拾わないようにしています。

```hcl
locals {
  org_policy_denial_filter = join(" OR ", [
    "protoPayload.metadata.dryRunResult=\"DENIED\"",
    "protoPayload.policyViolationInfo.orgPolicyViolationInfo.violationInfo.constraint:*",
    "(protoPayload.status.code=9 AND protoPayload.status.message:\"constraints/\")",
  ])
}

resource "google_pubsub_topic" "org_policy_denials" {
  name = "org-policy-denials"
}

resource "google_logging_organization_sink" "org_policy_denials" {
  name             = "org-policy-denials"
  org_id           = var.org_id
  include_children = true
  destination      = "pubsub.googleapis.com/${google_pubsub_topic.org_policy_denials.id}"
  filter           = local.org_policy_denial_filter
}

resource "google_pubsub_topic_iam_member" "sink_publisher" {
  topic  = google_pubsub_topic.org_policy_denials.id
  role   = "roles/pubsub.publisher"
  member = google_logging_organization_sink.org_policy_denials.writer_identity
}
```

custom constraint の制約名は `customConstraints/` で始まりますが、Logging のクエリ言語は正規表現と論理演算子を除いて大文字小文字を区別しない（[Logging query language](https://docs.cloud.google.com/logging/docs/view/logging-query-language)）ため、`"constraints/"` のままで custom constraint の拒否も拾えました（`gcloud logging read` でも確認）。

### 関数側で分類する

困ったのは関数側です。JavaScript の文字列比較は大文字小文字を区別するので、`constraints/` だけを探していると custom constraint の拒否で制約名が `unknown` になりました。さらに、プロジェクト IAM への付与が拒否されたログを **「強い権限が付与されました (SetIamPolicy)」と誤って通知**していました。失敗した `SetIamPolicy` も、成功時と同じ `methodName` で activity ログに記録されるためです。

最終的には次のような分類にしました（実装を簡略化したものです）。

```js
const CONSTRAINT_NAME_PATTERN = /\b(?:customConstraints|constraints)\/[A-Za-z0-9._-]+/g;

const orgPolicyViolation = (proto) => {
  const status = proto.status || {};
  const violations = proto.policyViolationInfo?.orgPolicyViolationInfo?.violationInfo || [];
  const fromViolationInfo = violations.map((v) => v.constraint).filter(Boolean);
  const fromMessage = status.code === 9 ? String(status.message || '').match(CONSTRAINT_NAME_PATTERN) || [] : [];
  const constraints = [...new Set([...fromViolationInfo, ...fromMessage])];
  const deniedByDetails = (status.details || []).some((d) => String(d.reason || '').includes('ORG_POLICY_VIOLATION'));

  return { denied: constraints.length > 0 || deniedByDetails, constraints };
};

const classify = (proto) => {
  if (proto.metadata?.dryRunResult === 'DENIED') {
    return { title: 'Organization Policy の dry-run 違反を検知しました', constraints: [proto.metadata.constraint] };
  }

  const violation = orgPolicyViolation(proto);
  if (violation.denied) {
    return { title: 'Organization Policy により操作が拒否されました', constraints: violation.constraints };
  }

  if (proto.methodName?.endsWith('SetIamPolicy') && proto.status?.code) {
    return { title: 'IAM ポリシーの変更に失敗しました (SetIamPolicy)', error: proto.status.message };
  }

  return null;
};

module.exports = { classify };
```

ポイントは次のとおりです。

- 制約名は `violationInfo` と `status.message` の両方から取り、`customConstraints/` も対象にする
- Org Policy の拒否判定を、`SetIamPolicy` や `CreateServiceAccountKey` の「成功」通知より**先に**評価する
- `status.code` が 0 以外の `SetIamPolicy` は「付与されました」ではなく「失敗しました」として通知する
- 採取した実ログをそのままテストのフィクスチャにし、CI で `node --test` を回す。修正前のコードでフィクスチャが fail することを確認してから直した

## 落とし穴 1: `gcp.resourceLocations` で SCC Standard が非アクティブ化された

`gcp.resourceLocations` を enforce してから約 1 週間後、Terraform の plan / apply が全部止まりました。Security Command Center の NotificationConfig を refresh したところ、SCC v2 API が組織全体で `Security Command Center Legacy has been permanently disabled` の 400 を返すようになっていたのが原因です。

これは仕様で、[公式ドキュメント](https://docs.cloud.google.com/security-command-center/docs/migrate-standard-legacy)に、Standard tier が自動でアクティベートされていた組織で resource locations を制限する組織ポリシーを有効にすると、ポリシーのデプロイから 7 日以内に Security Command Center が自動で非アクティブ化されることがある、と明記されています。組織ポリシーより先にデータ所在地の設定を変えていた場合、自動アクティベート後かつポリシーのデプロイ前に Vulnerability Assessment for Google Cloud を有効にしていた場合、自動アクティベート後に Premium / Enterprise にアップグレードしていた場合は対象外とされています。

- **状態の確認**: `gcloud scc notifications list --organization=ORG_ID --location=global` が上記の 400 を返せば非アクティブ化されています
- **復旧**: Console から手動で再アクティベートします。既存の findings は `global` に保存されているので、データ所在地は `global` のまま選ばないと既存の findings にアクセスできなくなります（公式ドキュメントに記載あり）
- 手動で再アクティベートしたあとは、`gcp.resourceLocations` を enforce したままでも非アクティブ化は再発していません。ただ、**手動アクティベートなら自動非アクティブ化の対象外になる、とは公式ドキュメントに明記されておらず**（手動アクティベート時はデータ所在地の設定が resource locations ポリシーで制限されない、という記載はあります）、自分の環境での観測です

これから `gcp.resourceLocations` を入れるなら、enforce の前に SCC のアクティベート方式とデータ所在地の設定を確認しておくのがよいと思います。

## 落とし穴 2: UBLA を enforce する前に自動作成バケットを処理する

`storage.uniformBucketLevelAccess` を組織で enforce したのは、オブジェクト ACL 経由の外部共有を塞ぐためです。ドメイン制限共有の custom constraint は IAM の AllowPolicy しか評価しないので、Cloud Storage の ACL による共有は防げません（公式ドキュメントにも、ACL による既定の付与は対象外と書かれています）。

この制約が拒否するのは「UBLA を無効にした新規バケットの作成」と「既存バケットの UBLA 無効化」で、UBLA が無効の既存バケットはそのまま動きます（[Organization policy constraints](https://docs.cloud.google.com/resource-manager/docs/organization-policy/org-policy-constraints)）。検証用プロジェクトでは次の結果になりました。

| 作成リクエスト | enforce 後の結果 |
| --- | --- |
| UBLA を指定しない（`gcloud builds submit` が作る `_cloudbuild` バケットと同じ形） | 成功。UBLA は自動で有効になる |
| UBLA の無効（`iamConfiguration.uniformBucketLevelAccess.enabled: false`）を明示する | HTTP 412 で拒否 |

既存バケットに影響はないとはいえ、UBLA 無効のまま残すと ACL の抜け道も残ります。Terraform 管理のバケットはすべて `uniform_bucket_level_access = true` でしたが、残っていたのは **App Engine / Cloud Build / Vertex AI がサービス側で自動作成したバケット**（`<project>.appspot.com`、`staging.<project>.appspot.com`、`<project>_cloudbuild`、`cloud-ai-platform-*`）でした。

これらは `import` ブロックで Terraform に取り込み、UBLA だけを有効化しました。

```hcl
import {
  id = "example-project/example-project.appspot.com"
  to = google_storage_bucket.app_engine_default
}

resource "google_storage_bucket" "app_engine_default" {
  project  = "example-project"
  name     = "example-project.appspot.com"
  location = "US"

  uniform_bucket_level_access = true

  lifecycle {
    prevent_destroy = true
  }
}
```

- 既存の設定（location、storage class、ライフサイクル、CORS）は取り込んだときの値をそのまま書き、plan の差分が `uniform_bucket_level_access` の `false -> true` だけになることを確認する
- 事前に、バケットの ACL が `project-owners/editors/viewers` だけで IAM（`legacyBucketOwner` / `legacyBucketReader`）と同等であること、Data Access ログで想定外のアクセスがないことを確認する。オブジェクト ACL（アップロードした個人やサービスエージェントへの OWNER）は効かなくなるため、自動作成元のサービスエージェントがプロジェクトの IAM で必要なロールを持っているかも見ておく
- UBLA は有効化から 90 日以内なら無効に戻せる（[Uniform bucket-level access](https://docs.cloud.google.com/storage/docs/uniform-bucket-level-access)）。90 日を過ぎると戻せない。また同じドキュメントでは、無効化の要件の 1 つにバケットが `storage.uniformBucketLevelAccess` 制約の対象でないことが挙げられているので、組織で enforce した後は、そのバケットを制約の対象から外さない限り 90 日以内でも戻せない
- apply 後は `import` ブロックを削除する。担当プロダクトのリポジトリで管理を続けるならリソース定義は残し、管理したくないなら `removed` ブロックで state から外す

```hcl
removed {
  from = google_storage_bucket.app_engine_default

  lifecycle {
    destroy = false
  }
}
```

ひとつハマったのが、**課金が無効なプロジェクトのバケット**です。plan（読み取り）は通るのに、apply で `Error 403: The billing account for the owning project is disabled in state absent, accountDisabled` になりました。import は state に入ったものの UBLA の更新だけが拒否され、そのままでは main の apply が毎回失敗するため、`removed` で state から外しました。自環境では、課金が無効なプロジェクトのバケットは UBLA の更新がこの 403 で拒否され、課金を有効にしない限り変更できない状態でした（Cloud Storage の公式ドキュメントでこの挙動の明記は確認できていません）。plan が通っても apply で失敗しうるので、事前に `gcloud billing projects describe` で課金の状態を確認しておくのがよいです。

## まとめ

- dry-run できるのは custom constraint、managed constraint、一部の legacy constraint だけ。できない制約は CAI 棚卸しと例外の先行敷設で代える
- dry-run は「live spec を no-op、`dry_run_spec` を enforce」で入れ、違反ログ・監査ログの全数スキャン・CAI 棚卸し・陽性対照を揃えてから昇格する
- enforce 後の拒否ログは、managed / legacy / custom で構造が違う。`violationInfo` だけでなく `status.message`（`customConstraints/` を含む）も見て、失敗した `SetIamPolicy` を付与と区別する
- `gcp.resourceLocations` を enforce すると、自動アクティベートされた SCC Standard が 7 日以内に非アクティブ化されることがある。Console から `global` で手動再アクティベートして復旧する
- `storage.uniformBucketLevelAccess` の前に、サービスが自動作成した UBLA 無効バケットを import して有効化する。課金無効のプロジェクトでは自環境では更新できなかった

参考になれば幸いです。

## 参考

- [Test organization policies (dry-run)](https://docs.cloud.google.com/organization-policy/test-policies)
- [Organization policy constraints](https://docs.cloud.google.com/resource-manager/docs/organization-policy/org-policy-constraints)
- [Secure by default organizations](https://docs.cloud.google.com/resource-manager/docs/secure-by-default-organizations)
- [Use custom organization policies for IAM](https://docs.cloud.google.com/iam/docs/org-policy-custom-constraints)
- [Restricting identities by domain](https://docs.cloud.google.com/organization-policy/restrict-domains)
- [Restricting resource locations](https://docs.cloud.google.com/resource-manager/docs/organization-policy/defining-locations)
- [Services that support restricting resource locations](https://docs.cloud.google.com/organization-policy/reference/restrict-locations-supported-services)
- [Security Command Center: Standard tier の移行と自動非アクティブ化](https://docs.cloud.google.com/security-command-center/docs/migrate-standard-legacy)
- [Uniform bucket-level access](https://docs.cloud.google.com/storage/docs/uniform-bucket-level-access)
- [Logging query language](https://docs.cloud.google.com/logging/docs/view/logging-query-language)
- [Cloud Run ingress](https://docs.cloud.google.com/run/docs/securing/ingress)
- [Allowing public (unauthenticated) access - Cloud Run](https://docs.cloud.google.com/run/docs/authenticating/public)
- [AuditLog ViolationInfo reference](https://docs.cloud.google.com/php/docs/reference/cloud-common-protos/latest/Audit.ViolationInfo)
- [google_org_policy_policy](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/org_policy_policy)
