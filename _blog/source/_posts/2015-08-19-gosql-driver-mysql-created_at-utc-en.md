---
layout: post
title: created_at (datetime) gets stored in UTC with go-sql-driver/mysql
date: 2015-08-19
lang: en
translation_id: gosql-driver-mysql-created_at-utc
permalink: en/2015/08/19/gosql-driver-mysql-created_at-utc/
category: Go
tags:
  - Go
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150819/20150819234635.gif
---

## Environment

- go-sql-driver/mysql version 1.2

## Conclusion

Set `parseTime=true` and `loc=Asia%2FTokyo` as shown below.

```
db, err := sql.Open("mysql", "user:passward@/dbname?parseTime=true&loc=Asia%2FTokyo")
```

When `loc=xxxx` is not specified, `local` is used, and even if you pass time.Now() to a datetime column on INSERT, it gets rewritten to UTC time.

This one tripped me up for a bit.
