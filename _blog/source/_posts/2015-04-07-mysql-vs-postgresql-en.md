---
layout: post
title: MySQL vs PostgreSQL Command Comparison
date: 2015-04-07
category: Database
lang: en
translation_id: mysql-vs-postgresql
permalink: en/2015/04/07/mysql-vs-postgresql/
cover: /img/cover/2015-04-07-mysql-vs-postgresql.svg
---

A comparison table of MySQL vs PostgreSQL commands

|*Item|*MySQL|*PostgreSQL|
|Connect to DB|mysql -h hostname -u user -ppasswd |psql -h hostname -U user |
|List databases|SHOW DATABASES;|\l|
|Switch database|use db_name|psql db_name|
|Create database|CREATE DATABASE db_name;|CREATE DATABASE db_name;|
|List users|SELECT * FROM mysql.user;|SELECT * FROM pg_shadow;|
|Add user|CREATE USER username IDENTIFIED BY [PASSWORD] 'password'|CREATE ROLE username WITH LOGIN PASSWORD 'password'|
|Change user password|SET PASSWORD FOR user = PASSWORD('password');|ALTER USER username password 'password'<br />ALTER USER username with encrypted password 'password';|
|Grant all privileges|GRANT ALL PRIVILEGES ON DATABASE database TO username;|GRANT ALL PRIVILEGES ON DATABASE database TO username;|
|List tables|SHOW TABLES|\d|
|List fields|SHOW CLOMNS FROM tbl_name<br/>SHOW COLOMNS FROM tbl_name FOM db_name|\d tbl_name|
|Run SQL| SELECT * FROM tbl_name;<br/>UPDATE tbl_name SET column='<value>';<br/>DELETE FROM tbl_name; |SELECT * FROM tbl_name;<br/>UPDATE tbl_name SET column='<value>';<br/>DELETE FROM tbl_name;|
|Disconnect from DB|exit;|\q|
