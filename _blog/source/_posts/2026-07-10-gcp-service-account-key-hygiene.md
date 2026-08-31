---
title: Google Cloud のサービスアカウントキーを放置しないためにやっていること
date: 2026-07-10
lang: ja
translation_id: gcp-service-account-key-hygiene
cover: /img/cover/2026-07-10-gcp-service-account-key-hygiene.svg
categories:
- [Google Cloud]
- [Security]
tags:
- Google Cloud
- IAM
- Service Account
- Security
- Workload Identity Federation
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

Terraform で管理している Google Cloud プロジェクトの棚卸しをしていて、何年も使われていない・ローテーションされていないサービスアカウント（SA）キーが残っているのを見つけたことがあります。
発行した本人からすると「一時的に使うだけのつもりだった」キーでも、放置すれば長期間有効な認証情報がどこかに眠り続けることになります。

この記事では、SA キーを放置しないために確認したことと、実際にやっている・やろうとしている対策を整理します。

<!-- more -->

## 結論

先に対策の全体像を表にまとめます。

| フェーズ | やること |
| --- | --- |
| 検出 | Cloud Asset Inventory でキーの作成日時を横断的に洗い出す |
| 予防 | 組織ポリシーでキーの新規作成・アップロードを禁止する |
| 代替 | 可能な箇所は Workload Identity Federation / インパーソネーションに置き換えてキーレス化する |
| どうしても必要な場合 | 90日ごとのローテーション + 監査ログでの追跡性確保 |

「キーを見つけたら消す」だけではまた同じことが起きるので、**予防（作らせない）→検出（残っているものを洗い出す）→代替（キーレスに寄せる）**の3点セットで考えるようにしています。

## なぜ SA キーを放置してはいけないのか

サービスアカウントキーは JSON ファイル1枚で長期間有効な認証情報です。ローテーションしなければ実質的に「有効期限のない鍵」として存在し続けます。

AWS で言えば、**IAM User の credentials（AWS Access Key ID / Secret Access Key）と同等の存在**です。IAM User のアクセスキーが漏洩・放置のリスクから「極力使わず、IAM ロール（一時的な認証情報）に寄せる」ことが推奨されている（[Security best practices in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)）のと同じ理由で、GCP の SA キーも極力使わずインパーソネーションや Workload Identity Federation のような一時的な認証情報に寄せるべき、という整理になります。

- ダウンロードした JSON ファイルはローカル・CI のシークレットストア・Git 誤コミットなど、管理者の目が届かない場所に増殖しやすい
- キーだけを盗まれた場合、正規の手段でアクセスされたように見えてしまい、不正利用の検知が難しい

Google Cloud の公式ドキュメント（[Best practices for managing service account keys](https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys)）でも「サービスアカウントキーは強力な認証情報であり、管理が不適切だとセキュリティリスクになる」と明記されており、キーを使う場合は「より安全な認証方法がない」ことの確認が前提とされています。

## 棚卸し・検出

まずは今どれだけキーがあるかを把握します。

単一のサービスアカウントについてキー一覧・作成日を見るだけなら、以下のコマンドで確認できます。

```bash
# user-managed キーのうち作成日時を確認
gcloud iam service-accounts keys list \
  --iam-account=my-iam-account@my-project.iam.gserviceaccount.com \
  --managed-by=user
```

`--created-before` を使えば、一定期日より前に作られたキーだけに絞り込めます（[gcloud iam service-accounts keys list リファレンス](https://docs.cloud.google.com/sdk/gcloud/reference/iam/service-accounts/keys/list)）。

```bash
# 2015年7月19日より前に作られた user-managed キーだけ抽出（ローテーション対象の洗い出し）
gcloud iam service-accounts keys list \
  --iam-account=my-iam-account@my-project.iam.gserviceaccount.com \
  --managed-by=user --created-before=2015-07-19T12:00:00Z
```

ただしこれはサービスアカウント単位のコマンドなので、組織・プロジェクト横断でキーを洗い出すには Cloud Asset Inventory の [`search-all-resources`](https://docs.cloud.google.com/asset-inventory/docs/searching-resources) の方が使いやすいです。

```bash
# 組織配下の全プロジェクトから、指定日時より前に作られた SA キーを横断的に検索
gcloud asset search-all-resources \
  --scope="organizations/123456789012" \
  --query="createTime < 2023-03-10" \
  --asset-types="iam.googleapis.com/ServiceAccountKey" \
  --order-by="createTime"
```

これで「どのプロジェクトの、どのサービスアカウントに、いつ作られたキーが残っているか」が一覧化できます。

## 防止策

見つけて消すだけでは根本解決にならないので、そもそも作らせない仕組みを入れます。

### 組織ポリシーでキー作成・アップロードを禁止する

Google Cloud には SA キーの作成・アップロードを禁止する組織ポリシー制約があります（[Restricting service account usage](https://docs.cloud.google.com/resource-manager/docs/organization-policy/restricting-service-accounts)）。

| 制約 | 内容 |
| --- | --- |
| `iam.disableServiceAccountKeyCreation`（レガシー） | ユーザー管理キーの新規作成を禁止 |
| `iam.managed.disableServiceAccountKeyCreation`（新版） | 同上（新しい管理系制約） |
| `iam.disableServiceAccountKeyUpload`（レガシー） | 既存の公開鍵のアップロードを禁止 |
| `iam.managed.disableServiceAccountKeyUpload`（新版） | 同上 |

有効化はプロジェクト・フォルダ・組織単位で、たとえば次のように設定します。

```bash
gcloud resource-manager org-policies enable-enforce \
  --organization='ORGANIZATION_ID' \
  iam.disableServiceAccountKeyCreation
```

有効化した状態でキーを作ろうとすると `Key creation is not allowed on this service account` というエラーになり、そもそもキーが作れなくなります。

なお、**2024年5月3日以降に作成された組織ではこの制約がデフォルトで有効**になっている（[Secure by default organization policies](https://docs.cloud.google.com/resource-manager/docs/secure-by-default-organizations) に明記）ため、比較的新しい組織であればすでに作成自体がブロックされている可能性があります（自分の環境がいつ作成された組織かは確認しておくとよさそうです）。

### それでもキーが必要な場合は例外を定義する

組織全体でキー作成を禁止すると、次のように WIF・インパーソネーションへ寄せられない箇所で詰まることがあります。

- **WIF の `external_account` 認証情報に対応していない SDK・クライアントライブラリ／ツールを使っている場合**: Workload Identity Federation は外部トークンを Security Token Service で交換する仕組みですが、これを利用するには呼び出し側のライブラリやツールが `external_account` 形式の認証情報に対応している必要があります。古いバージョンのライブラリや、GCP 接続手段として「サービスアカウントの JSON キーをアップロードする」形式しか用意されていないサードパーティの SaaS・BI ツールでは、原理的にキー以外の選択肢がありません
- **OIDC/SAML トークンを発行できない実行基盤**: Workload Identity Federation は OIDC/SAML 2.0 に対応した ID プロバイダーが前提のため、そもそも外部トークンを発行できない古いオンプレミス基盤・バッチサーバーなどでは適用できません

Google Cloud の公式ドキュメントでも、組織の階層ルートで制約を適用してキー作成を原則禁止とし、必要なプロジェクトに限って制約をオーバーライドする形が推奨されています（[Best practices for managing service account keys](https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys)）。組織・フォルダ単位で禁止を強制しつつ、例外が必要なプロジェクトだけ親ポリシーをオーバーライドする形にすると、狭い範囲に絞りやすくなります。

```yaml
# 組織全体でキー作成を禁止（/tmp/org_policy.yaml）
name: organizations/ORGANIZATION_ID/policies/iam.disableServiceAccountKeyCreation
spec:
  rules:
  - enforce: true
```

```yaml
# 例外を許可する特定のプロジェクトだけ、親ポリシーをオーバーライド（/tmp/project_policy.yaml）
name: projects/PROJECT_ID/policies/iam.disableServiceAccountKeyCreation
spec:
  rules:
  - enforce: false
```

```bash
gcloud org-policies set-policy /tmp/org_policy.yaml
gcloud org-policies set-policy /tmp/project_policy.yaml

# 有効なポリシー（継承・オーバーライドの結果）を確認
gcloud org-policies describe iam.disableServiceAccountKeyCreation \
  --effective --project=PROJECT_ID
```

プロジェクト単位よりさらに細かく絞りたい場合は、タグを使った条件付きポリシー（`resource.matchTag('ORGANIZATION_ID/TAG_KEY', 'TAG_VALUE')` のような条件式で特定のリソースだけ対象にする書き方）も用意されています（[Setting an organization policy with tags](https://docs.cloud.google.com/resource-manager/docs/organization-policy/tags-organization-policy)）。ただしタグキー・タグ値の作成手順まで含めた運用は試せていません。

いずれの方法でも、**「原則禁止・例外は個別に許可を明示する」**形にしておくことで、なし崩し的にキー作成が広がるのを防げます。

### キーレス認証への置き換え

キーを作らせないようにするだけでなく、キーが必要だった用途自体をキーレスに置き換えられないかも検討します。

- **[Workload Identity Federation](https://docs.cloud.google.com/iam/docs/workload-identity-federation)**: AWS・Azure・GitHub・GitLab・Kubernetes・Active Directory など、OIDC/SAML 2.0 に対応した外部 IdP の認証情報をそのまま使って Google Cloud にアクセスできる仕組み。外部 ID からのトークンを Security Token Service が検証し、短期の OAuth 2.0 アクセストークンに変換する流れなので、JSON キーを発行・配布する必要がなくなる
- **GCE / GKE 上のワークロード**: マネージドなワークロード ID（アタッチされたサービスアカウント）を使い、そもそもキーを持ち出さない
- **開発者のローカル環境**: サービスアカウントの権限借用（[インパーソネーション](https://docs.cloud.google.com/iam/docs/service-account-impersonation)）を使い、個人の Google アカウントの認証情報から一時的に権限を借りる形にする

CI/CD で GitHub Actions を使っている場合は、Workload Identity Federation に置き換えるだけで「リポジトリに GCP の JSON キーを Secret として保存する」状態自体をなくせるので、優先的に置き換える価値があります。

## どうしても必要な場合

インパーソネーションや Workload Identity Federation に寄せられず、キーを使わざるを得ない箇所も残ります。その場合は次を徹底します。

- **90日ごとのローテーション**: 公式ドキュメント（[Rotate service account keys](https://docs.cloud.google.com/iam/docs/key-rotation)）でも「漏えいのリスクを減らすため少なくとも90日ごとにローテーションすることを推奨」とされています。手順は「対象キーの特定 → 新しいキーの発行 → アプリケーション側の切り替え → 旧キーの無効化・動作確認 → 旧キーの削除」という流れです
- **監査ログでの追跡性確保**: IAM API・Security Token Service API のデータアクセスログを有効化し、CI/CD のログと Cloud Audit Logs を相関させておくことで、キーを使った操作でも「いつ・どのパイプライン実行が・何をしたか」を追えるようにしておく

## まとめ

- SA キーは実質的に「有効期限のない認証情報」になりがちで、放置すると気づかないところに残り続ける
- **予防**（組織ポリシーでキー作成・アップロードを禁止）→**検出**（Cloud Asset Inventory で横断的に洗い出す）→**代替**（Workload Identity Federation 等でキーレス化）の3点セットで考える
- どうしてもキーが必要な場合は90日ごとのローテーションと監査ログでの追跡性確保をセットで行う

自分の環境でも棚卸し・組織ポリシーの適用はまだ途上なので、今後実施した内容はまた記事にする予定です。
参考になれば幸いです。

## 参考

- [Best practices for managing service account keys | IAM Documentation](https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys)
- [Best practices for using service accounts | IAM Documentation](https://cloud.google.com/iam/docs/best-practices-service-accounts)
- [Secure by default organization policies | Resource Manager Documentation](https://docs.cloud.google.com/resource-manager/docs/secure-by-default-organizations)
- [Restricting service accounts | Resource Manager Documentation](https://cloud.google.com/resource-manager/docs/organization-policy/restricting-service-accounts)
- [Workload identity federation | IAM Documentation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Rotate service account keys | IAM Documentation](https://cloud.google.com/iam/docs/key-rotation)
