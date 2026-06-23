---
title: 監査ログの保存先に Cloud Logging バケットと Cloud Storage どちらを選ぶか
date: 2026-06-23
lang: ja
translation_id: gcp-cloud-logging-bucket-vs-cloud-storage
cover: /img/cover/2026-06-23-gcp-cloud-logging-bucket-vs-cloud-storage.svg
categories:
- [Google Cloud]
tags:
- Google Cloud
- Cloud Logging
- Cloud Storage
- BigQuery
- 監査ログ
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

Google Cloud で監査ログを集約・長期保管する構成を検討した際、保存先として **Cloud Logging バケット** と **Cloud Storage（GCS）** のどちらを選ぶかで悩みました。
名前が似ているうえ、どちらもログを貯められるため混同しやすいのですが、両者は得意分野がはっきり分かれています。

この記事では、その差異を「**利用用途からどちらを選ぶか**」という観点で整理します。

<!-- more -->

## そもそも何を解決したいのか

ログ集約の目的は、多くの場合この2つに分解できます。

1. **横断検索**: 複数プロジェクト・複数アカウントに散ったログをまとめて検索したい
2. **長期・改ざん耐性のある保管**: インシデント追跡や監査対応のため、改ざんされない形で長期保管したい（AWS でいう CloudTrail 集約 + S3 Object Lock 相当）

直近のログは各プロジェクトの Logs Explorer でも追えます（`_Required` は400日、`_Default` は既定30日）。
そのため集約の本質的な価値は **「横断性」と「長期保管」** にあります。

そして、この2つの目的に対して Cloud Logging バケットと Cloud Storage は得意・不得意がきれいに分かれます。

## Cloud Logging バケットと Cloud Storage の比較

| 観点 | Cloud Logging バケット | Cloud Storage バケット |
| --- | --- | --- |
| 横断・リアルタイム調査 | ◎ Logs Explorer / Log Analytics(SQL) で即時 | △ JSON ファイルが蓄積。BigQuery 経由のバッチ調査 |
| 最大保持期間 | 3650日（10年）が上限。永続は不可 | ◎ 無制限（永続可） |
| ストレージ階層（Tier） | ✕ なし。一律 約 $0.01/GiB/月 | ◎ Standard 〜 Archive ＋ Autoclass |
| 改ざん耐性 | △ バケットロックで削除・期間短縮を禁止 | ◎ Bucket Lock = 真の WORM（S3 Object Lock 相当） |
| 取り込み課金 | $0.50/GiB（集約先で再課金される） | routing は無料。GCS ストレージ料金のみ |

ポイントを絞ると、次のように整理できます。

### 検索・調査のしやすさ

Cloud Logging バケットの最大の強みは、**Logs Explorer と Log Analytics（SQL）でそのまま即時に調べられる**ことです。
「いつ・誰が・何をしたか」をリアルタイムに、横断的に追えます。

一方、Cloud Storage に流したログは **日付別の JSON ファイルとして蓄積される**だけです。
Logs Explorer は使えないため、調査するには BigQuery 外部テーブル等でクエリすることになります。調査は可能ですが、準リアルタイムでひと手間かかります。

> 「GCS に入れたままでは調査できないの？」という疑問が湧きますが、**調査自体は可能。ただし手間がかかる**、が正確な答えです。

### 保持期間と改ざん耐性

長期保管・改ざん耐性の観点では Cloud Storage が圧倒的に有利です。

- **保持期間**: Logging バケットは10年が上限で永続保持はできません。GCS は無制限で、削除ライフサイクルを置かなければ永続保持になります。
- **改ざん耐性**: GCS の Bucket Lock は **真の WORM（Write Once Read Many）**です。リテンションをロックすれば、管理者でも削除・期間短縮ができません。AWS S3 の Object Lock（COMPLIANCE モード）に相当します。

### ストレージ階層とコスト

GCS は Standard 〜 Archive までの階層があり、古いログを安い階層へ自動移行できます。
Archive 階層の単価は Standard の約1/10で、監査ログのように「保管はするが普段は読まない」データに非常に向いています。
しかも GCS Archive は **取り出しが即時**（AWS の Glacier Deep Archive と違い復元待ちがない）ので、いざ監査が必要になったときもすぐ参照できます。

Logging バケットには階層がなく、一律課金です。さらに集約先で取り込み課金（$0.50/GiB）が再度かかる点にも注意が必要です。

## 結局どちらを選ぶか

用途別に整理すると、判断はシンプルです。

| やりたいこと | 推奨 |
| --- | --- |
| リアルタイムに横断検索・調査したい | **Cloud Logging バケット**（Log Analytics） |
| 5年以上〜永続、改ざん耐性、安価な階層で保管したい | **Cloud Storage + BigQuery 外部テーブル** |
| 両方やりたい | **GCS を主軸に、Logging バケットを併設** |

監査ログの長期保管という主目的に対しては、**Cloud Storage + BigQuery 外部テーブル**が本命になります。
これは AWS の「S3 + Athena」とほぼ同じ構図で、

- 5年 WORM（Bucket Lock）
- 永続保持（削除ライフサイクルを置かない）
- 階層移行（30日後に Archive へ）
- 必要時に BigQuery でクエリ

という形で、AWS の CloudTrail 集約構成にもきれいに揃えられます。

リアルタイムの横断検索が欲しい場合に限り、Cloud Logging バケットを **併設**して Log Analytics で即時調査できるようにする、という上積みを検討するのが良いでしょう。

## コストの効きどころ

この構成でほぼ唯一の変動費は **BigQuery のクエリ**です。
Archive 階層を外部テーブルで検索すると、スキャン料に加えて取り出し料がかかります。

- 低頻度の監査が中心なら、GCS + BigQuery で十分安い（保管費は Archive が激安なため、対象サービスを増やしてもほぼ増えない）
- 頻繁に横断検索したいなら、Logging バケット（Log Analytics）の方が **取り出し料が不要**で安く・速い

つまり「保管はとにかく安く済むが、頻繁に検索するなら Logging バケットの併設が効く」という構造です。

## まとめ

- Cloud Logging バケットと Cloud Storage は名前が似ているが、得意分野は別物
- **即時・横断の調査** → Cloud Logging バケット（Log Analytics）
- **長期・改ざん耐性・安価な保管** → Cloud Storage（Bucket Lock + Archive）+ BigQuery
- 監査ログの集約・長期保管が主目的なら **GCS + BigQuery が本命**、リアルタイム検索が必要なら Logging バケットを併設
- 変動費は実質 BigQuery クエリのみ。保管費は Archive 階層で無視できる水準

「どちらを使うべきか」で迷ったときの判断材料になれば幸いです。

## 参考

- [Pricing | Google Cloud Observability](https://cloud.google.com/stackdriver/pricing)
- [Storage pricing | Google Cloud](https://cloud.google.com/storage/pricing)
- [Configure log buckets | Cloud Logging](https://docs.cloud.google.com/logging/docs/buckets)
- [Use and lock retention policies | Cloud Storage](https://docs.cloud.google.com/storage/docs/using-bucket-lock)
- [Bucket Lock | Cloud Storage](https://docs.cloud.google.com/storage/docs/bucket-lock)
