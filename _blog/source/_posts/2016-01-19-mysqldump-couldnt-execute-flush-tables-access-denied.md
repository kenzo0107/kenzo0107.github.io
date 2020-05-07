---
layout: post
title: "MySQLトラブルシューティング - mysqldump: Couldn't execute 'FLUSH TABLES': Access denied; you need (at least one of) the RELOAD privilege(s) for this operation (1227)"
date: 2016-01-19
tags:
- MySQL
---

## 概要

以下のように mysqldump コマンド実行時に掲題のエラーが発生しました。

```sh
$ mysqldump --lock-all-tables --events -h <host_name> -u <user> -p<password> --no-create-info <db_name> <table, ...> > output.sql

mysqldump: Couldn't execute 'FLUSH TABLES': Access denied; you need (at least one of) the RELOAD privilege(s) for this operation (1227)
```

## 対策

エラー文の通り、RELOAD権限を付与する。

```sh
mysql> GRANT RELOAD ON *.* TO '<user>'@'<host_name>';
mysql> FLUSH PRIVILEGES;
```

以上
