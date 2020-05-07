---
layout: post
title: "MySQLトラブルシューティング - ERROR 1045 (28000): Access denied for user 'root'@'localhost' (using password: NO)"
date: 2016-01-15
tags:
- MySQL
---

## 概要

ローカルでMacOSXでMAMPを使っていてある日誤った操作により以下のようなエラーが発生した為
対応まとめました。

```
$ mysql -u root
ERROR 1045 (28000): Access denied for user 'root'@'localhost' (using password: NO)
```

ローカル環境でrootユーザのアクセス権を誤って削除してしまったときなどに発生します。

## 対策

```
// mysql停止
$ service mysqld stop

// rootユーザのアクセス権限が失われている
// → テーブル権限をスキップ(無視)して作業するオプション付きでセーフモードでmysql起動
$ mysqld_safe --skip-grant-tables &

// rootユーザでアクセス
$ mysql -u root

// 現状の権限設定テーブルを空にする
mysql> TRUNCATE TABLE mysql.user;
Query OK, 0 rows affected (0.00 sec)

// 権限反映
mysql> FLUSH PRIVILEGES;
Query OK, 0 rows affected (0.01 sec)

// rootユーザにlocalhostの全DBアクセス権限付与
mysql> GRANT ALL PRIVILEGES on *.* to root@localhost IDENTIFIED BY '(root's password)' WITH GRANT OPTION;
Query OK, 0 rows affected (0.01 sec)

// 権限反映
mysql> flush privileges;
Query OK, 0 rows affected (0.00 sec)

// 権限設定確認
mysql> SELECT host, user FROM mysql.user;

// mysql CLIモード停止 (Ctl+c)でもOK
mysql> quit;

// safe modeで起動させたmysql 関連psをkillする
$ ps aux | grep mysql | grep -v grep | awk '{print "kill -9", $2}'|sh

// mysql 起動
$ service mysqld start

// rootユーザでmysqlアクセス
$ mysql -u root -p(root's password)
mysql>

```

rootユーザに権限が失われお手上げ状態になったとき、困ったときに `safe_mode` 使えます。

以上
