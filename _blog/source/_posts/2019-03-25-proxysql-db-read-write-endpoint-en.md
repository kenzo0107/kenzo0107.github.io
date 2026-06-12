---
layout: post
title: Switching DB Read/Write Endpoints with ProxySQL
date: 2019-03-25
lang: en
translation_id: proxysql-db-read-write-endpoint
permalink: en/2019/03/25/proxysql-db-read-write-endpoint/
cover: /img/cover/2019-03-25-proxysql-db-read-write-endpoint.svg
tags:
- ProxySQL
---

I built and tested an environment on docker-compose where ProxySQL switches the access target between the primary DB and the secondary DB on a per-SQL basis.

[kenzo0107/proxysql-mysql-group-replication](https://github.com/kenzo0107/proxysql-mysql-group-replication)

## What is ProxySQL?

ProxySQL is a high-performance SQL proxy for MySQL.

In addition to MySQL forks such as Percona Server and MariaDB, it also supports Galera Cluster.

## What I Wanted to Try This Time

What I focused on this time is ProxySQL's SQL proxy functionality.

ProxySQL switches the Read/Write endpoint depending on the SQL.

<!-- more -->

* SELECT goes to the Read endpoint
* INSERT, UPDATE, and DELETE go to the Write endpoint



That is the gist of it.

## Why I Decided to Use It

Regardless of Rails, there are cases where Read/Write switching cannot be done due to problems on the application side.


* In Rails, switch_point may not take effect in places that depend on a particular gem.
* With a proprietary framework, the DB-side processing may be too complex to touch.



As a service grows, the inability to switch DBs on the application side can directly lead to a DB bottleneck.

To solve this, I decided to use ProxySQL.

## Trying It Out in Practice

If you `git clone` the repository linked at the beginning and run `docker-compose up`, it will start up.

Please follow the steps in the README.


* UPDATE goes to the primary DB
* SELECT goes to the secondary DB



You can see that this is how the access is routed.

## TODO


* Investigate how transaction processing is handled in frameworks such as Rails



This is actually the crucial part. If anyone has already looked into this, I would be grateful if you could share your findings.

That's all.
I hope this is helpful.
