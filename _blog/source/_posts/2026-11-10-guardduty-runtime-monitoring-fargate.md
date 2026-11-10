---
title: GuardDuty Runtime Monitoring（ECS Fargate）を委任管理者から Terraform で段階展開した話
date: 2026-11-10
lang: ja
translation_id: guardduty-runtime-monitoring-fargate
cover: /img/cover/2026-11-10-guardduty-runtime-monitoring-fargate.svg
categories:
- [AWS]
- [Terraform]
tags:
- AWS
- GuardDuty
- ECS
- Fargate
- Terraform
- セキュリティ
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

セキュリティ対策の一環として、GuardDuty の **Runtime Monitoring（ECS Fargate、自動エージェント管理）** を、委任管理者アカウントから Terraform でワークロードアカウントへ stg → prd の順に段階展開しました。

これまでの GuardDuty は CloudTrail・VPC フローログ・DNS ログといった「コンテナの外側」しか見ておらず、ECS タスクの中で何が実行されたかは分かりませんでした。Runtime Monitoring を有効にすると、GuardDuty が Fargate タスクにセキュリティエージェントのサイドカーを自動で付け、プロセスの起動やネットワーク接続といった OS レベルのイベントから検知できるようになります。

有効化そのものは Terraform のリソース1つで済みますが、実際には **prd で新しいタスクが起動しなくなる**、**plan に毎回 replace のドリフトが出る**、といったところでつまずいたので、前提条件の確認ポイントと合わせて残します。

※ 本記事は **2026年11月10日時点**の内容です。Terraform の挙動は `hashicorp/aws` v6.66.0（ドリフト発生時）と v6.70.0（修正版）で確認しています。料金は東京リージョンの公開料金（AWS Price List API）を参照しています。

<!-- more -->

## 結論

| 項目 | 内容 |
| --- | --- |
| 有効化の方法 | 委任管理者アカウントで `aws_guardduty_member_detector_feature` を使い、対象アカウントを列挙して `RUNTIME_MONITORING` + `ECS_FARGATE_AGENT_MANAGEMENT` を有効化 |
| 組織全体に自動有効化しない理由 | サイドカーがタスクの CPU・メモリを共有するため、stg で影響を確かめてからアカウント単位で広げたい |
| 一番ハマったこと | タスク実行ロールの ECR 権限を自アカウントのリポジトリに絞っていると、エージェントの pull が 403 になり**新しいタスクが起動できなくなる** |
| Terraform のハマり（1） | `additional_configuration` を ECS だけ書くと、未指定の EKS / EC2 が DISABLED で返ってきて毎回 in-place 差分になる。3つとも明示する |
| Terraform のハマり（2） | AWS が `RDS_LOGIN_EVENTS` に `RDS_DATA_RISK` を追加したことで、組織設定の `rds_protection` が全リージョンで毎回 replace される。v6.70.0 で修正済み |
| コスト | Fargate のタスク vCPU × 稼働時間で決まる従量課金。東京は最初の 500 vCPU/月まで $2.00/vCPU |
| 展開状況の確認 | 手で更新する表は実態とずれるので、AWS の実状態から表を出すスクリプトで確かめる |

## 構成: 委任管理者からアカウント単位で有効化する

GuardDuty は Organizations の委任管理者（セキュリティ用アカウント）で一元管理しており、メンバーアカウント側からは Runtime Monitoring を有効化できません。そのため委任管理者側の Terraform で、対象アカウントを列挙して有効化します。

組織全体への自動有効化（`aws_guardduty_organization_configuration_feature`）を使わなかったのは、サイドカーがタスクの CPU・メモリを共有するためです。バッチ時間帯に CPU が上限に張り付くようなタスクがあるアカウントもあり、**stg で影響を確かめてから prd に入れる**ことを、アカウントごとに PR 1本で進めたかったからです。

```hcl
resource "aws_guardduty_member_detector_feature" "runtime_monitoring" {
  for_each = toset([
    var.account_ids["workload-a-stg"],
    var.account_ids["workload-a-prd"],
  ])

  detector_id = aws_guardduty_detector.main["ap-northeast-1"].id
  account_id  = each.key
  name        = "RUNTIME_MONITORING"
  status      = "ENABLED"

  # NOTE: ECS だけを書かないのは、API が未指定の設定も DISABLED として返し、
  #       provider が順序付きの List で比較して毎回差分になるため。API の返却順（EKS / ECS / EC2）で 3 つとも明示する。
  additional_configuration {
    name   = "EKS_ADDON_MANAGEMENT"
    status = "DISABLED"
  }

  additional_configuration {
    name   = "ECS_FARGATE_AGENT_MANAGEMENT"
    status = "ENABLED"
  }

  additional_configuration {
    name   = "EC2_AGENT_MANAGEMENT"
    status = "DISABLED"
  }
}
```

最初は `ECS_FARGATE_AGENT_MANAGEMENT` だけを書いていましたが、apply 済みのアカウントに毎回 in-place 更新の差分が出ました。provider の修正 PR（[#50445](https://github.com/hashicorp/terraform-provider-aws/pull/50445)）にも「`RUNTIME_MONITORING` の3つのうち1つだけを宣言すると差分が出る問題は範囲外として残っている」と明記されており、**3つとも明示するのが現時点の回避策**です。

対象アカウントを増やすときは `for_each` に1行足すだけで、plan の差分が `create` 1件だけになることを毎回確認しました。

## 前提条件: ここを見落とすと prd でタスクが起動しない

Fargate の前提条件は [Prerequisites for AWS Fargate (Amazon ECS only) support](https://docs.aws.amazon.com/guardduty/latest/ug/prereq-runtime-monitoring-ecs-support.html) にまとまっています。実際に確認した観点を表にします。

| 観点 | 確認内容 | 備考 |
| --- | --- | --- |
| プラットフォーム | Fargate (Linux)、プラットフォームバージョン 1.4.0 以上 | Windows は未対応 |
| 起動タイプ | Fargate であること | EC2 起動タイプのタスクは `ECS_FARGATE_AGENT_MANAGEMENT` の対象外 |
| タスク実行ロール | GuardDuty エージェントの ECR リポジトリから pull できること | **今回一番ハマった点** |
| ネットワーク | ECR と S3（イメージレイヤー）に到達できること | NAT Gateway か、ECR のインターフェースエンドポイント + S3 ゲートウェイエンドポイント |
| セキュリティグループ | 外向きを絞っている場合、S3 のマネージドプレフィックスリストへの 443 を許可 | |
| SCP / Permissions Boundary | `guardduty:SendSecurityTelemetry` を拒否していないこと | |
| エージェントの接続経路 | 自動管理なら GuardDuty が設定する | 後述 |

### タスク実行ロールの ECR 権限

サイドカーのイメージは AWS が管理するアカウントの ECR リポジトリ（`aws-guardduty-agent-fargate`）にあり、**タスク実行ロールの権限で pull されます**。`AmazonECSTaskExecutionRolePolicy` を付けていれば `Resource: "*"` なので問題ありませんが、セキュリティのために ECR の pull を自アカウントのリポジトリに絞っているロールだと、エージェントの pull が拒否されます。

実際、あるワークロードアカウントの prd で有効化した直後、本番デプロイのタスク起動が次のエラーで失敗しました。

```
CannotPullContainerError: ... aws-guardduty-agent-fargate:v1.17.3-Fg_x86_64: ... 403 Forbidden
```

- **稼働中のタスクには影響しない**（有効化前に起動したものはサイドカーが付いていない）
- ただし、そのロールを使うタスクは**デプロイ・run-task・スケールアウト・落ちたタスクの置き換えがすべて失敗**する
- stg 側ではたまたま以前にこの許可を足していたため起きず、**stg で問題が出なかったことが prd の安全を保証しなかった**

修正は実行ロールの許可にエージェントのリポジトリを足すだけです。

```hcl
variable "guardduty_agent_ecr_repository_arn" {
  description = "GuardDuty エージェント（Fargate）の ECR リポジトリ ARN。リージョンごとの値は https://docs.aws.amazon.com/guardduty/latest/ug/ecs-runtime-agent-ecr-image-uri.html を参照"
  type        = string
}

data "aws_iam_policy_document" "ecs_task_execution" {
  statement {
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
    ]
    resources = [
      aws_ecr_repository.app.arn,
      var.guardduty_agent_ecr_repository_arn,
    ]
  }
}
```

なお、このとき出した修正 PR は、同じ修正が別途マージされていたため重複として close しました。

なお、[Deploying the security agent to Amazon ECS on Fargate](https://docs.aws.amazon.com/guardduty/latest/ug/how-runtime-monitoring-works-ecs-fargate.html) には次のように書かれています。

> If the sidecar can't launch, Runtime Monitoring doesn't prevent the task from running.

さらに [Runtime coverage and troubleshooting for Amazon ECS clusters](https://docs.aws.amazon.com/guardduty/latest/ug/gdu-assess-coverage-ecs.html) では、`CannotPullContainerError` でサイドカーのイメージを pull できない場合についても「Your task will continue to run but GuardDuty can't detect potential threats.」と書かれています。

ところが今回は、実行ロールの権限不足による 403 でタスクごと起動しませんでした。ドキュメントの記述と今回の観測が食い違う理由は分かっていません。少なくとも今回の構成では **pull 失敗でタスクの起動が止まった**ので、ドキュメントの記述を当てにせず、事前に実行ロールの権限を確かめるのが安全です。

それ以降は、有効化前に読み取りのみで次を確認するようにしました。

```console
$ aws iam simulate-principal-policy \
    --policy-source-arn arn:aws:iam::<アカウントID>:role/<タスク実行ロール> \
    --action-names ecr:BatchGetImage ecr:GetDownloadUrlForLayer \
    --resource-arns <GuardDuty エージェントの ECR リポジトリ ARN> \
    --query 'EvaluationResults[].[EvalActionName,EvalDecision]' --output text
```

- ECS サービスだけでなく、**release タスクやバックアップ用タスクなど、別の実行ロールを使うタスク定義も**洗い出す
- Permissions Boundary が付いていないか見る
- 外向き通信が NAT Gateway 経由か、VPC エンドポイント経由か（エンドポイントポリシーで絞っていないか）を見る

### エージェントの接続経路（VPC エンドポイント / link-local）

エージェントの接続経路には、GuardDuty が管理する `com.amazonaws.<region>.guardduty-data` の VPC エンドポイントを使う方法があり、その検証手順ではエンドポイントのセキュリティグループに VPC の CIDR から 443 の受信ルールがあることを確かめます（[Validating VPC endpoint configuration](https://docs.aws.amazon.com/guardduty/latest/ug/validate-vpc-endpoint-config-runtime-monitoring.html)）。一方、現在の [How the security agent connects to GuardDuty](https://docs.aws.amazon.com/guardduty/latest/ug/runtime-monitoring-agent-connectivity.html) では、**新規に有効化した場合は link-local アドレス経由で接続する**（エージェント v1.17.3 以上、対応リージョンのみ）と書かれています。

- 自動管理なら、どちらの経路でも GuardDuty が設定するので Terraform 側で用意するものはない
- GuardDuty が既に `guardduty-data` エンドポイントを設定した VPC はそれを使い続け、Runtime Monitoring を無効にして再度有効にするまで link-local は追加されない
- どちらを使っているかは、サブネットのルートテーブルに `169.254.170.248/29` → `GuardDuty` のルートがあるかで判別できる（[Troubleshooting agent connectivity](https://docs.aws.amazon.com/guardduty/latest/ug/runtime-monitoring-agent-connectivity-troubleshooting.html)）
- ホスト側で外向き通信を絞っている場合は link-local の範囲を許可する

東京リージョンが link-local に対応しているかは、公式ドキュメントで明記を確認できませんでした。各アカウントの VPC にどちらの経路が作られたかも今回は確認できていません。

### サイドカーは「新しく起動したタスク」にしか付かない

Fargate のタスクは起動後に変更できないため、サイドカーは**有効化後に起動したタスクにだけ**付きます。有効化前から動いているタスクは、再デプロイされるまでカバレッジが `UNHEALTHY`（Agent not provisioned）のまま、つまり監視対象外のままです。有効化したら再デプロイまでをセットで考えておく必要があります。

CPU に余裕がないクラスタは、クラスタに `GuardDutyManaged: false` タグを付けると対象から外せます。ただし外したあとに起動したタスクにはサイドカーが付かず検知の対象外になる（既に入っているエージェントがアンインストールされるわけではない）ので、リソースとのトレードオフで判断する設計上の逃げ道として捉えています。

## 展開順序

1アカウントずつ、stg → prd の順で次の手順を繰り返しました。

| 手順 | 対象 | 確認すること |
| --- | --- | --- |
| 1 | 対象ワークロードの stg / prd | 有効化前に、実行ロールの ECR 権限・Permissions Boundary・外向き経路を読み取りのみで確認 |
| 2 | stg | plan の差分が create 1件だけ。再デプロイ後にカバレッジが HEALTHY、テスト用ドメインの名前解決で Runtime の finding が出て、後段の通知まで届くこと |
| 3 | prd | plan の差分が create 1件だけ。再デプロイ後にカバレッジが HEALTHY、デプロイ・バッチ等のタスクが正常に起動すること |

- 前述の ECR 403 は手順 1 を入れる前に prd で起きたもので、以降は手順 1 を必須にした
- 1アカウント = 1 PR にし、PR 本文に「plan の差分が対象アカウントの create 1件だけであること」をテスト項目として書いた
- stg で「何も起きなかった」ことは検証にならないので、GuardDuty のテスト用ドメイン（[guarddutyc2activityb.com](https://docs.aws.amazon.com/security-ir/latest/userguide/config-validation.html)）を ECS Exec でコンテナ内から名前解決し、[`Backdoor:Runtime/C&CActivity.B!DNS`](https://docs.aws.amazon.com/guardduty/latest/ug/findings-runtime-monitoring.html) を意図的に出して、finding が通知まで流れることを確かめた

## コスト見積もりの考え方

Runtime Monitoring（ECS Fargate）は、**監視対象タスクの vCPU を月あたりに換算した量**で課金されます（[Amazon GuardDuty pricing](https://aws.amazon.com/guardduty/pricing/)）。東京リージョンの単価は AWS Price List API で次のとおりでした。

| 月あたり vCPU | 単価（東京） |
| --- | --- |
| 最初の 500 vCPU | $2.00 / vCPU |
| 次の 4,500 vCPU | $1.00 / vCPU |
| 5,000 vCPU 超 | $0.33 / vCPU |

月あたり vCPU は「タスクの vCPU × 稼働時間 ÷ その月の時間数」の合計です。たとえば 0.5 vCPU のタスクが常時 6 本動いているクラスタなら、0.5 × 6 = 3 vCPU で、月 $6 程度になります。見積もりの流れはこうしました。

1. ECS サービスごとの「タスク定義の vCPU × 平均タスク数」を出す（Auto Scaling するなら平均値、バッチは実行時間で按分）
2. 上の単価を掛ける
3. アカウント・リージョンごとに機能の**30日間の無料トライアル**があるので、有効化後はトライアル期間中に GuardDuty コンソールの使用状況（`get-usage-statistics`）で実費の見込みを確かめてから prd に広げる

料金とは別に、**サイドカーがタスクの CPU・メモリを共有する**点も見積もりに入れておく必要があります。エージェントのメモリ上限はタスクサイズによって 128 MB〜1 GB と決まっていて、小さいタスクほど相対的な影響が大きくなります（前提条件ページの CPU and memory limits）。

## 展開状況を AWS の実状態から表にする

アカウントが増えてくると、Issue に手で書いている展開状況の表と実態がずれていても気づけません。そこで、委任管理者アカウントから読み取りだけで「Runtime Monitoring と ECS Fargate のエージェント管理が有効か」「ECS クラスタのカバレッジが HEALTHY か」を表にするスクリプトを用意しました。

以下は社内向けのものを汎用化した最小版です。

```bash
#!/usr/bin/env bash
set -euo pipefail

# 委任管理者アカウントの認証情報で実行する
# usage: ./runtime-monitoring-status.sh stg=111111111111 prd=222222222222
REGION=${REGION:-ap-northeast-1}

[[ $# -gt 0 ]] || { echo "usage: $0 <label>=<account-id> ..." >&2; exit 1; }
for cmd in aws jq; do
  command -v "$cmd" >/dev/null || { echo "$cmd が見つかりません" >&2; exit 1; }
done
for arg in "$@"; do
  [[ ${arg#*=} =~ ^[0-9]{12}$ ]] || { echo "アカウント ID が不正です: $arg" >&2; exit 1; }
done

detector=$(aws guardduty list-detectors --region "$REGION" --output json |
  jq -er '.DetectorIds | if length == 1 then .[0] else error("detector が 1 つではない: \(length)") end')

echo "| アカウント | Runtime Monitoring | ECS Fargate エージェント管理 | HEALTHY | UNHEALTHY |"
echo "|---|---|---|---|---|"

for arg in "$@"; do
  label=${arg%%=*}
  account_id=${arg#*=}

  member=$(aws guardduty get-member-detectors --region "$REGION" \
    --detector-id "$detector" --account-ids "$account_id" --output json)
  features=$(jq -er '
    if (.UnprocessedAccounts | length) > 0 then error("取得できないアカウントがある: \(.UnprocessedAccounts)") else . end
    | ([.MemberDataSourceConfigurations[0].Features[]? | select(.Name == "RUNTIME_MONITORING")][0]
       // error("応答に RUNTIME_MONITORING がない"))
    | [.Status, ([.AdditionalConfiguration[]? | select(.Name == "ECS_FARGATE_AGENT_MANAGEMENT")][0].Status // "-")]
    | @tsv' <<<"$member")
  IFS=$'\t' read -r runtime ecs <<<"$features"

  filter=$(jq -nc --arg a "$account_id" '{FilterCriterion: [
    {CriterionKey: "ACCOUNT_ID", FilterCondition: {Equals: [$a]}},
    {CriterionKey: "RESOURCE_TYPE", FilterCondition: {Equals: ["ECS"]}}]}')
  coverage=$(aws guardduty get-coverage-statistics --region "$REGION" --detector-id "$detector" \
    --statistics-type COUNT_BY_COVERAGE_STATUS --filter-criteria "$filter" --output json)
  counts=$(jq -er '(.CoverageStatistics.CountByCoverageStatus // {}) | [.HEALTHY // 0, .UNHEALTHY // 0] | @tsv' <<<"$coverage")
  IFS=$'\t' read -r healthy unhealthy <<<"$counts"

  printf '| %s | %s | %s | %s | %s |\n' "$label" "$runtime" "$ecs" "$healthy" "$unhealthy"
done
```

出力例です（値はダミー）。

```
| アカウント | Runtime Monitoring | ECS Fargate エージェント管理 | HEALTHY | UNHEALTHY |
|---|---|---|---|---|
| stg | ENABLED | ENABLED | 3 | 0 |
| prd | ENABLED | ENABLED | 2 | 1 |
```

作るときに気をつけたのは、**誤った表を出すくらいなら止まる**ことです。

- AWS CLI の失敗、メンバーでないアカウント（`UnprocessedAccounts`）、想定外の形の応答（`RUNTIME_MONITORING` がない、detector が複数）はいずれも非0で終了する
- `aws ... | jq` を `$(...)` の中で1回ずつ呼び、変数に代入する。複数の `aws` を1つの `$(...)` にループやパイプでまとめると、途中の失敗が `set -e` で止まらず、欠けた結果がそのまま表になる
- 社内版では、Runtime Monitoring だけでなく finding を通知する EventBridge ルールが有効かなど、後段の構成要素も同じ表に並べている

上の最小版は shellcheck と、AWS CLI をスタブに差し替えた正常系・異常系（未登録アカウント、CLI の失敗、不正な引数）の実行で確認しています。実アカウントでこの最小版そのものを実行したわけではない点はご了承ください。

## Terraform: RDS_DATA_RISK で rds_protection が毎回 replace される

Runtime Monitoring の PR を出したところ、無関係の `rds_protection` が全リージョンで replace になる plan が出ました。

```hcl
resource "aws_guardduty_organization_configuration_feature" "rds_protection" {
  for_each    = toset(data.aws_regions.current.names)
  region      = each.key
  detector_id = aws_guardduty_detector.main[each.key].id
  name        = "RDS_LOGIN_EVENTS"
  auto_enable = "ALL"
}
```

```
  # aws_guardduty_organization_configuration_feature.rds_protection["ap-northeast-1"] must be replaced
      - additional_configuration { # forces replacement
          - auto_enable = "NONE" -> null
          - name        = "RDS_DATA_RISK" -> null # forces replacement
        }
```

原因はこうでした。

- 2026年10月8日に [RDS Protection のデータアクティビティ監視](https://aws.amazon.com/about-aws/whats-new/2026/10/guardduty-rds-data-exfiltration/)がリリースされ、API が `RDS_LOGIN_EVENTS` の `additional_configuration` に `RDS_DATA_RISK` を返すようになった
- 当時の provider（v6.66.0）は `RDS_DATA_RISK` を enum として知らず、**HCL に書くとバリデーションで弾かれる**ので、明示して差分を消すこともできない
- `aws_guardduty_organization_configuration_feature` の `additional_configuration` は `ForceNew` なので、差分は in-place ではなく **replace** になる
- upstream の Issue: [hashicorp/terraform-provider-aws#50461](https://github.com/hashicorp/terraform-provider-aws/issues/50461)

replace は「組織設定の feature を消して作り直す」ことなので、apply させるわけにはいきません。他の PR の plan にもこのノイズが毎回乗るため、provider が対応するまで `ignore_changes` で抑止しました。

```hcl
resource "aws_guardduty_organization_configuration_feature" "rds_protection" {
  # ...

  # NOTE: AWS 側で追加された RDS_DATA_RISK が additional_configuration に返るが、
  #       provider が未対応で HCL に書けず、毎回 replace の差分になるため無視する。
  #       provider が対応したら ignore_changes を外し、RDS_DATA_RISK を明示的に管理する。
  #       https://github.com/hashicorp/terraform-provider-aws/issues/50461
  lifecycle {
    ignore_changes = [additional_configuration]
  }
}
```

その後、[#50445](https://github.com/hashicorp/terraform-provider-aws/pull/50445) が **v6.70.0** でリリースされ、`RDS_DATA_RISK` を書けるようになり、`additional_configuration` を省略した場合のドリフトも解消されました（[CHANGELOG](https://github.com/hashicorp/terraform-provider-aws/releases/tag/v6.70.0)）。v6.70.0 に上げたあと `ignore_changes` を外し、`RDS_DATA_RISK` を HCL で明示的に管理するようにしました。データアクティビティ監視は vCPU あたりの単価がログイン監視より高いので、コストを見てアカウント単位で対象を絞れる設計にしています。

```hcl
resource "aws_guardduty_organization_configuration_feature" "rds_protection" {
  for_each    = toset(data.aws_regions.current.names)
  region      = each.key
  detector_id = aws_guardduty_detector.main[each.key].id
  name        = "RDS_LOGIN_EVENTS"
  auto_enable = "ALL"

  # NOTE: ALL にしないのは、データアクティビティ監視の単価がログイン監視より高く、
  #       aws_guardduty_member_detector_feature でアカウント単位に有効化を判断できるようにするため。
  additional_configuration {
    name        = "RDS_DATA_RISK"
    auto_enable = "NONE"
  }
}
```

`ignore_changes` は「いつ外すか」を書いておかないと残り続けるので、コメントに upstream の Issue と外す条件を書いておいたのが役に立ちました。

## おまけ: S3 Protection と Malware Protection for S3

同じタイミングで、S3 まわりの保護も、コストを見て対象を絞れる設計で入れました。

| 機能 | 何を見るか | 有効化する場所 | 料金（東京） | 絞り方 |
| --- | --- | --- | --- | --- |
| S3 Protection（`S3_DATA_EVENTS`） | CloudTrail の S3 データイベント（不審な取得元からの GetObject、大量取得など） | 委任管理者（`aws_guardduty_member_detector_feature`） | 最初の 5 億イベント/月まで 100 万イベントあたり $1.04 | アカウント単位で対象を選べる |
| Malware Protection for S3 | 新しくアップロードされたオブジェクトのマルウェアスキャン | **バケットを持つ各アカウント**（`aws_guardduty_malware_protection_plan`） | 1,000 リクエストあたり $0.282、スキャンデータ 1 GB あたり $0.1185（月 1,000 リクエスト・1 GB まで無料） | バケット単位で対象を選べる |

- S3 Protection の feature にはバケットを指定する設定がなく（API の `additional_configuration` もない）、**アカウント内の全 S3 データイベントが課金対象**になるので、組織への自動有効化ではなく、委任管理者側で対象アカウントを列挙して選べる設計にしました。見積もりは、そのアカウントの S3 リクエスト数（Tier1 + Tier2）に単価を掛けて出しました
- Malware Protection for S3 は「委任管理者はメンバーアカウントのバケットに対して有効化できない」と[ドキュメント](https://docs.aws.amazon.com/guardduty/latest/ug/gdu-malware-protection-s3.html)に明記されているため、各ワークロードアカウントの Terraform で `for_each` を使って対象バケットを列挙する形にしました。見積もりは「アップロード件数/月」と「アップロード量/月」に単価を掛けるだけで、無料枠に収まることも多いです

```hcl
locals {
  malware_protection_buckets = {
    uploads = aws_s3_bucket.uploads
    inbound = aws_s3_bucket.inbound
  }
}

resource "aws_guardduty_malware_protection_plan" "s3" {
  for_each = local.malware_protection_buckets

  role = aws_iam_role.guardduty_malware_protection_s3.arn

  protected_resource {
    s3_bucket {
      bucket_name = each.value.id
    }
  }

  actions {
    tagging {
      status = "ENABLED"
    }
  }
}
```

既存の単体リソースを `for_each` にする場合は、`moved` ブロックで `aws_guardduty_malware_protection_plan.s3` → `aws_guardduty_malware_protection_plan.s3["uploads"]` に移しておくと作り直しになりません。

## まとめ

- Runtime Monitoring（ECS Fargate）は、委任管理者から `aws_guardduty_member_detector_feature` でアカウントを列挙して有効化すると、stg → prd の段階展開を PR 単位で進められる
- 一番の落とし穴は**タスク実行ロールの ECR 権限**。自アカウントのリポジトリに絞っていると、エージェントの pull が 403 になり新しいタスクが起動しなくなる。stg で問題がなくても prd のロールは別物として事前に確かめる
- `additional_configuration` は EKS / ECS / EC2 の3つとも、API の返却順で明示する
- `RDS_DATA_RISK` による `rds_protection` の replace ドリフトは v6.70.0 で解消された。それ以前は `ignore_changes` で抑止し、外す条件をコメントに残しておく
- コストは「タスク vCPU × 稼働時間」から見積もれる。料金とは別に、サイドカーがタスクのリソースを共有する影響も見ておく
- 展開状況は手書きの表ではなく、AWS の実状態から出す。スクリプトは誤った結果を出すより止まるように作る

参考になれば幸いです。

## 参考

- [Prerequisites for AWS Fargate (Amazon ECS only) support](https://docs.aws.amazon.com/guardduty/latest/ug/prereq-runtime-monitoring-ecs-support.html)
- [Deploying the security agent to Amazon ECS on Fargate](https://docs.aws.amazon.com/guardduty/latest/ug/how-runtime-monitoring-works-ecs-fargate.html)
- [Amazon ECR repository hosting GuardDuty agent](https://docs.aws.amazon.com/guardduty/latest/ug/runtime-monitoring-ecr-repository-gdu-agent.html)
- [How the security agent connects to GuardDuty](https://docs.aws.amazon.com/guardduty/latest/ug/runtime-monitoring-agent-connectivity.html)
- [Troubleshooting agent connectivity](https://docs.aws.amazon.com/guardduty/latest/ug/runtime-monitoring-agent-connectivity-troubleshooting.html)
- [Validating VPC endpoint configuration](https://docs.aws.amazon.com/guardduty/latest/ug/validate-vpc-endpoint-config-runtime-monitoring.html)
- [Runtime coverage and troubleshooting for Amazon ECS clusters](https://docs.aws.amazon.com/guardduty/latest/ug/gdu-assess-coverage-ecs.html)
- [GuardDuty Runtime Monitoring finding types](https://docs.aws.amazon.com/guardduty/latest/ug/findings-runtime-monitoring.html)
- [GetMemberDetectors](https://docs.aws.amazon.com/guardduty/latest/APIReference/API_GetMemberDetectors.html) / [GetCoverageStatistics](https://docs.aws.amazon.com/guardduty/latest/APIReference/API_GetCoverageStatistics.html)
- [GuardDuty Malware Protection for S3](https://docs.aws.amazon.com/guardduty/latest/ug/gdu-malware-protection-s3.html)
- [Amazon GuardDuty pricing](https://aws.amazon.com/guardduty/pricing/)
- [Amazon GuardDuty RDS Protection for data activity（What's New）](https://aws.amazon.com/about-aws/whats-new/2026/10/guardduty-rds-data-exfiltration/)
- [hashicorp/terraform-provider-aws#50461](https://github.com/hashicorp/terraform-provider-aws/issues/50461)
- [hashicorp/terraform-provider-aws#50445](https://github.com/hashicorp/terraform-provider-aws/pull/50445)
- [terraform-provider-aws v6.70.0](https://github.com/hashicorp/terraform-provider-aws/releases/tag/v6.70.0)
