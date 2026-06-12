---
layout: post
title: Elasticsearch Index List, Mapping List, and Mapping Configuration
date: 2015-10-08
category: Database
lang: en
translation_id: elasticsearch-index-mapping
permalink: en/2015/10/08/elasticsearch-index-mapping/
cover: /img/cover/2015-10-08-elasticsearch-index-mapping.svg
tags:
- Elasticsearch
---

## Prerequisites

This assumes you are working on a server where Elasticsearch is installed.

## Index List

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

- Specifying `pretty` in the query string
formats the JSON output nicely.


## Index Mapping List

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

## Mapping Configuration

### Create the JSON file

```
$ cd /etc/elasticsearch/
$ vim el_mapping.json
```

- el_mapping.json

Configure and save it as follows:

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


### Apply the mapping configuration

```
curl -X PUT localhost:9200/_template/template_1 --data @el_mapping.json
```

### List the mapping configuration

```js
curl -X GET localhost:9200/_template/?pretty

# The list is output
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

### Delete the mapping configuration

```
curl -X DELETE localhost:9200/_template/template_1
```

### The string type is defined collectively with dynamic_templates.

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

## Deleting an Index

Specify an index to delete it.

```
curl -X DELETE localhost:9200/logstash-2015.09.22

{"acknowledged":true}
```


## Deleting All Indices

```
$ curl -XDELETE 'http://localhost:9200/*'

{"acknowledged":true}
```


I used this a few times while experimenting through trial and error before the service launched.
Avoid using it as much as possible.

## Deleting a Specific Index

- Example) Deleting the .kibana index

```
$ curl -XDELETE 'http://localhost:9200/.kibana'
```

There is someone who has kindly summarized each field configuration below.
Thank you very much!

[Achieving both exact-match and partial-match string search with Kibana + Elasticsearch](https://qiita.com/harukasan/items/4ec517d8d96f557367e1)
