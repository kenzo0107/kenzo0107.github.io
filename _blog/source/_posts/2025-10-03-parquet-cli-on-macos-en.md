---
title: Parquet Inspection Tools on macOS
date: 2025-10-03
lang: en
translation_id: parquet-cli-on-macos
permalink: en/2025/10/03/parquet-cli-on-macos/
cover: /img/cover/2025-10-03-parquet-cli-on-macos.svg
category: Data Analytics
---

For Iceberg table compression you can choose formats such as snappy or gzip,
but zstd offers excellent compression/decompression efficiency and is the most cost-effective.

However,
since Parquet compressed with zstd is not supported by S3 Select (as of 2024.10.05),
when you want to inspect such Parquet files you need to download them to your local macOS machine and analyze them there.

As of 2025.10.03, with Iceberg format-version=3 you also cannot run queries from Athena.

Since I needed to check the contents of the data using [parquet-cli](https://formulae.brew.sh/formula/parquet-cli), I'm leaving these notes for future reference.

## Installing parquet-cli & basic usage

```console
brew install parquet-cli

// Check schema information
parquet schema xxx.parquet

// Show all data
parquet cat xxx.parquet

// Show the first few records
parquet head -n 10 xxx.parquet
```
