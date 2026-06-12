---
title: Optimizing AWS Glue Iceberg Table v3 Spec
date: 2025-10-28
lang: en
translation_id: aws-glue-iceberg-v3-optimization
permalink: en/2025/10/28/aws-glue-iceberg-v3-optimization/
cover: https://i.imgur.com/QaRm1D7.png
---

As of 2025.10.28, AWS Glue Iceberg tables support up to format-version=2, but do not support format-version=3.

That said, you can still store and use data as Iceberg format-version=3.

While there are issues such as not being able to run queries from Athena, you can use it as format-version=3 and benefit from the [table v3 spec](https://iceberg.apache.org/spec/?h=3+version+table+spe#version-3-extended-types-and-capabilities).

If you manage AWS Glue tables in Iceberg v3 format and reference the data from SaaS offerings such as Databricks, you can expect a significant performance improvement.

However, the AWS Glue table optimization feature errors out when format-version=3.

Therefore, you need to perform table optimization using Spark SQL or similar in a Glue Job.

Here is an example.

<!-- more -->

## Example Glue Job Python Script

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

# Rewrite Data Files (compaction)
spark.sql(f"""
    CALL glue_catalog.system.rewrite_data_files(
        table => '{table_full}',
        options => map('target-file-size-bytes','{target_file_size_bytes}')
    )
""")

# expire_snapshots (delete old snapshots, keep the last 3)
older_than = datetime.now().isoformat()
spark.sql(f"""
    CALL glue_catalog.system.expire_snapshots(
        table => '{table_full}',
        older_than => timestamp'{older_than}',
        retain_last => {snapshot_retain}
    )
""")

# remove_orphan_files (delete unnecessary files)
spark.sql(f"CALL glue_catalog.system.remove_orphan_files(table => '{table_full}')")
```

The Glue Job Python script performs the following, which are equivalent to the Glue managed optimization feature.

- Compaction
- Snapshot retention
- Orphan file deletion

## Glue Job Configuration

To use the Iceberg table v3 spec, you need iceberg-spark version 1.10.0 or higher.

1. Upload [iceberg-spark-runtime-3.5_2.12-1.10.0.jar](https://repo1.maven.org/maven2/org/apache/iceberg/iceberg-spark-3.5_2.12/1.10.0/iceberg-spark-3.5_2.12-1.10.0.jar) to S3.
2. Specify the S3 URI of the uploaded file with `--extra-jars` in the Job parameters.
3. Add `--conf spark.jars.packages=org.apache.iceberg:iceberg-spark-runtime-3.5_2.12:1.10.0` to the Spark Conf setting in the Job parameters.
    - If you specify the Spark Conf settings within your script, add it there instead.
4. Add `--user-jars-first` set to `true` in the Job parameters.

Reference: [Using a custom Iceberg version](https://docs.aws.amazon.com/ja_jp/prescriptive-guidance/latest/apache-iceberg-on-aws/iceberg-glue.html#glue-custom-integration)

With this, you can use the Iceberg table v3 spec in a Glue Job.

## Verifying That Optimization Was Performed

```python
# Rewrite Data Files (compaction)
df_rewrite_data_files = spark.sql(f"""
    CALL glue_catalog.system.rewrite_data_files(
        table => '{table_full}',
        options => map('target-file-size-bytes','{target_file_size_bytes}')
    )
""")
df_rewrite_data_files.show(truncate=False)

# expire_snapshots (delete old snapshots, keep the last 3)
older_than = datetime.now().isoformat()
df_expire_snapshots = spark.sql(f"""
    CALL glue_catalog.system.expire_snapshots(
        table => '{table_full}',
        older_than => timestamp'{older_than}',
        retain_last => {snapshot_retain}
    )
""")
df_expire_snapshots.show(truncate=False)

# remove_orphan_files (delete unnecessary files)
df_remove_orphan_files = spark.sql(f"CALL glue_catalog.system.remove_orphan_files(table => '{table_full}')")
df_remove_orphan_files.show(truncate=False)
```

Since the return value of each optimization Spark SQL call is a DataFrame, displaying its contents shows which files were deleted, and so on.

### Checking from the S3 Objects Where Metadata Is Stored

You can check from the table metadata stored in S3 (`<table>/metadata/*.metadata.json`).

Iceberg internally places JSON files in the metadata directory.

```
metadata/
  00000-...-metadata.json
  00001-...-metadata.json
  00002-...-metadata.json
```

- Iceberg creates a new metadata.json on each table operation (INSERT, DELETE, COMPACT, etc.)
- The higher the number, the more recent

Since this metadata.json records the table's state at each point in time, you can refer to it to verify whether optimization was performed.

### Verifying Whether Compaction Was Performed

Below is an example of a metadata.json.

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

The higher the `sequence-number`, the more recent.

After compaction, the `operation` becomes `replace` or `rewrite`.

- `total-data-files` went from 20 → 1, so the number of files has been reduced
- `total-files-size` went from 29693801 → 28252807, which is nearly the same
- `deleted-data-files` (deleted data files) is 20
- `removed-files-size` (size of deleted files) is 29693801, the same as the size of the managed files at sequence-number=10

From the above, you can see that the total file size is virtually unchanged, the previous data was entirely deleted, and a single new file was generated.
The compaction appears to have been performed without issues.

* Databricks supports the `DESCRIBE HISTORY` query, which lets you check the operation history of a table, so you can verify it from there as well.

That's all.<br/>
I hope you find this helpful.
