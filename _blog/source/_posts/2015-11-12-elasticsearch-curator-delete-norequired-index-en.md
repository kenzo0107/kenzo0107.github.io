---
layout: post
title: Bulk-deleting Unneeded Indices with Elasticsearch curator
date: 2015-11-13
lang: en
translation_id: elasticsearch-curator-delete-norequired-index
permalink: en/2015/11/12/elasticsearch-curator-delete-norequired-index/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151112/20151112142836.png
tags:
- Elasticsearch
---

## Overview

We were running fluentd + ElasticSearch + kibana, but one day ElasticSearch stopped working.

It turned out that old indices had piled up more and more, causing an out-of-memory error.

Since the logs are uploaded to S3 anyway, I addressed the issue by deleting unneeded indices as appropriate.

## Environment

- CentOS Linux release 7.0.1406 (Core)
- ElasticSearch 1.7.1
- Python 2.7.5
- pip 7.1.0




## Installing curator

- Run the following on the server where ElasticSearch is installed

```
# pip install curator
```

## Running the curator command

- Run the following on the server where ElasticSearch is installed

```
# close indices older than 14 days (2 weeks)
curator --host localhost close indices --prefix logstash --older-than 14 --time-unit days --timestring %Y.%m.%d

# delete indices older than 35 days (4 weeks)
curator --host localhost delete indices --prefix logstash --older-than 35 --time-unit days --timestring %Y.%m.%d

# disable the bloom filter for indices older than 2 days
curator --host localhost bloom indices --prefix logstash --older-than 2 --time-unit days --timestring %Y.%m.%d
```

I configured the above to run on Jenkins via the [SSH plugin](https://wiki.jenkins-ci.org/display/JENKINS/SSH+plugin), logging in to the remote server to execute the commands, and set it up to run once a day through periodic polling.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151112/20151112142836.png" width="100%">
</div>

That's all.
