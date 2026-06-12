---
layout: post
title: MySQL Command Cheat Sheet
date: 2015-08-05
lang: en
translation_id: mysql-command-list
permalink: en/2015/08/05/mysql-command-list/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160119/20160119111638.png
---

#### Dump while excluding unneeded tables with "--ignore-table=(table name)"

```sh
mysqldump -u <user> -p<password> dbname --ignore-table=dbname.table > dump.sql
```

#### Get the DDL (Data Definition Language)

```sh
mysqldump -u <user> -p<password> --no-data dbname > ddl.sql
```

#### Get the data (INSERT queries)

```sh
mysqldump -u <user> -p<password> --no-create-info dbname > data.sql
```

#### Import into a DB

```sh
mysql -u <user> -p<password> dbname < data.sql
```

By the way, if you get an error like the following during import,

```
ERROR 2006 (HY000) at line ***: MySQL server has gone away
```

refer to the article below.
[http://kenzo0107.hatenablog.com/entries/2015/12/17]

#### Dump CSV without DDL

[f:id:kenzo0107:20160119111938p:plain]

```sh
mkdir ./csv
chmod o+x ./csv
mysqldump -u <user> -p<password> --tab=./csv --fields-terminated-by=, --fields-optionally-enclosed-by=\" --lines-terminated-by="\r\n" dbname
```

#### Export the result of a SELECT statement as CSV data

- With SELECT ~ INTO OUTFILE output.csv, the file /tmp/hoge.csv is written on the DB server.
  Be careful when the server running the command differs from the DB server.

```mysql
use dbname
SELECT * INTO OUTFILE'/tmp/hoge.csv' FIELDS TERMINATED BY ';' OPTIONALLY ENCLOSED BY '"' ESCAPED BY '' LINES STARTING BY '' TERMINATED BY '\r\n' FROM table;
```

- Load a SQL file from the command line and save the execution result as CSV

```sh
mysql -h <host> -u <user> -p<password> <db_name> -e "`cat query.sql`" | sed -e 's/\t/,/g' >/tmp/result.csv
```

#### Generate a CSV file without using INPUT OUTFILE

https://kenzo0107.github.io/2015/12/16/2015-12-17-mysql-error-2006-hy000-mysql-server-has-gone-away/

#### Export with specified tables

```sh
mysqldump -u <user> -p<password> -t dbname table1 tabl2 > no_data.sql
```

#### Export with specified tables and a WHERE clause

```sh
mysqldump -u <user> -p<password> -t dbname table1 "-w created_at < '2016-10-27' " > no_data.sql
```

#### output by CSV format

```sh
mysql -u user -ppassword
> use dbname
> LOAD DATA INFILE "<CSVFile>" INTO TABLE table FIELDS TERMINATED BY ',' ENCLOSED BY '"';
```

#### TRUNCATE all tables

```sh
mysql -u root dbname -N -e 'show tables' | while read table; do mysql -u root -e "truncate table $table" dbname; done
```

#### Check the AUTO_INCREMENT value

```
SELECT auto_increment FROM information_schema.tables WHERE table_name = '<table>';
```

#### Set the AUTO_INCREMENT value

```mysql
ALTER TABLE <table> auto_increment=<int val>;
```

#### Rename a table

```mysql
ALTER TABLE <old table> rename <new table>;
```

#### Add a column to a table

```mysql
ALTER TABLE <table> ADD <column> TINYINT(3) NOT NULL DEFAULT <deafult value> COMMENT '<comment>' AFTER <previous column>;
```

- Example) Add a column named mailmagazine_status after the email column of the user table,
  as tinyint(3) unsigned with a default of 0

```mysql
ALTER TABLE user ADD mailmagazine_status TINYINT(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'メルマガステータス' AFTER email;
```

#### Drop a column from a table

```mysql
ALTER TABLE <table> DROP COLUMN <column>;
```

#### Modify a column of a table

```mysql
ALTER TABLE <table> CHANGE <old column> <new column> <column 定義>;
```

- Example) In the product table, rename the column "no" to "id", and change it to unsigned, NOT NULL, default 0, and column comment "商品ID"

```mysql
ALTER TABLE product CHANGE `no` `id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '商品ID';
```

#### List indexes

```
SHOW INDEXES FROM <table>;
```

#### Add an index

```
ALTER TABLE <table> ADD INDEX <index name>(<column>);

ALTER TABLE <table> ADD INDEX <index name>(<column1>,<column2>);
```

#### Drop an index

```
ALTER TABLE <table> DROP INDEX <index name>;
```

#### Add a unique constraint

```
ALTER TABLE <table> ADD UNIQUE(<column>);
```

#### Drop a unique constraint

#### Check the DB character set

```mysql
SHOW CREATE DATABASE dbname
```

#### Run a gzip-compressed file against a specific DB schema

```sh
zcat dump.sql.gz | mysql -u <user> -p<password> dbname
```

#### List statistics for all tables, ordered by size

```mysql
SELECT table_name, engine, table_rows AS tbl_rows, avg_row_length AS rlen, floor((data_length + index_length) / 1024 / 1024) AS allMB, floor((data_length) / 1024 / 1024) AS dMB, floor((index_length) / 1024 / 1024) AS iMB FROM information_schema.tables WHERE table_schema = database() ORDER BY (data_length + index_length) DESC;
```

#### Check a table's character set and so on

```mysql
SELECT * FROM information_schema.schemata WHERE schema_name = 'database_name';

+--------------+---------------+----------------------------+------------------------+----------+
| CATALOG_NAME | SCHEMA_NAME   | DEFAULT_CHARACTER_SET_NAME | DEFAULT_COLLATION_NAME | SQL_PATH |
+--------------+---------------+----------------------------+------------------------+----------+
| def          | database_name | utf8                       | utf8_general_ci        | NULL     |
+--------------+---------------+----------------------------+------------------------+----------+
```

## Creating a DB/Table

#### Create a DB (CHARACTER=utf8)

```mysql
CREATE DATABASE `database_name` CHARACTER SET utf8;
```

#### Set a user, password, and privileges for a specific DB/host

You need to set the following:

- database_name
- user_name
- host_name
- password

```mysql
GRANT ALL PRIVILEGES ON `database_name`.* TO `user_name`@'host_name' IDENTIFIED BY 'password' WITH GRANT OPTION;
```

#### Grant a specific user permission to view the MySQL slow query log

```mysql
GRANT select ON mysql.slow_log TO user_name;
```

#### Grant a specific user permission to view the MySQL slow query log on RDS (AWS)

```mysql
GRANT EXECUTE ON PROCEDURE mysql.rds_rotate_slow_log TO user_name;
```

#### Show a specific user's privileges

```mysql
SHOW GRANTS for 'user_name'@'%';
```

#### Apply the settings

After setting the privileges above, apply the settings.

```mysql
FLUSH PRIVILEGES;
```

When granting privileges via GRANT, `FLUSH PRIVILEGES` is not strictly required, but it's good to run it just in case.
When you grant privileges via INSERT, UPDATE, DELETE, and so on, `FLUSH PRIVILEGES` is required.

#### Check the size of each table

[http://kenzo0107.hatenablog.com/entry/2016/06/27/121920:embed:cite]

#### Exactly one year ago

```mysql
SELECT NOW() - INTERVAL 1 YEAR;
```

#### As if it were yesterday

```mysql
SELECT NOW() - INTERVAL 1 DAY;
```

#### 00:00:00 one day ago

```mysql
SELECT CURDATE() - INTERVAL 1 DAY;
```

#### 11:00:00 one day ago

```mysql
SELECT DATE_FORMAT(CURDATE() - INTERVAL 1 DAY, '%Y-%m-%d 11:00:00');
```

#### Check the MySQL version

```sh
mysql -u <user> -p<pass> -e"SELECT version();"

+------------+
| version()  |
+------------+
| 5.5.42-log |
+------------+
```

## Various Metrics

#### Get the execution counts of SELECT / INSERT / UPDATE / DELETE / REPLACE commands

```sh
mysql -u root -NBe "SHOW GLOBAL STATUS" | grep "Com_"  | grep -E "select|insert|update|delete|replace"
```

[f:id:kenzo0107:20160927140251p:plain]

| _Item_             | _Explain_                                  |
| ------------------ | ------------------------------------------ |
| Com_delete         | Number of delete (DELETE) executions       |
| Com_delete_multi   | Number of multi-row (DELETE) executions    |
| Com_insert         | Number of insert (INSERT) executions       |
| Com_insert_select  | Number of copy (INSERT SELECT) executions  |
| Com_replace        | Number of replace (REPLACE) executions     |
| Com_replace_select | Number of replace (REPLACE SELECT) executions |
| Com_select         | Number of select (SELECT) executions       |
| Com_update         | Number of update (UPDATE) executions       |
| Com_update_multi   | Number of multi-row update (UPDATE) executions |

#### Get the number of active connections

```sh
mysql -u root -BNe "SHOW STATUS LIKE 'Threads_connected';"
```
