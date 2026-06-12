---
layout: post
title: Installing Elasticsearch on CentOS 7
date: 2015-08-06
categories:
  - [Database]
  - [Infrastructure]
lang: en
translation_id: install-elasticsearch-on-centos7
permalink: en/2015/08/06/install-elasticsearch-on-centos7/
cover: /img/cover/2015-08-06-install-elasticsearch-on-centos7.svg
---

## Environment
- CentOS Linux release 7.0.1406 (Core)
- ElasticSearch 1.7.1


## Download Required Modules

```console
$ yum install -y curl-devel java-1.8.0-openjdk
```

#### Check the Java version

```console
# java version "1.7.0_85"
OpenJDK Runtime Environment (rhel-2.6.1.2.el7_1-x86_64 u85-b01)
OpenJDK 64-Bit Server VM (build 24.85-b03, mixed mode)
```

## Download and Install the Public Signing Key

```console
$ rpm --import https://packages.elastic.co/GPG-KEY-elasticsearch
```

## Add Elasticsearch to the yum Repository

#### Create /etc/yum.repos.d/elasticsearch.repo

```console
$ vi /etc/yum.repos.d/elasticsearch.repo
```

#### Add the following

```
[elasticsearch-1.7]
name=Elasticsearch repository for 1.7.x packages
baseurl=http://packages.elastic.co/elasticsearch/1.7/centos
gpgcheck=1
gpgkey=http://packages.elastic.co/GPG-KEY-elasticsearch
enabled=1
```

## Install

```console
$ yum install -y elasticsearch
```

## Configure config

##### Create the configuration file

```console
$ cp /etc/elasticsearch/elasticsearch.yml /usr/share/elasticsearch/config
$ vim /usr/share/elasticsearch/config/elasticsearch.yml
```

- Set the 9200 port

```
- #http.port: 9200
+ http.port: 9200
```

## Install the kuromoji Plugin

This enables Japanese search using a morphological analyzer.

The version of elasticsearch-analysis-kuromoji you need depends on the version of ElasticSearch.
Please refer to the following.

https://github.com/elastic/elasticsearch-analysis-kuromoji

I got really stuck here, ugh.


```console
$ /usr/share/elasticsearch/bin/plugin --install elasticsearch/elasticsearch-analysis-kuromoji/2.7.0
```



## Register the elasticsearch Server to Start Automatically on Boot

```console
$ systemctl start elasticsearch.service
$ systemctl daemon-reload
$ systemctl enable elasticsearch.service
```

## Verify It Works

```console
$ curl http://localhost:9200
```

- Result

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


That's all.
