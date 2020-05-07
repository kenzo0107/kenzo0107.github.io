---
layout: post
title: MySQが落ちる トラブルシューティング Cannot allocate memory for the buffer pool
date: 2016-05-20
tags:
- MySQL
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160520/20160520103201.jpg
---

## 概要

AWS E2インスタンス上に MySQL, SonarQube インストールし起動するものの
MySQLが落ちるという事象が発生。

ログを見ると以下のエラーが。。

- /var/log/mysqld.log

```sh
InnoDB: mmap(137363456 bytes) failed; errno 12
[ERROR] InnoDB: Cannot allocate memory for the buffer pool
[ERROR] Plugin 'InnoDB' init function returned error.
[ERROR] Plugin 'InnoDB' registration as a STORAGE ENGINE
[ERROR] Unknown/unsupported storage engine: InnoDB
[ERROR] Aborting
```

```
Cannot allocate memory for the buffer pool

バッファープールへのメモリ割当ができない
```

割りあてるメモリがないという話。
なので、メモリを作ります。


## 対策1. swap領域を作成する

### swap領域作成

```sh
// 空ファイル作成
# dd if=/dev/zero of=/swapfile bs=1M count=1024

// 作成した空ファイルをswap領域に設定
# mkswap /swapfile

// スワップ領域を有効化
# swapon /swapfile
```

### swap領域確認

```sh
# free

              total        used        free      shared  buff/cache   available
Mem:        1015472      833592       66456        1456      115424       54708
Swap:       1048572      491136      557436   ← Swapの設定が追加されていることを確認
```

### mysql 再起動

```sh
# systemctl restart mysqld
```



## 対策2. innodb_buffer_pool_size の割当を増やす

### 現在設定されている innodb_buffer_pool_size 確認

```sh
$ mysql -u <user> -p<pass> <db>  -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size'"

+-------------------------+-----------+
| Variable_name           | Value     |
+-------------------------+-----------+
| innodb_buffer_pool_size | 118835956 |
+-------------------------+-----------+
```

エラーログにあった 137363456 を下回ってるのがわかります。
この割当メモリを増やします。

### my.cnfの場所探し

左から順に検索し該当するファイルがあればそのmy.cnfを参照します。
/etc/my.cnf → /etc/mysql/my.cnf → /usr/etc/my.cnf → ~/.my.cnf

```sh
# mysql --help | grep my.cnf
                      order of preference, my.cnf, $MYSQL_TCP_PORT,
/etc/my.cnf /etc/mysql/my.cnf /usr/etc/my.cnf ~/.my.cnf
```

### メモリ追加

自分の方では
my.cnf上に innodb_buffer_pool_size の設定項目がなかったので
追加しました。

- my.cnf

```sh
[mysqld]
...
...

# 以下追加
innodb_buffer_pool_size = 256M

[mysqld_safe]
...
...
```

### mysql 再起動

```sh
# systemctl restart mysqld
```

### 増えているか確認

```sh
$ mysql -u <user> -p<pass> <db>  -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size'"

+-------------------------+-----------+
| Variable_name           | Value     |
+-------------------------+-----------+
| innodb_buffer_pool_size | 268435456 |
+-------------------------+-----------+
```


今回発生していたエラーログが消えました。
