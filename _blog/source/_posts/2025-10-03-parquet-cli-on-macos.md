---
title: parquet 解析ツール on macOS
date: 2025-10-03
lang: ja
translation_id: parquet-cli-on-macos
cover: /img/cover/2025-10-03-parquet-cli-on-macos.svg
category: Data Analytics
---

iceberg テーブルの圧縮形式は snappy や gzip 等が選択できますが、
zstd が圧縮・伸縮効率がよくコストパフォーマンスに優れています。

ですが、
圧縮形式 zstd の parquet は s3 select 未サポート (2024.10.05 時点) なので、
parquet を解析したい場合、macOS ローカルにダウンロードし、解析するなりが必要です。

現時点 2025.10.03 では、 Iceberg format-versoin=3 では、 Athena からクエリ実行することもできません。

[parquet-cli](https://formulae.brew.sh/formula/parquet-cli) を利用しデータの内容を確認する必要があったので備忘録として残します。

## parquet-cli 導入 & 簡易的な使い方

```console
brew install parquet-cli

// スキーマ情報確認
parquet schema xxx.parquet

// 全データ表示
parquet cat xxx.parquet

// 最初の数件を表示
parquet head -n 10 xxx.parquet
```
