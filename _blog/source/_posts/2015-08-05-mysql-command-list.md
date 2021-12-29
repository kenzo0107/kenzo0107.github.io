---
layout: post
title: MySQL コマンドまとめ
date: 2015-08-05
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160119/20160119111638.png
---

#### Dump 不要なテーブルは「--ignore-table=(テーブル名)」で排除

```sh
mysqldump -u <user> -p<password> dbname --ignore-table=dbname.table > dump.sql
```

#### DDL(Data Definition Language)取得

```sh
mysqldump -u <user> -p<password> --no-data dbname > ddl.sql
```

#### データ（INSERTクエリ）取得

```sh
mysqldump -u <user> -p<password> --no-create-info dbname > data.sql
```

#### DBインポート

```sh
mysql -u <user> -p<password> dbname < data.sql
```

ちなみにインポート時に以下のようなエラーが出た場合は、
```
ERROR 2006 (HY000) at line ***: MySQL server has gone away
```

以下記事参照してください。
[http://kenzo0107.hatenablog.com/entries/2015/12/17]





#### DDLなし + CSV はきだし
[f:id:kenzo0107:20160119111938p:plain]

```sh
mkdir ./csv
chmod o+x ./csv
mysqldump -u <user> -p<password> --tab=./csv --fields-terminated-by=, --fields-optionally-enclosed-by=\" --lines-terminated-by="\r\n" dbname
```

#### SELECT文からCSVデータで出力

- SELECT ~ INTO OUTFILE output.csv の場合、DBサーバに /tmp/hoge.csvは出力される。
コマンド実行するサーバとDBサーバが異なる場合は注意が必要です。

```mysql
use dbname
SELECT * INTO OUTFILE'/tmp/hoge.csv' FIELDS TERMINATED BY ';' OPTIONALLY ENCLOSED BY '"' ESCAPED BY '' LINES STARTING BY '' TERMINATED BY '\r\n' FROM table;
```

- コマンドラインSQLファイルをロードし実行結果をCSVに保存

```sh
mysql -h <host> -u <user> -p<password> <db_name> -e "`cat query.sql`" | sed -e 's/\t/,/g' >/tmp/result.csv
```

#### INPUT OUTFILEを利用せずにCSVファイル生成

https://kenzo0107.github.io/2015/12/16/2015-12-17-mysql-error-2006-hy000-mysql-server-has-gone-away/






#### テーブル指定し出力

```sh
mysqldump -u <user> -p<password> -t dbname table1 tabl2 > no_data.sql
```

#### テーブル指定しWHERE句ありで出力

```sh
mysqldump -u <user> -p<password> -t dbname table1 "-w created_at < '2016-10-27' " > no_data.sql
```

#### output by CSV format

```sh
mysql -u user -ppassword
> use dbname
> LOAD DATA INFILE "<CSVFile>" INTO TABLE table FIELDS TERMINATED BY ',' ENCLOSED BY '"';
```

#### 全テーブルTRUNCATE

```sh
mysql -u root dbname -N -e 'show tables' | while read table; do mysql -u root -e "truncate table $table" dbname; done
```

#### AUTO_INCREMENT値確認

```
SELECT auto_increment FROM information_schema.tables WHERE table_name = '<table>';
```

#### AUTO_INCREMENT値設定

```mysql
ALTER TABLE <table> auto_increment=<int val>;
```

#### テーブル名変更

```mysql
ALTER TABLE <old table> rename <new table>;
```

#### テーブルにカラム追加

```mysql
ALTER TABLE <table> ADD <column> TINYINT(3) NOT NULL DEFAULT <deafult value> COMMENT '<comment>' AFTER <previous column>;
```

- 例) テーブル user の email カラムの次にカラム名: mailmagazine_status を
tinyint(3) 符号なし(unsigned)、デフォルト0 の追加

```mysql
ALTER TABLE user ADD mailmagazine_status TINYINT(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'メルマガステータス' AFTER email;
```

#### テーブルのカラム削除

```mysql
ALTER TABLE <table> DROP COLUMN <column>;
```

#### テーブルのカラム編集

```mysql
ALTER TABLE <table> CHANGE <old column> <new column> <column 定義>;
```

- 例) product テーブル の カラム名「no」を 「id」に、 unsigned(符号なし)、NULL禁止、デフォルト: 0、カラムコメント 「商品ID」に修正

```mysql
ALTER TABLE product CHANGE `no` `id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '商品ID';
```

#### インデックス一覧表示

```
SHOW INDEXES FROM <table>;
```

#### インデックス追加

```
ALTER TABLE <table> ADD INDEX <index name>(<column>);

ALTER TABLE <table> ADD INDEX <index name>(<column1>,<column2>);
```

#### インデックス削除

```
ALTER TABLE <table> DROP INDEX <index name>;
```

#### ユニーク追加

```
ALTER TABLE <table> ADD UNIQUE(<column>);
```

#### ユニーク削除

#### DBの文字コード確認

```mysql
SHOW CREATE DATABASE dbname
```

#### gz形式で圧縮状態のファイルを特定DBスキーマへ実行

```sh
zcat dump.sql.gz | mysql -u <user> -p<password> dbname
```

#### 全テーブルの統計情報をサイズ順に一覧表示

```mysql
SELECT table_name, engine, table_rows AS tbl_rows, avg_row_length AS rlen, floor((data_length + index_length) / 1024 / 1024) AS allMB, floor((data_length) / 1024 / 1024) AS dMB, floor((index_length) / 1024 / 1024) AS iMB FROM information_schema.tables WHERE table_schema = database() ORDER BY (data_length + index_length) DESC;
```

#### テーブルの文字コード等確認

```mysql
SELECT * FROM information_schema.schemata WHERE schema_name = 'database_name';

+--------------+---------------+----------------------------+------------------------+----------+
| CATALOG_NAME | SCHEMA_NAME   | DEFAULT_CHARACTER_SET_NAME | DEFAULT_COLLATION_NAME | SQL_PATH |
+--------------+---------------+----------------------------+------------------------+----------+
| def          | database_name | utf8                       | utf8_general_ci        | NULL     |
+--------------+---------------+----------------------------+------------------------+----------+
```

## DB/Table 作成

#### DB作成 (CHARACTER=utf8)

```mysql
CREATE DATABASE `database_name` CHARACTER SET utf8;
```

#### 指定DB/ホストに対してユーザ・パスワード・権限設定

以下設定する必要あり

- database_name
- user_name
- host_name
- password

```mysql
GRANT ALL PRIVILEGES ON `database_name`.* TO `user_name`@'host_name' IDENTIFIED BY 'password' WITH GRANT OPTION;
```

#### 指定ユーザにmysql スロークエリログ参照権限付与

```mysql
GRANT select ON mysql.slow_log TO user_name;
```

#### 指定ユーザにRDS(AWS)のmsyql スロークエリ参照権限付与

```mysql
GRANT EXECUTE ON PROCEDURE mysql.rds_rotate_slow_log TO user_name;
```

#### 指定ユーザの権限表示

```mysql
SHOW GRANTS for 'user_name'@'%';
```

#### 設定反映

上記権限設定した後に設定反映

```mysql
FLUSH PRIVILEGES;
```

GRANT での権限付与の場合は特に `FLUSH PRIVILEGES` は不要ですが念の為。
INSERT、UPDATE、DELETE 等で権限付与した場合は `FLUSH PRIVILEGES` が必要になります。

#### テーブル毎の容量確認

[http://kenzo0107.hatenablog.com/entry/2016/06/27/121920:embed:cite]


#### ちょうど1年前に

```mysql
SELECT NOW() - INTERVAL 1 YEAR;
```


#### 昨日のことのように

```mysql
SELECT NOW() - INTERVAL 1 DAY;
```

#### 1日前の00:00:00

```mysql
SELECT CURDATE() - INTERVAL 1 DAY;
```

#### 1日前の11:00:00

```mysql
SELECT DATE_FORMAT(CURDATE() - INTERVAL 1 DAY, '%Y-%m-%d 11:00:00');
```

#### MySQL バージョン確認

```sh
mysql -u <user> -p<pass> -e"SELECT version();"

+------------+
| version()  |
+------------+
| 5.5.42-log |
+------------+
```



## 各種メトリクス

#### SELECT / INSERT / UPDATE / DELETE / REPLACE コマンドの実行回数取得

```sh
mysql -u root -NBe "SHOW GLOBAL STATUS" | grep "Com_"  | grep -E "select|insert|update|delete|replace"
```

[f:id:kenzo0107:20160927140251p:plain]

|*Item*|*Explain*|
|---|---|
|Com_delete|削除 (DELETE) 実行回数|
|Com_delete_multi|複数行 (DELETE) 実行回数 |
|Com_insert|登録 (INSERT) 実行回数 |
|Com_insert_select|コピー作成 (INSERT SELECT) 実行回数|
|Com_replace|再作成 (REPLACE) 実行回数 |
|Com_replace_select|再作成 (REPLACE SELECT) 実行回数|
|Com_select|選択 (SELECT) 実行回数 |
|Com_update|更新 (UPDATE) 実行回数 |
|Com_update_multi|複数行更新 (UPDATE) 実行回数|

#### 接続中 のコネクション数取得

```sh
mysql -u root -BNe "SHOW STATUS LIKE 'Threads_connected';"
```
