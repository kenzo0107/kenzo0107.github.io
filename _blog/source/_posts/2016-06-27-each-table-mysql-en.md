---
layout: post
title: Checking Table-Level Size in MySQL
date: 2016-06-27
lang: en
translation_id: each-table-mysql
permalink: en/2016/06/27/each-table-mysql/
cover: /img/cover/2016-06-27-each-table-mysql.svg
tags:
- MySQL
---

- SQL

```
mysql> use zabbix
Database changed

mysql> select
    -> table_name, engine, table_rows as tbl_rows, avg_row_length as rlen,
    -> floor((data_length+index_length)/1024/1024) as allMB,  #総容量
    -> floor((data_length)/1024/1024) as dMB,  #データ容量
    -> floor((index_length)/1024/1024) as iMB   #インデックス容量
    -> from information_schema.tables
    -> where table_schema=database()
    -> order by (data_length+index_length) desc;
```

- Execution result

```
+----------------------------+--------+----------+-------+-------+------+------+
| table_name                 | engine | tbl_rows | rlen  | allMB | dMB  | iMB  |
+----------------------------+--------+----------+-------+-------+------+------+
| history                    | InnoDB | 23815217 |    51 |  1802 | 1179 |  623 |
| history_uint               | InnoDB | 21709131 |    51 |  1646 | 1075 |  571 |
| trends_uint                | InnoDB |    45152 |   650 |    28 |   28 |    0 |
| trends                     | InnoDB |    30965 |   914 |    27 |   27 |    0 |
| history_str                | InnoDB |   129224 |   109 |    19 |   13 |    5 |
| items                      | InnoDB |     2242 |   708 |     2 |    1 |    0 |
| images                     | InnoDB |      144 | 11036 |     1 |    1 |    0 |
| items_applications         | InnoDB |     2468 |    66 |     0 |    0 |    0 |
| triggers                   | InnoDB |      805 |   223 |     0 |    0 |    0 |
| graphs_items               | InnoDB |      948 |   103 |     0 |    0 |    0 |
| functions                  | InnoDB |      833 |    98 |     0 |    0 |    0 |
| events                     | InnoDB |      718 |   114 |     0 |    0 |    0 |
| alerts                     | InnoDB |       88 |   930 |     0 |    0 |    0 |
| graphs                     | InnoDB |      329 |   248 |     0 |    0 |    0 |

...
...
```

By the way, the results above are from a Zabbix DB.
Since the data in `history` tends to grow large,
you can see that you need to take measures such as adjusting
the retention period via partitioning or Zabbix housekeeping.
