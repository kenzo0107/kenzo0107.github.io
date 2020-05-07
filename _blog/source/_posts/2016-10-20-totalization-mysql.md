---
layout: post
title: MySQL COUNT, SUM, GROUP BY, CASE WHEN THEN で集計する
date: 2016-10-20
tags:
- MySQL
---

## 概要

ECサイトに新しい決済機能の利用率出したいな
と思ったときのクエリです。

ちょうどいくつかの集計関数がまとまった1クエリとなったので
まとめました。


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

- パッケージ = EC-CUBE 2.11.5
- 新決済ID = 12

## 結果

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161020/20161020182836.png" width="100%">
</div>

CASE文をさらっと書けるようになると少し大人になった気分になります。
心残りは比率部分の重複部分がまとまったらかっこいいかなと。

精進します。
