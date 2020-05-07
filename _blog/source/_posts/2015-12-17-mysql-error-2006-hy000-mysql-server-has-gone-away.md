---
layout: post
title: "MySQLトラブルシューティング - ERROR 2006 (HY000) at line ***: MySQL server has gone away"
date: 2015-12-17
tags:
- MySQL
---

## 概要
DBインポート時に掲題のエラーが発生しました。

インポートサイズが大きすぎる為です。

インポートデータサイズのデフォルト値は `1M` です。

以下コマンドで確認できます。

```
mysql> show variables like 'max_allowed_packet';
```

## 対策

2点あります。
- mysqlコマンドラインから設定 (一時的)
- my.cnf に設定 (恒久的)


### mysqlコマンドラインから一時的に引き上げる

再起動の必要がなく影響範囲が少なく済みます。
但し、再起動後、デフォルト値に戻るので
恒久的な対応が必要な場合
my.cnf に設定しmysqldを再起動する必要があります。

例) 10MB に設定

```
mysql> set global max_allowed_packet = 1000000;
```

### my.cnf に `max_allowed_packet` を引き上げる様設定

##### my.cnf パス探索

```
# mysql --help | grep my.cnf
                      order of preference, my.cnf, $MYSQL_TCP_PORT,
/etc/my.cnf /etc/mysql/my.cnf /usr/etc/my.cnf ~/.my.cnf
```

以下の順で my.cnf を探しています。
`/etc/my.cnf` → `/etc/mysql/my.cnf` → `/usr/etc/my.cnf` → `~/.my.cnf`

個々の環境で異なるので本当に存在するかも含め設定ファイルを見定めてください。

おおよそ `/etc/my.cnf` が一般的かと思います。



##### my.cnf に [mysqld] に属する様に設定します。

10MBに設定してみます。

```
[mysqld]
max_allowed_packet=10MB
```

以上設定して再起動で設定反映完了です。


## 確認

設定が反映されているか確認します。

```
mysql> show variables like 'max_allowed_packet';

+--------------------+----------+
| Variable_name      | Value    |
+--------------------+----------+
| max_allowed_packet | 10485760 |
+--------------------+----------+
```



以上
