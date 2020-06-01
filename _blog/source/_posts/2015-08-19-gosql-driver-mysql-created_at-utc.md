---
layout: post
title: go-sql-driver/mysqlでcreated_at (datetime) がUTCで登録されてしまう件
date: 2015-08-19
category: Go
tags:
- Go
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150819/20150819234635.gif
---

## 環境
- go-sql-driver/mysql version 1.2

## 結論

以下のように `parseTime=true`と`loc=Asia%2FTokyo`を設定する。

```
db, err := sql.Open("mysql", "user:passward@/dbname?parseTime=true&loc=Asia%2FTokyo")
```

`loc=xxxx`の指定がない場合、`local`が指定され、
datetimeにtime.Now()を指定してINSERTしても
UTC時間に書き直されてしまう。


ちょっとハマりました。
