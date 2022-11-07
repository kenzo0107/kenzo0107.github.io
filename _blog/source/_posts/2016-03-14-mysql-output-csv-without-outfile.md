---
layout: post
title: MySQL SQL結果をINTO OUTFILEを使用せずCSV取得
date: 2016-03-14
tags:
  - MySQL
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160408/20160408142308.png
---

## 概要

MySQL SELECT 文の結果を csv で取得する際
以下のように CLI 上で実行することで取得できます。

```
$ mysql -u <user> -p<password> <db_name>
mysql> SELECT * FROM [table] WHERE hoge=hoge INTO OUTFILE "/tmp/output.csv" FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"';
```

ですが、mysql ログインユーザ<user>の権限に FILE がない場合
以下のようなエラーで出力できません。

```
RROR 1 (HY000): Can't create/write to file '/tmp/output.csv' (Errcode: 13)
```

FILE の READ/WRITE 権限を付与すれば問題ないですが
権限周りをいじりたくないときなどあるかと思います。

本番環境の DB で権限周りがブラックボックス化していて
FLUSH PRIVILEGES すると何か障害が出るんじゃないかとか汗

その際に実施したことを以下まとめました。

## 考え方

TXT として取得して sed で csv ファイルに加工する、
という方法で実行しています。

例) 以下のような SQL 実行結果を取得したとすると

```
$ less output.txt

商品1    2    1,000    2,000
商品2    3    1,500    3,000
```

↓ Excel で表示されるように加工すると

```
$ less output.txt

"商品1", "2","1,000","2,000"
"商品1", "3","1,500","3,000"
```

## 手順

### query 結果を ouput.txt に出力

```
$ mysql -u <user> -p<password> <db_name> -e"<query>"  > output.txt
```

### Excel 用に加工

- 力技

```
// 各行の一番前(「^」)に「"」を付加
$ cat output.txt | sed -e 's/^/"/g' > output2.txt

"商品1    2    1,000    2,000
"商品2    3    1,500    3,000

// 各行の一番後(「$」)に「"」を付加
$ cat output2.txt | sed -e 's/$/"/g' > output3.txt


"商品1    2    1,000    2,000"
"商品2    3    1,500    3,000"

// タブ「/t」を「","」に変更
$ cat output3.txt | sed -e 's/\t/","/g' > ouptut4.txt

"商品1","2","1,000","2,000"
"商品2","3","1,500","3,000"
```

## 文字コード変更

この CSV を利用する方(提出先)の方の文字コードに合わせます。
提出先では Shift JIS がデフォルトとのことで そこに変更します。

```
$ nkf -g output4.txt
UTF-8
```

```
$ nkf -sLw output4.txt > output.csv

$ nkf -g output.csv
Shift_JIS
```

これで INTO OUTFILE を利用せず CSV ファイルを取得できました。
ouput.csv

## おまけ

ファイル名に日付をつける。

```
$ mv output.csv output_`date '+%Y%m%d'`.csv
```

```
$ ls

output.csv
output_20160314.csv
```
