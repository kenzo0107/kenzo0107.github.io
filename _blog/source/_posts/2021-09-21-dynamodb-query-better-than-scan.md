---
title: DynamoDB Scan ではなく Query を使おう！ ~GSI の設定には気をつけようの巻~
date: 2021-09-21
---

参考: https://docs.aws.amazon.com/ja_jp/amazondynamodb/latest/developerguide/bp-query-scan.html

> 応答時間を短縮するには、アプリケーションが Scan ではなく Query を使用できるようにテーブルおよびインデックスを設計します。

AWS ベストプラクティス にもある通り、Scan による全件捜査はデータ量が増えるとパフォーマンスが劣化する為、極力 Query を利用することを推奨しています。

## 【例題】 どうやって Query を実行する？

以下の様な `worriors` テーブルがあるとします。

| id | category | name | score |
| --- | --- | --- | --- |
| 1 | a | tanahashi | 88 |
| 2 | a | choshu | 70 |
| 3 | a | maeda | 77 |
| 4 | b | sayama | 90 |
| 5 | b | antonio | 100 |

* Key Schema:
  - id : （数値） パーティションキー
  - score: （数値）ソートキー


ここで `category = a & score > 70` の name リストを取得したい場合、どの様に DynamoDB に処理を実行すれば良いでしょうか？

* Scan を利用した場合

```console
$ aws dynamodb scan \
    --table-name worriors \
    --projection-expression '#NM' \
    --filter-expression '#CTGRY = :g AND #SCR > :scr' \
    --expression-attribute-values '{
        ":g": {"S":"a"},
        ":scr": {"N":"70"}
    }' \
    --expression-attribute-names '{
        "#CTGRY": "category",
	    "#SCR": "score",
	    "#NM": "name"
    }'

// response
{
    "Items": [
        {
            "name": {
                "S": "maeda"
            }
        },
        {
            "name": {
                "S": "tanahashi"
            }
        }
    ],
    "Count": 2,
    "ScannedCount": 5,
    "ConsumedCapacity": null
}
```

ですが、 Scan は前述した通り、データ量増加でパフォーマンスが劣化します。
Query を使ってみたいと思います。

```console
$ aws dynamodb query \
    --table-name worriors \
    --key-condition-expression "#CTGRY = :g" \
    --filter-expression '#SCR > :scr' \
    --projection-expression "#NM" \
    --expression-attribute-names '{
            "#CTGRY": "category",
            "#SCR": "score",
            "#NM": "name"
    }' \
    --expression-attribute-values '{
        ":g": {"S": "a"},
        ":scr": {"N": "70"}
    }'

An error occurred (ValidationException) when calling the Query operation: Query condition missed key schema element: id
```

Key Schema で設定したパーティションキー id が指定されていないというエラーが出ます。

DynamoDB コンソール上でもクエリ検索時はパーティションキーの指定は必須です。

![](https://i.imgur.com/BprHlzQ.png)

Query で score の比較だけで検索できないのでしょうか？


## GSI を指定する

Global Secondary Index を設定し、Query 実行時に指定することで意図した処理が可能です。

GSI は指定したキーで新たなテーブルを作るイメージです。

GSI のパーティションキー category を設定します。

![](https://i.imgur.com/Iv2E5mG.png)

![](https://i.imgur.com/tZKxkLY.png)

```console
$ aws dynamodb query \
    --table-name worriors \
    --index-name category-index \
    --key-condition-expression "#CTGRY = :g" \
    --filter-expression '#SCR > :scr' \
    --projection-expression "#NM" \
    --expression-attribute-names '{
            "#CTGRY": "category",
            "#SCR": "score",
            "#NM": "name"
    }' \
    --expression-attribute-values '{
        ":g": {"S": "a"},
        ":scr": {"N": "70"}
    }'

// response
{
    "Items": [
        {
            "name": {
                "S": "maeda"
            }
        },
        {
            "name": {
                "S": "tanahashi"
            }
        }
    ],
    "Count": 2,
    "ScannedCount": 3,
    "ConsumedCapacity": null
}
```

## 余談

score を GSI のソートキーを指定したい所ですが、
既にテーブルのキーとして利用しているので利用できません。

テーブル構築時に利用想定が読めない場合は極力キーの設定を絞っておく方が良さそうです。
