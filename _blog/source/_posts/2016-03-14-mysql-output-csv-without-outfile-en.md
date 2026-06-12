---
layout: post
title: Exporting MySQL SQL Results to CSV Without Using INTO OUTFILE
date: 2016-03-14
categories:
  - [Database]
  - [Infrastructure]
lang: en
translation_id: mysql-output-csv-without-outfile
permalink: en/2016/03/14/mysql-output-csv-without-outfile/
tags:
  - MySQL
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160408/20160408142308.png
---

## Overview

When you want to export the results of a MySQL SELECT statement to CSV,
you can do so by running the following on the CLI.

```
$ mysql -u <user> -p<password> <db_name>
mysql> SELECT * FROM [table] WHERE hoge=hoge INTO OUTFILE "/tmp/output.csv" FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"';
```

However, if the MySQL login user <user> does not have the FILE privilege,
the output fails with an error like the following.

```
RROR 1 (HY000): Can't create/write to file '/tmp/output.csv' (Errcode: 13)
```

Granting READ/WRITE permission via the FILE privilege would solve the problem,
but there are times when you would rather not touch privileges.

On a production DB where the privileges are a black box,
you might break into a cold sweat worrying that running FLUSH PRIVILEGES could cause some kind of outage.

Below I've summarized what I did in such a situation.

## The Idea

The approach is to first export the results as a TXT file,
then process it into a CSV file with sed.

Example) Suppose you obtain a SQL result like the following

```
$ less output.txt

商品1    2    1,000    2,000
商品2    3    1,500    3,000
```

↓ After processing it so it displays nicely in Excel

```
$ less output.txt

"商品1", "2","1,000","2,000"
"商品1", "3","1,500","3,000"
```

## Procedure

### Output the query result to output.txt

```
$ mysql -u <user> -p<password> <db_name> -e"<query>"  > output.txt
```

### Process it for Excel

- Brute force

```
// Prepend a `"` at the very beginning of each line (`^`)
$ cat output.txt | sed -e 's/^/"/g' > output2.txt

"商品1    2    1,000    2,000
"商品2    3    1,500    3,000

// Append a `"` at the very end of each line (`$`)
$ cat output2.txt | sed -e 's/$/"/g' > output3.txt


"商品1    2    1,000    2,000"
"商品2    3    1,500    3,000"

// Replace tabs (`/t`) with `","`
$ cat output3.txt | sed -e 's/\t/","/g' > ouptut4.txt

"商品1","2","1,000","2,000"
"商品2","3","1,500","3,000"
```

## Change the Character Encoding

Match the character encoding to that used by the recipient of this CSV.
The recipient said Shift JIS was their default, so I converted it accordingly.

```
$ nkf -g output4.txt
UTF-8
```

```
$ nkf -sLw output4.txt > output.csv

$ nkf -g output.csv
Shift_JIS
```

With this, I was able to obtain a CSV file without using INTO OUTFILE.
ouput.csv

## Bonus

Add a date to the file name.

```
$ mv output.csv output_`date '+%Y%m%d'`.csv
```

```
$ ls

output.csv
output_20160314.csv
```
