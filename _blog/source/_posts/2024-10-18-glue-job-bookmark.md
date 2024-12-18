---
title: Glue Job Bookmark 機能でなく sampleQuery を使って DB データをエクスポートしてみた
category: AWS
date: 2024-10-18
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## 概要

Glue Job で DB データを取得していた際に Glue Job Bookmark を利用していた際に問題があったので、その際の対応を備忘録として残しておきます。

## Glue Job Bookmark 機能とは？

Glue Job で DB やログ情報を取り込みしている場合、どこまで取り込んだかを記録する [Bookmark 機能](https://docs.aws.amazon.com/ja_jp/glue/latest/dg/monitor-continuations.html) があります。

DB データを毎回全てダンプするよりも差分のみ抽出（増分エクスポート: Incremental Export）でき、データの取り込み量も抑えられ、Glue Job の実行時間が短縮されます。

Glue Job は実行時間に対して従量課金されるのでコストも抑制できるメリットがあります。

<!-- more -->

## Glue Job Bookmark の問題点

Glue Job の Bookmark は `job.commit()` された際に更新されます。

取り込み処理中に一部のテーブルでエラーが発生し処理が中断された場合、エクスポート処理が成功したテーブルはデータ自体は更新されますが、Bookmark は更新されず、不整合が発生します。

### 例: 不整合が起こる例

- table1 処理成功 → データ自体は更新される
- table2 処理成功 → データ自体は更新される
- table3 処理失敗 → データ自体は更新されない
  → Bookmark は更新されない。

全ての処理で transaction を貼ることが対策ではありますが、実行コストが高い場合に、取り込めた分は取り込めた分だけ更新してもらった方が再実行コストが低くて良いです。

## 問題点への対応策

`glue context` の `create_data_frame.from_catalog` を利用して抽出する際は　`additional_options['sampleQuery']` を利用し、増分を抽出する、自前 Bookmark 機能で対応しました。

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

これにより Bookmark 機能を利用せずとも差分抽出をできるように対策しました。

ちなみにクエリの最後に `AND` があるのは、`enablePartitioningForSampleQuery: true` にし、JDBC テーブルから並列で読み込む設定をしている為です。

## まとめ

- sampleQuery の方が Bookmark 機能より増分エクスポートはしやすい印象
  - DB 負荷を抑えながら取り込むこともできるメリットもある
- Glue Job Bookmark は更新 API 等はなく、Glue Job の実行成功でのみ更新されるので、失敗した場合は全てを失敗と見なすしかなさそう
  - ハンドリングしづらい

以上
参考になれば何よりです。
