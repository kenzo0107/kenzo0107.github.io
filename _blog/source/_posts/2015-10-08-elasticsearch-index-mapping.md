---
layout: post
title: Elasticsearch インデックス一覧・マッピング一覧・マッピング設定
date: 2015-10-08
tags:
- Elasticsearch
---

## 前提

Elasticsearch のインストールされているサーバ内での作業を想定しています。

## インデックス一覧

```
curl -XGET localhost:9200/_aliases?pretty
```

```
{
  "logstash-2015.09.22" : {
    "aliases" : { }
  },
  "logstash-2015.09.21" : {
    "aliases" : { }
  },
}
```

- `pretty`をクエリストリングに指定すると
jsonが整形されて表示されます。


## インデックスのマッピング一覧

```
$ curl -XGET localhost:9200/_mapping?pretty
```

```js
{
  "logstash-2015.09.22" : {
    "mappings" : {
      "project_production_nginx" : {
        "properties" : {
          "@log_name" : {
            "type" : "string"
          },
          "@timestamp" : {
            "type" : "date",
            "format" : "dateOptionalTime"
          },
          "body_bytes_sent" : {
            "type" : "long"
          },
          "bytes_sent" : {
            "type" : "long"
          },
          "forwardedfor" : {
            "type" : "string"
          },
          "host" : {
            "type" : "string"
          },
          "https" : {
            "type" : "string"
          },
          "log_level" : {
            "type" : "string"
          },
          "message" : {
            "type" : "string"
          },
          "pid" : {
            "type" : "string"
          },
          "query_string" : {
            "type" : "string"
          },
          "referer" : {
            "type" : "string"
          },
          "remote_addr" : {
            "type" : "string"
          },
          "request_length" : {
            "type" : "long"
          },
          "request_method" : {
            "type" : "string"
          },
          "request_time" : {
            "type" : "double"
          },
          "request_uri" : {
            "type" : "string"
          },
          "status" : {
            "type" : "long"
          },
          "tid" : {
            "type" : "string"
          },
          "upstream_response_time" : {
            "type" : "long"
          },
          "uri" : {
            "type" : "string"
          },
          "useragent" : {
            "type" : "string"
          }
        }
      }
    }
  }
}
```

## マッピング設定

### jsonファイル作成

```
$ cd /etc/elasticsearch/
$ vim el_mapping.json
```

- el_mapping.json

以下のように設定し保存

```js
{
    "template": "logstash-*",
    "mappings" : {
      "_default_" : {
        "dynamic_templates":[{
            "string_template":{
                "match":"*",
                "mapping":{
                    "type":"string",
                    "index":"not_analyzed"
                },
                "match_mapping_type":"string"
            }
        }],
        "properties" : {
          "@timestamp" : {
            "type" : "date",
            "format" : "dateOptionalTime"
          },
          "body_bytes_sent" : {
            "type" : "long"
          },
          "bytes_sent" : {
            "type" : "long"
          },
          "geoip" : {
            "properties" : {
              "location" : {
                "type" : "geo_point",
                "lat_lon" : true,
                "geohash" : true,
                "geohash_prefix" : true,
                "geohash_precision" : 10
              }
            }
          },
          "request_length" : {
            "type" : "long"
          },
          "request_time" : {
            "type" : "double"
          },
          "status" : {
            "type" : "long"
          },
          "upstream_response_time" : {
            "type" : "long"
          },
          "coordinate" : {
            "type" : "double"
          },
          "country" : {
            "type" : "string"
          },
          "lat" : {
            "type" : "double"
          },
          "location_properties" : {
            "type" : "geo_point"
          },
          "lon" : {
            "type" : "double"
          }
        }
      }
    }
}
```


### マッピング設定実行

```
curl -X PUT localhost:9200/_template/template_1 --data @el_mapping.json
```

### マッピング設定一覧

```js
curl -X GET localhost:9200/_template/?pretty

# 一覧が出力される
...
...
},
  "template_1" : {
    "order" : 0,
    "template" : "flag_prd.accesslog-*",
    "settings" : { },
    "mappings" : {
      "_default_" : {
        "dynamic_templates" : [ {
          "string_template" : {
            "mapping" : {
              "index" : "not_analyzed",
              "type" : "string"
            },
            "match_mapping_type" : "string",
            "match" : "*"
          }
        } ],
        "properties" : {
...
...
```

### マッピング設定削除

```
curl -X DELETE localhost:9200/_template/template_1
```

### string型はまとめてdynamic_templatesで定義してます。

```js
        "dynamic_templates":[{
            "string_template":{
                "match":"*",
                "mapping":{
                    "type":"string",
                    "index":"not_analyzed"
                },
                "match_mapping_type":"string"
            }
        }],
```

## インデックス削除

インデックスを指定し削除します。

```
curl -X DELETE localhost:9200/logstash-2015.09.22

{"acknowledged":true}
```


## インデックス全削除

```
$ curl -XDELETE 'http://localhost:9200/*'

{"acknowledged":true}
```


サービス開始前で試行錯誤してるときに何度か利用しました。
極力使わない。

## 指定インデックス削除

- 例) .kibana インデックス削除

```
$ curl -XDELETE 'http://localhost:9200/.kibana'
```

各フィールド設定は以下まとめていただいている方がいらっしゃいました。
ありがとうございます♪

[Kibana+Elasticsearchで文字列の完全一致と部分一致検索の両方を実現する](https://qiita.com/harukasan/items/4ec517d8d96f557367e1)
