---
layout: post
title: MySQL vs postgreSQL コマンド対比
date: 2015-04-07
---

MySQL vs PostgreSQLコマンド対比表

|*項目|*MySQL|*PostgreSQL|
|DB接続|mysql -h hostname -u user -ppasswd |psql -h hostname -U user |
|DB一覧表示|SHOW DATABASES;|\l|
|DB変更|use db_name|psql db_name|
|DB作成|CREATE DATABASE db_name;|CREATE DATABASE db_name;|
|ユーザ一覧表示|SELECT * FROM mysql.user;|SELECT * FROM pg_shadow;|
|ユーザ追加|CREATE USER username IDENTIFIED BY [PASSWORD] 'password'|CREATE ROLE username WITH LOGIN PASSWORD 'password'|
|ユーザパスワード変更|SET PASSWORD FOR user = PASSWORD('password');|ALTER USER username password 'password'<br />ALTER USER username with encrypted password 'password';|
|全権限設定|GRANT ALL PRIVILEGES ON DATABASE database TO username;|GRANT ALL PRIVILEGES ON DATABASE database TO username;|
|TABLE一覧表示|SHOW TABLES|\d|
|FIELD一覧表示|SHOW CLOMNS FROM tbl_name<br/>SHOW COLOMNS FROM tbl_name FOM db_name|\d tbl_name|
|SQL実行| SELECT * FROM tbl_name;<br/>UPDATE tbl_name SET column='<value>';<br/>DELETE FROM tbl_name; |SELECT * FROM tbl_name;<br/>UPDATE tbl_name SET column='<value>';<br/>DELETE FROM tbl_name;|
|DB接続切断|exit;|\q|
