---
layout: post
title: ElasticSearchインストール on CentOS7
date: 2015-08-06
---

## 環境
- CentOS Linux release 7.0.1406 (Core)
- ElasticSearch 1.7.1


## 必要モジュールダウンロード

```console
$ yum install -y curl-devel java-1.8.0-openjdk
```

#### java バージョン確認

```console
# java version "1.7.0_85"
OpenJDK Runtime Environment (rhel-2.6.1.2.el7_1-x86_64 u85-b01)
OpenJDK 64-Bit Server VM (build 24.85-b03, mixed mode)
```

## public signing keyをダウンロード・インストール

```console
$ rpm --import https://packages.elastic.co/GPG-KEY-elasticsearch
```

## yum repositoryに elasticsearch追加

#### /etc/yum.repos.d/elasticsearch.repo 作成

```console
$ vi /etc/yum.repos.d/elasticsearch.repo
```

#### 以下追記

```
[elasticsearch-1.7]
name=Elasticsearch repository for 1.7.x packages
baseurl=http://packages.elastic.co/elasticsearch/1.7/centos
gpgcheck=1
gpgkey=http://packages.elastic.co/GPG-KEY-elasticsearch
enabled=1
```

## インストール

```console
$ yum install -y elasticsearch
```

## config設定

##### 設定ファイル作成

```console
$ cp /etc/elasticsearch/elasticsearch.yml /usr/share/elasticsearch/config
$ vim /usr/share/elasticsearch/config/elasticsearch.yml
```

- 9200 port設定

```
- #http.port: 9200
+ http.port: 9200
```

## kuromojiプラグインをインストール

形態素解析器を使って日本語検索が可能になる。

ElasticSearchのバージョンによって elasticsearch-analysis-kuromojiのバージョンを変更する必要があります。
以下参考にお願いします。

https://github.com/elastic/elasticsearch-analysis-kuromoji

ここかなりハマりました汗


```console
$ /usr/share/elasticsearch/bin/plugin --install elasticsearch/elasticsearch-analysis-kuromoji/2.7.0
```



## elasticsearch サーバ起動時、自動起動登録

```console
$ systemctl start elasticsearch.service
$ systemctl daemon-reload
$ systemctl enable elasticsearch.service
```

## 実行確認

```console
$ curl http://localhost:9200
```

- 実行結果

```
{
  "status" : 200,
  "name" : "Angelica Jones",
  "cluster_name" : "elasticsearch",
  "version" : {
    "number" : "1.7.1",
    "build_hash" : "b88f43fc40b0bcd7f173a1f9ee2e97816de80b19",
    "build_timestamp" : "2015-07-29T09:54:16Z",
    "build_snapshot" : false,
    "lucene_version" : "4.10.4"
  },
  "tagline" : "You Know, for Search"
}
```


以上
