---
layout: post
title: Aggregating Data in MySQL with COUNT, SUM, GROUP BY, and CASE WHEN THEN
date: 2016-10-20
category: Database
lang: en
translation_id: totalization-mysql
permalink: en/2016/10/20/totalization-mysql/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161020/20161020182836.png
tags:
- MySQL
---

## Overview

This is a query I came up with when I wanted to calculate the usage rate of a new payment feature on an EC site.

It happened to combine several aggregate functions into a single query, so I put it together here.


```sql
SELECT
     DATE_FORMAT(create_date, '%Y-%m-%d') AS 日付
    ,COUNT(order_id)                      AS 全件数
    ,FORMAT(SUM(payment_total),0)         AS "全支払い合計(円)"
    ,COUNT(payment_id = 12 or NULL)       AS "新決済機能の購入件数"
    ,COUNT(customer_id = 0 or NULL)       AS "ゲスト購入数"
    ,FORMAT(SUM(CASE WHEN payment_id = 12 THEN payment_total else 0 END),0) AS "新決済機能の購入支払い合計(円)"
    ,count(payment_id = 12 or NULL)/count(order_id) * 100 AS "新決済機能の購入比率(%)"
    ,SUM(CASE WHEN payment_id = 12 THEN payment_total else 0 END)/SUM(payment_total) * 100 AS "新決済機能の購入支払い合計比率(%)"
    ,COUNT(customer_id = 0 or NULL)/COUNT(order_id) * 100 AS "ゲスト購入比率"
FROM
     dtb_order
WHERE 1=1
     AND site_id = 1
     AND create_date > '2016-09-21 10:00:00'
GROUP BY
     DATE_FORMAT(create_date, '%Y%m%d')
    ;
```

- Package = EC-CUBE 2.11.5
- New payment ID = 12

## Result

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161020/20161020182836.png" width="100%">
</div>

Being able to write a CASE statement casually makes me feel a little more grown up.
My one regret is that it would be cooler if the duplicated parts in the ratio calculations could be consolidated.

I'll keep working at it.
