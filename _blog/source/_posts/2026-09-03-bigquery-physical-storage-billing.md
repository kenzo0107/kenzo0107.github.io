---
title: BigQuery のストレージ課金を物理課金に切り替えるべきか — 損益分岐点と削減率の目安
date: 2026-09-03
lang: ja
translation_id: bigquery-physical-storage-billing
cover: /img/cover/2026-09-03-bigquery-physical-storage-billing.svg
categories:
- [Google Cloud]
- [Data Analytics]
tags:
- Google Cloud
- BigQuery
- Cost Optimization
- Terraform
- SQL
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

BigQuery のストレージ課金モデルを LOGICAL（論理）から PHYSICAL（物理）に切り替え、対象データセットのストレージコストを **68% 削減**（月約 $81 → 約 $26）しました。

ただ「うちは何%削減できるのか」は圧縮率とリージョンで決まるので、削減額の実績よりも**損益分岐点と削減率の目安**の方が役に立つと思います。この記事はそこを主題にしています。試算用のカルキュレーターも作ったので、自分のデータの数値を入れてみてください。

調べてみると、よく言われる「**圧縮率が2倍を超えたら物理課金が得**」は US マルチリージョンだけの数字でした。実際の損益分岐点はリージョンによって **1.23倍〜3.04倍**まで変わります。東京（asia-northeast1）の長期ストレージなら **1.63倍**で、思っているよりずっと低いところに分岐点があります。

※ 本記事は **2026年9月3日時点**の調査です。単価は Cloud Billing Catalog API から取得した定価で、改定される可能性があります。

<!-- more -->

## 結論

| 論点 | 結論 |
| --- | --- |
| 判断に必要な数字 | **圧縮率**（論理÷物理）、**churn 比**（time travel + fail-safe の量）、**リージョン**の3つだけ |
| 損益分岐点 | 「2倍」は US マルチリージョン限定。**1.23倍〜3.04倍**の幅があり、東京の長期は 1.63倍 |
| 削減率の上限 | `1 − 損益分岐点 ÷ 圧縮率`。圧縮率が無限でも100%には届かない |
| 落とし穴 | PHYSICAL では time travel / fail-safe も課金対象。**圧縮率が高くても churn が大きいと逆ざや**になる |
| データ欠損・性能影響 | なし。メータリング設定の変更のみ（公式ドキュメントに明記） |
| デメリット | 14日間の再変更ロック。同一リージョンのレガシー flat-rate スロットコミットメントがあると登録不可 |

## カルキュレーター

`INFORMATION_SCHEMA` から取れる数値を入れると、削減率・削減額・損益分岐点を計算します。48リージョンの定価を Cloud Billing Catalog API から取得して埋め込んでいます。

**→ [BigQuery 物理ストレージ課金 損益分岐点カルキュレーター](/bigquery-physical-billing-calculator.html)**

入力に使う SQL もカルキュレーター側に置いてあります。以下は本記事で説明する内容と同じ計算をしています。

## 削減率はこう決まる

課金対象は以下のとおりです。**PHYSICAL では time travel（既定7日）と fail-safe（7日）のバイトも課金される**のが要点で、LOGICAL では課金されません。

| | LOGICAL（既定） | PHYSICAL |
| --- | --- | --- |
| 課金対象 | 非圧縮の論理バイト | 圧縮後の物理バイト |
| time travel / fail-safe | **課金されない** | **課金される** |

これを式にすると、削減率は圧縮率と損益分岐点だけで書けます。

```
削減率 = 1 − 損益分岐点 ÷ 実効圧縮率

  実効圧縮率 = 論理バイト ÷ （物理バイト + time travel + fail-safe）
  損益分岐点 = 物理単価 ÷ 論理単価（同じ階層で比較）
```

分母に time travel / fail-safe が入るのがポイントです。データ本体がよく圧縮されていても、churn（書き込み・削除）が大きいとこの分で実効圧縮率が落ち、分岐点を割ります。

## 損益分岐点は「2倍」ではない

Cloud Billing Catalog API から全リージョンの単価を取得して分岐点（物理単価 ÷ 論理単価）を計算すると、こうなりました。

| リージョン | 長期（90日超）の分岐点 | Active の分岐点 |
| --- | --- | --- |
| me-central2 | **1.23倍** | 1.73倍 |
| us-central1 / us-west1 / us-west8 | **1.25倍** | 1.74倍 |
| us-east1 | 1.38倍 | 1.91倍 |
| us-east4 / us-west2 / northamerica-northeast1 など | 1.56倍 | 2.17倍 |
| **asia-northeast1（東京）** | **1.63倍** | 2.26倍 |
| **US マルチリージョン** | **2.00倍** | 2.00倍 |
| EU マルチリージョン | 2.20倍 | 2.20倍 |
| asia-east1 / asia-southeast1 / europe-north1 | 2.30倍 | 2.30倍 |
| southamerica-east1 | 2.19倍 | **3.04倍** |

読み取れることが3つあります。

- **「圧縮率2倍」は US マルチリージョンの数字**。しかも両階層がちょうど2.00倍になるのは US マルチリージョンだけで、他は階層ごとに分岐点が違う
- **シングルリージョンは長期の分岐点が低い**。us-central1 なら 1.25倍、東京でも 1.63倍。ほとんどの分析系データはここを超えるので、**長期データが主体なら大半のケースで物理課金が有利**
- **Active は分岐点が高い**。同じ東京でも Active は 2.26倍。更新が続いていて長期階層に落ちていないデータセットは慎重に見る

全48リージョンの分岐点はカルキュレーター側の表に載せています。

## 圧縮率ごとの削減率の目安

`削減率 = 1 − 分岐点 ÷ 圧縮率` に当てはめた表です（すべて長期ストレージ・churn 0 の場合）。

| 圧縮率 | us-central1<br/>(1.25倍) | asia-northeast1<br/>(1.63倍) | US マルチ<br/>(2.00倍) | EU マルチ<br/>(2.20倍) |
| --- | --- | --- | --- | --- |
| 1.5倍 | 17% | 増える（-8%） | 増える（-33%） | 増える（-47%） |
| 2倍 | 38% | 19% | 0%（分岐点） | 増える（-10%） |
| 3倍 | 58% | 46% | 33% | 27% |
| 4倍 | 69% | 59% | 50% | 45% |
| 6倍 | 79% | 73% | 67% | 63% |
| 10倍 | 88% | 84% | 80% | 78% |
| 20倍 | 94% | 92% | 90% | 89% |

分析系のデータは列指向で圧縮が効くので 3〜6倍程度、GA4 エクスポートのようなネスト・反復構造の多いデータは 10〜20倍になることもあります。**圧縮率4倍あたりで「半分になる」**と覚えておくと目安になります。

## 削減額の目安

削減率は容量に依存しませんが、**削減額は容量に比例**します。US マルチリージョン・全て長期ストレージの場合の月額削減見込みです。

| 論理容量 | 圧縮率3倍 | 4倍 | 6倍 | 10倍 |
| --- | --- | --- | --- | --- |
| 100 GiB | $0.3 | $0.5 | $0.7 | $0.8 |
| 1 TiB | $3.4 | $5.1 | $6.8 | $8.2 |
| 10 TiB | $34 | $51 | $68 | $82 |
| 100 TiB | $341 | $512 | $683 | $819 |
| 1 PiB | $3,495 | $5,243 | $6,990 | $8,389 |

ストレージ単価がそもそも安いので、**論理で数TiB未満なら切り替えても月数ドル**です。作業コストと14日ロックのリスクに見合うかは考えたほうがよく、逆に10TiB以上あるなら効果は明確に出ます。今回のケースは論理 8TiB で月 $55 でした。

なお毎月10GiBの無料枠があるため、小さいデータセットでは表の値より実際の削減額は小さくなります。

## churn が分岐点を押し上げる

ここが一番の落とし穴です。time travel / fail-safe バイトは実効圧縮率の分母に入るので、churn が大きいと分岐点を実質的に押し上げます。

US マルチリージョンの単価で展開すると、こうなります。

```
削減率 = 1 − (2 × 長期物理 + 4 × churn) ÷ 論理

  churn = time travel + fail-safe + Active 物理
```

churn の係数が 2 ではなく **4** です。time travel / fail-safe は直近のバイトなので Active Physical 単価（長期の2倍）で計上されるためです。実際、切替後の請求データには `Active Physical Storage (US)` の SKU が 0.13 GiB-month/日 で現れており、これが churn 分でした（請求データからの観測で、単価階層を明記した公式記述は確認できていません）。

この式を損益分岐点で解くと `本体の圧縮率 = 2 + 4c` になります。**本体の圧縮率**は churn を除いた `論理 ÷ 長期物理`、`c` は churn 比 `churn ÷ 長期物理` です。

| churn 比 `c` | 必要な本体の圧縮率 |
| --- | --- |
| 0 | 2.0倍 |
| 0.1 | 2.4倍 |
| 0.25 | 3.0倍 |
| 0.5 | 4.0倍 |
| 1.0 | 6.0倍 |

具体例を挙げると、**論理 20 GiB / 物理 5 GiB（本体は4倍圧縮）だが time travel 8 GiB・fail-safe 6 GiB** というデータセットでは、実効圧縮率が 20 ÷ 19 = **1.05倍**まで落ちて分岐点 2.00倍を大きく下回り、切り替えると**コストが90%増加**します。今回の調査でも、小規模で日次更新のあるデータセットは試算で **+129%** になり、切替対象から外しました。

つまり **「小さくて更新頻度が高い」データセットほど危険**で、逆に「大きくて追記のみ」なら安全に効果が出ます。

参考として、churn を左右する要因です。

| | 有利（実効圧縮率が上がる） | 不利 |
| --- | --- | --- |
| 圧縮率 | 低カーディナリティの繰り返し文字列、時系列・ログ、NULL の多い疎なカラム、ネスト・反復構造（GA4 等）、クラスタリングで並びが揃っている | UUID・ハッシュ・暗号化列、ランダム値、既に圧縮済みのデータを BYTES/STRING に格納、高カーディナリティ |
| churn | 追記のみ（append-only）、更新が特定パーティションに限定 | 頻繁な UPDATE / DELETE / MERGE、パーティション全上書き、日次の CREATE / DROP、streaming insert |

**time travel ウィンドウは既定7日を2日まで短縮できる**ので churn を減らせますが、**fail-safe の7日は固定で短縮できません**。

## 判断方法: 自分のデータで測る

### Step 1: `INFORMATION_SCHEMA.TABLE_STORAGE` を有効化する

物理バイト数が見えないと何も判断できません。既定では無効なので、リージョンごとに有効化します。

```sql
ALTER PROJECT `my-project` SET OPTIONS (`region-us.enable_info_schema_storage` = TRUE);
ALTER PROJECT `my-project` SET OPTIONS (`region-asia-northeast1.enable_info_schema_storage` = TRUE);
```

設定変更のみで既存の利用への影響はありませんが、**統計が集まるまで約1日**かかります。判断のリードタイムとして見込んでおく必要があります。

### Step 2: 圧縮率と churn をデータセット単位で出す

```sql
SELECT
  table_schema AS dataset,
  ROUND(SUM(total_logical_bytes)  / POW(1024,3), 1) AS logical_gib,
  ROUND(SUM(total_physical_bytes) / POW(1024,3), 1) AS physical_gib,
  ROUND(SAFE_DIVIDE(SUM(total_logical_bytes), SUM(total_physical_bytes)), 2) AS compression_ratio,
  ROUND(SAFE_DIVIDE(
    SUM(active_physical_bytes + time_travel_physical_bytes + fail_safe_physical_bytes),
    SUM(long_term_physical_bytes)), 3) AS churn_ratio
FROM `my-project.region-us.INFORMATION_SCHEMA.TABLE_STORAGE`
GROUP BY 1
ORDER BY logical_gib DESC;
```

今回の結果です（`region-us` / `region-asia-northeast1` それぞれで実行）。

| リージョン | データセット | logical_gib | physical_gib | compression_ratio |
| --- | --- | --- | --- | --- |
| US | 外部 SaaS からのクローン | 8,095.0 | 1,296.3 | **6.2** |
| US | その他（各1GiB未満） | - | - | 0.3〜7.8 |
| asia-northeast1 | GA4 エクスポート（`analytics_<property_id>`） | 350.5 | 16.4 | **21.3** |
| asia-northeast1 | 同（他プロパティ、計約50GiB） | - | - | 12.6〜26.1 |

**リージョン単位ではなくデータセット単位で見る**のが重要です。圧縮率が1倍を切る小さなデータセットも混在していました（規模が小さく無視できると判断）。`TABLE_STORAGE` はリージョンごとのビューなので、リージョンの数だけクエリを叩く必要があります。

### Step 3: churn は `deleted = true` 込みで数日分見る

ここで一度判断を誤りました。ある時点のスナップショットで対象データセットの time travel 物理バイトが0だったため「真に静的なデータ」と結論づけたのですが、`deleted = true` の履歴を含めて確認すると、日次で作成・削除される一時テーブル（`_bqc_*`）があり、削除時に 0.14〜0.33GiB 程度の time travel バイトが発生していました。

```sql
-- deleted = true の履歴込みで churn を確認する
SELECT
  table_schema AS dataset,
  ROUND(SUM(time_travel_physical_bytes) / POW(1024,3), 2) AS time_travel_gib,
  ROUND(SUM(fail_safe_physical_bytes)   / POW(1024,3), 2) AS fail_safe_gib,
  COUNTIF(deleted) AS deleted_tables
FROM `my-project.region-us.INFORMATION_SCHEMA.TABLE_STORAGE`
WHERE deleted OR time_travel_physical_bytes > 0
GROUP BY 1
ORDER BY time_travel_gib DESC;
```

再試算しても追加コストは合計 **約 $0.35/月**（削減見込み $61/月 の 0.6%）で結論は変わりませんでしたが、**1時点のスナップショットで「churn ゼロ」と判断してはいけない**という教訓になりました。

### Step 4: データ欠損・機能影響がないことを一次資料で確認する

> "Changing your storage billing model only changes the metering configuration. It does not involve data migration, file format conversion, or any infrastructure changes. Your data is always stored in the same compressed physical format."
>
> "Changing this setting has no impact on query performance, latency, or integration with other applications, such as Looker."
>
> — [Dataset storage billing models](https://cloud.google.com/bigquery/docs/datasets-intro#dataset_storage_billing_models)

**メータリング設定の変更のみ**で、そもそもデータは常に同じ圧縮済み物理フォーマットで保存されている、と明記されています。既存の書き込みジョブ、GA4 エクスポート、Storage Read API 経由の外部からの読み取りはいずれも影響を受けません。

### Step 5: 事前確認 — レガシー flat-rate スロットコミットメント

> "You can't enroll a dataset in physical storage billing if your organization has any existing legacy flat-rate slot commitments located in the same region as the dataset."

**同一リージョンにレガシー flat-rate スロットコミットメントがあると登録できません**。しかもこれは組織単位の制約なので、対象プロジェクトの予約・コミットメントが0件でも足りません。他プロジェクトも含めて確認が必要です。

## 対応方法

```sql
ALTER SCHEMA `my-project.region-us.my_dataset`
  SET OPTIONS (storage_billing_model = 'PHYSICAL');
```

Terraform 管理下のデータセットなら属性1つです。

```hcl
resource "google_bigquery_dataset" "my_dataset" {
  dataset_id            = "my_dataset"
  location              = "US"
  storage_billing_model = "PHYSICAL"
}
```

実施上の注意は2点です。

- **反映まで最大24時間**かかる
- 以後 **14日間は再変更不可**

再変更ロックは当初「30日間」と誤って認識していました。公式ドキュメントを確認したところ14日間が正しい値でした。いずれにせよ「切り替えて様子を見てダメなら戻す」がすぐにはできないので、事前の試算が効いてきます。

## 実測での裏取り

「切り替えたので安くなったはず」で終わらせないために、[Cloud Billing の BigQuery エクスポート](https://cloud.google.com/billing/docs/how-to/export-data-bigquery)で実測しました。

日次で SKU 別のコストを並べると、切替直後に**評価してはいけない期間**があります。

- **移行期**: 論理ストレージの計上が止まってから物理ストレージの計上が始まるまで、2〜3日ほど計上がほぼ抜ける
- **エクスポート遅延**: 直近数日は集計途中。`MAX(export_time)` を確認し、未確定の日は除外する

そこで、切替前後それぞれの安定した日だけを窓に取りました。

```sql
WITH daily AS (
  SELECT
    DATE(usage_start_time, "Asia/Tokyo") AS day,
    sku.description AS sku,
    SUM(cost) AS cost,
    SUM(usage.amount_in_pricing_units) AS pricing_units
  FROM `billing-project.cost.gcp_billing_export_v1_XXXXXX`
  WHERE project.id = "my-project"
    AND service.description = "BigQuery"
    AND sku.description LIKE "%Storage%"
    AND sku.description NOT LIKE "%Network%"   -- egress SKU を除外
    AND (DATE(usage_start_time, "Asia/Tokyo") BETWEEN "2026-08-18" AND "2026-08-25"   -- 切替前
      OR DATE(usage_start_time, "Asia/Tokyo") BETWEEN "2026-08-30" AND "2026-08-31")  -- 切替後
  GROUP BY 1, 2
)
SELECT
  IF(day <= "2026-08-25", "1_before", "2_after") AS phase,
  sku,
  ROUND(AVG(cost), 1) AS cost_per_day,
  ROUND(AVG(pricing_units), 1) AS gib_month_per_day
FROM daily
GROUP BY 1, 2
HAVING cost_per_day > 0
ORDER BY 1, 3 DESC;
```

日次の SKU 別コストを **CTE で1日単位に集約してから `AVG` を取る**のがポイントです。集約せずに `AVG(cost)` すると1請求行あたりの平均になり、日次コストとして解釈できない値が出ます（最初これで桁を間違えました）。

| 期間 | SKU | 課金量（GiB-month/日） | コスト/日 | 月換算 |
| --- | --- | --- | --- | --- |
| 8/18〜8/25（切替前） | Long Term **Logical** Storage | 261.1 | $2.61 | 約 **$81** |
| 8/30〜8/31（切替後） | Long-Term **Physical** Storage | 41.7 | $0.83 | 約 **$26** |

- **削減額 約 $55/月、削減率 68%**
- 課金対象量が 261.1 → 41.7 GiB-month/日 なので、**実測の実効圧縮率は 6.26倍**。事前に `INFORMATION_SCHEMA` から算出した 6.2倍とほぼ一致した
- 上の式に入れると `1 − 2.01 ÷ 6.23 = 67.8%` で、実測の 68% と一致する
- 懸念していた time travel / fail-safe の上乗せは、日次コストに埋没する規模だった

SKU が `Long Term Logical Storage` から `Long-Term Physical Storage` に**入れ替わっている**ことも、切替が実際に効いていることの裏取りになります。切替対象外の asia-northeast1 は論理ストレージのまま横ばい、Storage Read API の egress も傾向差なし（課金モデルは egress に影響しないので想定どおり）でした。

実機側の設定も確認しておきます。

```sql
SELECT schema_name, option_name, option_value
FROM `my-project.region-us.INFORMATION_SCHEMA.SCHEMATA_OPTIONS`
WHERE option_name = "storage_billing_model";
```

このビューは **PHYSICAL のデータセットだけを列挙**します。未切替のリージョンでは0行が返るので、0行は「設定されていない（= 既定の LOGICAL）」を意味します。

## ハマりどころまとめ

- **「圧縮率2倍」を全リージョンに当てはめない**。US マルチリージョン以外は分岐点が違い、階層（Active / 長期）でも違う
- **圧縮率が高くても churn が大きいと逆ざや**。小さくて更新頻度の高いデータセットは切り替えない
- **1時点のスナップショットで churn ゼロと判断しない**。`deleted = true` 込みで見ると日次の一時テーブルが time travel を発生させていた
- **`INFORMATION_SCHEMA.TABLE_STORAGE` は既定で無効**。有効化から統計が揃うまで約1日かかる
- **請求エクスポートは直近数日が未確定**。`MAX(export_time)` を確認せずに直近を含めると削減幅を過大評価する
- **切替直後は計上が抜ける日がある**。移行期をまたいだ平均は取らず、前後それぞれの安定日で窓を切る
- **14日間の再変更ロック**（30日ではない）。切り戻し前提の運用はできない

## まとめ

- 削減率は `1 − 損益分岐点 ÷ 実効圧縮率` だけで決まる。容量は削減「額」にしか効かない
- **損益分岐点は「2倍」固定ではなく 1.23倍〜3.04倍**。US マルチリージョンが 2.00倍、東京の長期は 1.63倍。**長期データが主体なら大半のリージョンで物理課金が有利**
- 目安として**圧縮率4倍で約半分**、6倍で約3分の1になる。分析系データは3〜6倍、GA4 のようなネスト構造は10〜20倍も出る
- ただし PHYSICAL では time travel / fail-safe が Active 単価で課金され、**churn 比 0.5 で必要圧縮率は2倍→4倍に跳ね上がる**。小規模・高頻度更新のデータセットは切り替えない
- 切替はメータリング設定の変更のみで、データ移行・性能影響・既存連携への影響はない。制約は14日ロックと組織内レガシーコミットメントの2点
- 自分のデータでの試算は[カルキュレーター](/bigquery-physical-billing-calculator.html)で確認できます

参考になれば幸いです。

## 参考

- [Dataset storage billing models](https://cloud.google.com/bigquery/docs/datasets-intro#dataset_storage_billing_models)
- [Storage pricing](https://cloud.google.com/bigquery/pricing#storage)
- [TABLE_STORAGE view](https://cloud.google.com/bigquery/docs/information-schema-table-storage)
- [SCHEMATA_OPTIONS view](https://cloud.google.com/bigquery/docs/information-schema-schemata-options)
- [Export Cloud Billing data to BigQuery](https://cloud.google.com/billing/docs/how-to/export-data-bigquery)
- [Cloud Billing Catalog API](https://cloud.google.com/billing/docs/reference/rest/v1/services.skus/list)
- [google_bigquery_dataset](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/bigquery_dataset)
