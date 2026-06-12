---
title: Use Query Instead of Scan in DynamoDB! ~Watch Out for Your GSI Configuration~
date: 2021-09-21
category: AWS
lang: en
translation_id: dynamodb-query-better-than-scan
permalink: en/2021/09/21/dynamodb-query-better-than-scan/
cover: https://i.imgur.com/BprHlzQ.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

Reference: https://docs.aws.amazon.com/ja_jp/amazondynamodb/latest/developerguide/bp-query-scan.html

> To get the fastest response times, design your tables and indexes so that your applications can use Query instead of Scan.

As stated in the AWS best practices, scanning every item with Scan degrades performance as the data volume grows, so it is recommended to use Query as much as possible.

## [Example] How do you run a Query?

Suppose you have a `worriors` table like the following.

| id  | category | name      | score |
| --- | -------- | --------- | ----- |
| 1   | a        | tanahashi | 88    |
| 2   | a        | choshu    | 70    |
| 3   | a        | maeda     | 77    |
| 4   | b        | sayama    | 90    |
| 5   | b        | antonio   | 100   |

- Key Schema:
  - id : (number) partition key
  - score: (number) sort key

Here, if you want to retrieve a list of names where `category = a & score > 70`, how should you tell DynamoDB to process the request?

- Using Scan

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

However, as mentioned earlier, Scan degrades in performance as the data volume increases.
Let's try using Query instead.

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

You get an error saying that the partition key `id` defined in the Key Schema is not specified.

Even in the DynamoDB console, specifying the partition key is required when running a query search.

![](https://i.imgur.com/BprHlzQ.png)

Isn't there a way to search with Query using only the score comparison?

## Specify a GSI

By configuring a [Global Secondary Index](https://docs.aws.amazon.com/ja_jp/amazondynamodb/latest/developerguide/GSI.html) and specifying it when running the Query, you can perform the intended processing.

Think of a GSI as creating a new table keyed on the attributes you specify.

Set up category as the GSI's partition key.

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

## Side note

I would have liked to specify score as the GSI's sort key,
but since it is already used as a key on the table, it cannot be used.

When building a table, if you can't anticipate how it will be used, it seems best to keep the key configuration as minimal as possible.
