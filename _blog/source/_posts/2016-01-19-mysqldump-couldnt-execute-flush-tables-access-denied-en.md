---
layout: post
title: "MySQL Troubleshooting - mysqldump: Couldn't execute 'FLUSH TABLES': Access denied; you need (at least one of) the RELOAD privilege(s) for this operation (1227)"
date: 2016-01-19
category: Database
lang: en
translation_id: mysqldump-couldnt-execute-flush-tables-access-denied
permalink: en/2016/01/19/mysqldump-couldnt-execute-flush-tables-access-denied/
cover: /img/cover/2016-01-19-mysqldump-couldnt-execute-flush-tables-access-denied.svg
tags:
- MySQL
---

## Overview

When running the mysqldump command as shown below, I hit the error mentioned in the title.

```sh
$ mysqldump --lock-all-tables --events -h <host_name> -u <user> -p<password> --no-create-info <db_name> <table, ...> > output.sql

mysqldump: Couldn't execute 'FLUSH TABLES': Access denied; you need (at least one of) the RELOAD privilege(s) for this operation (1227)
```

## Solution

As the error message indicates, grant the RELOAD privilege.

```sh
mysql> GRANT RELOAD ON *.* TO '<user>'@'<host_name>';
mysql> FLUSH PRIVILEGES;
```

That's all.
