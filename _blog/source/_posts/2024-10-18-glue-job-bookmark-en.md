---
title: Exporting DB Data Using sampleQuery Instead of the Glue Job Bookmark Feature
category: AWS
date: 2024-10-18
lang: en
translation_id: glue-job-bookmark
permalink: en/2024/10/18/glue-job-bookmark/
cover: /img/cover/2024-10-18-glue-job-bookmark.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## Overview

I ran into a problem while using the Glue Job Bookmark feature to fetch DB data with a Glue Job, so I'm leaving a note here on how I dealt with it.

## What Is the Glue Job Bookmark Feature?

When you ingest DB or log data with a Glue Job, there is a [Bookmark feature](https://docs.aws.amazon.com/ja_jp/glue/latest/dg/monitor-continuations.html) that keeps track of how far the data has been ingested.

Rather than dumping all of the DB data every time, you can extract only the differences (Incremental Export), which reduces the amount of data ingested and shortens the Glue Job's execution time.

Since Glue Jobs are billed based on execution time, this also has the benefit of keeping costs down.

<!-- more -->

## Problems with the Glue Job Bookmark

The Glue Job Bookmark is updated when `job.commit()` is called.

If an error occurs on some of the tables during ingestion and processing is interrupted, the data for the tables whose export succeeded is updated, but the Bookmark is not updated, resulting in an inconsistency.

### Example: A Case Where Inconsistency Occurs

- table1 succeeds → its data is updated
- table2 succeeds → its data is updated
- table3 fails → its data is not updated
  → The Bookmark is not updated.

Wrapping all of the processing in a transaction is one way to address this, but when the execution cost is high, it is preferable to have whatever could be ingested updated as ingested, since that lowers the cost of re-running.

## How I Addressed the Problem

When extracting via `create_data_frame.from_catalog` of the `glue context`, I implemented a homemade Bookmark feature that extracts the increment using `additional_options['sampleQuery']`.

```python
   if is_table_exists:
      # テーブルが既に存在する場合

      # Glue Data Catalog テーブルの bookmark key に設定したカラムの最大値取得
      df = self.glueContext.create_data_frame.from_catalog(database=dest_database, table_name=dest_table)
      max_value = df.agg({bookmark_key: "max"}).collect()[0][0]

      # sampleQuery を利用し増分のみ取得
      datasource = self.glueContext.create_dynamic_frame.from_catalog(
         ...
         additional_options={
               'sampleQuery': f"SELECT * FROM {source_database}.{source_table} WHERE {bookmark_key} > {max_value} AND",
               ...
         }
      )
```

With this, I was able to perform incremental extraction without relying on the Bookmark feature.

By the way, the reason there is an `AND` at the end of the query is that `enablePartitioningForSampleQuery: true` is set in order to read from the JDBC table in parallel.

## Summary

- sampleQuery feels easier to use for incremental export than the Bookmark feature
  - It also has the benefit of allowing ingestion while keeping the DB load down
- The Glue Job Bookmark has no update API and is only updated when the Glue Job execution succeeds, so when it fails, there seems to be no choice but to treat everything as a failure
  - This makes it hard to handle

That's all.
I hope this is helpful.
