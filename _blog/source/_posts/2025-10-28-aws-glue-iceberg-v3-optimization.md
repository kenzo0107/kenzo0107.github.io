---
title: AWS Glue Iceberg テーブル v3 スペックの最適化
date: 2025-10-28
cover: https://i.imgur.com/QaRm1D7.png
---

AWS Glue Iceberg テーブルは 2025.10.28 時点で format-version=2 までサポートしていますが、format-version=3 はサポートしていません。

とはいえ、Iceberg format-version=3 としてデータを保存し利用はできます。

Athena でクエリ実行できない等の問題こそありますが、format-version=3 として利用はでき、[テーブル v3 スペックの恩恵](https://iceberg.apache.org/spec/?h=3+version+table+spe#version-3-extended-types-and-capabilities) を受けることができます。

AWS Glue テーブルを Iceberg v3 format で管理し、 Databricks 等の SaaS でデータを参照するような運用をしている場合には大きなパフォーマンスの向上が見込めます。

ですが、 AWS Glue テーブルの最適化機能は format-version=3 の場合、エラーとなります。

その為、Glue Job で Spark SQL 等でテーブル最適化を実施する必要があります。

以下実施例です。

<!-- more -->

## Glue Job Python スクリプト例

```python
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from datetime import datetime

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session

database = 'example'
table = 'dummy'

table_full = f'glue_catalog.`{database}`.`{table}`'

target_file_size_bytes = 268435456 # 256MB

# Rewrite Data Files（コンパクション）
spark.sql(f"""
    CALL glue_catalog.system.rewrite_data_files(
        table => '{table_full}',
        options => map('target-file-size-bytes','{target_file_size_bytes}')
    )
""")

# expire_snapshots（古いスナップショットを削除、最後の3つは保持）
older_than = datetime.now().isoformat()
spark.sql(f"""
    CALL glue_catalog.system.expire_snapshots(
        table => '{table_full}',
        older_than => timestamp'{older_than}',
        retain_last => {snapshot_retain}
    )
""")

# remove_orphan_files（不要ファイル削除）
spark.sql(f"CALL glue_catalog.system.remove_orphan_files(table => '{table_full}')")
```

Glue マネージメント最適化機能と同等の以下を Glue Job Python スクリプトで実施しています。

- Compaction
- Snapshot retention
- Orphan file deletion

## Glue Job 設定

Iceberg テーブル v3 スペックを利用するには iceberg-spark の 1.10.0 以上のバージョンである必要があります。

1. [iceberg-spark-runtime-3.5_2.12-1.10.0.jar](https://repo1.maven.org/maven2/org/apache/iceberg/iceberg-spark-3.5_2.12/1.10.0/iceberg-spark-3.5_2.12-1.10.0.jar) を S3 にアップロードします。
2. Job parameters に `--extra-jars` でアップロードされたファイルの S3 URI を指定
3. Job parameters の Spark Conf の設定に `--conf spark.jars.packages=org.apache.iceberg:iceberg-spark-runtime-3.5_2.12:1.10.0` を追加
    - Spark Conf の設定をスクリプト中に記載している場合はそちらに追加してください。
4. Job parameters `--user-jars-first` を `true` を追加

参考: [カスタム Iceberg バージョンの使用](https://docs.aws.amazon.com/ja_jp/prescriptive-guidance/latest/apache-iceberg-on-aws/iceberg-glue.html#glue-custom-integration)

以上で Glue Job で Iceberg テーブル v3 スペックが利用できます。

## 最適化されているかの確認

```python
# Rewrite Data Files（コンパクション）
df_rewrite_data_files = spark.sql(f"""
    CALL glue_catalog.system.rewrite_data_files(
        table => '{table_full}',
        options => map('target-file-size-bytes','{target_file_size_bytes}')
    )
""")
df_rewrite_data_files.show(truncate=False)

# expire_snapshots（古いスナップショットを削除、最後の3つは保持）
older_than = datetime.now().isoformat()
df_expire_snapshots = spark.sql(f"""
    CALL glue_catalog.system.expire_snapshots(
        table => '{table_full}',
        older_than => timestamp'{older_than}',
        retain_last => {snapshot_retain}
    )
""")
df_expire_snapshots.show(truncate=False)

# remove_orphan_files（不要ファイル削除）
df_remove_orphan_files = spark.sql(f"CALL glue_catalog.system.remove_orphan_files(table => '{table_full}')")
df_remove_orphan_files.show(truncate=False)
```

各最適化実行 Spark SQL の戻り値が DataFrame なので、その中身を表示することでどのファイルが削除されたかなどがわかります。

### metadata が保存されている S3 Object から確認してみる

S3 に保存されているテーブルのメタデータ (`<table>/metadata/*.metadata.json`) から確認できます。

Iceberg は内部で metadata ディレクトリに JSON ファイルを置きます。

```
metadata/
  00000-...-metadata.json
  00001-...-metadata.json
  00002-...-metadata.json
```

- Iceberg はテーブル操作（INSERT, DELETE, COMPACT など）毎に新しい metadata.json を作成する
- 番号が大きいほど最新

この metadata.json がテーブルのその時々の情報を記載しているのでそちらを参考にすることで最適化されているかがわかります。

### Compaction　（コンパクション） が実施されているかの確認

以下に metadata.json の例を記載しています。

<details>
<summary>metadata.json</summary>
```
...
  "snapshots": [
    {
      "sequence-number": 10,
      "snapshot-id": 3823535076387391090,
      "timestamp-ms": 1761614061870,
      "summary": {
        "operation": "append",
        "spark.app.id": "spark-application-1761613983390",
        "added-data-files": "20",
        "added-records": "208126",
        "added-files-size": "29693801",
        "changed-partition-count": "1",
        "total-records": "208126",
        "total-files-size": "29693801",
        "total-data-files": "20",
        "total-delete-files": "0",
        "total-position-deletes": "0",
        "total-equality-deletes": "0",
        "engine-version": "3.5.4-amzn-0",
        "app-id": "spark-application-1761613983390",
        "engine-name": "spark",
        "iceberg-version": "Apache Iceberg 1.10.0 (commit 2114bf631e49af532d66e2ce148ee49dd1dd1f1f)"
      },
      "manifest-list": "s3://bucket/example/table/metadata/snap-3823535076387391090-1-3fc712b9-127d-448c-85b4-34726177a6f6.avro",
      "schema-id": 0,
      "first-row-id": 1873029,
      "added-rows": 208126
    },
    {
      "sequence-number": 11,
      "snapshot-id": 4745314978435154844,
      "parent-snapshot-id": 3823535076387391090,
      "timestamp-ms": 1761614075392,
      "summary": {
        "operation": "replace",
        "added-data-files": "1",
        "deleted-data-files": "20",
        "added-records": "208126",
        "deleted-records": "208126",
        "added-files-size": "28252807",
        "removed-files-size": "29693801",
        "changed-partition-count": "1",
        "total-records": "208126",
        "total-files-size": "28252807",
        "total-data-files": "1",
        "total-delete-files": "0",
        "total-position-deletes": "0",
        "total-equality-deletes": "0",
        "engine-version": "3.5.4-amzn-0",
        "app-id": "spark-application-1761613983390",
        "engine-name": "spark",
        "iceberg-version": "Apache Iceberg 1.10.0 (commit 2114bf631e49af532d66e2ce148ee49dd1dd1f1f)"
      },
      "manifest-list": "s3://bucket/example/table/metadata/snap-4745314978435154844-1-58626d07-e3ea-4638-a263-cea54a49101f.avro",
      "schema-id": 0,
      "first-row-id": 2081155,
      "added-rows": 208126
    }
  ],
```
</details>

`sequence-number` が大きいほど最新です。

コンパクション後は `operation` が `replace` or `rewrite` となります。

- `total-data-files` が 20 → 1 となっておりファイル数が削減されている
- `total-files-size` が 29693801 → 28252807 となっており、ほぼ同じ
- `deleted-data-files` (削除したデータファイル) が 20
- `removed-files-size` (削除したファイルサイズ) が 29693801 で sequence-number=10 の管理ファイルサイズと同じ

以上から総ファイルサイズはほぼ変わらず、以前のデータがまるまる削除され、新たに 1 つのファイルを生成していることがわかります。
問題なくコンパクションできているようです。

※ Databricks では `DESCRIBE HISTORY` クエリがサポートされており、テーブルへの操作履歴を確認できるのでそちらから確認も可能です。

以上<br/>
参考になれば幸いです。
