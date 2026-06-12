---
layout: post
title: Searching in the Kibana4 Search Bar with Regular Expression Pattern Matching and More
date: 2015-11-24
lang: en
translation_id: kibana-regex-pattern-match
permalink: en/2015/11/24/kibana-regex-pattern-match/
tags:
  - Kibana
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151124/20151124123137.png
---

## Overview

We aggregate access logs with fluentd,
store them in ElasticSearch, and display that data in Kibana.

In the past, whenever we wanted to do a bit of access log analysis,
we had to go through the process of logging into the server via SSH
and running commands to search.

But by searching in Kibana,
searching became smooth without having to log in to the server.

There were no more mistaken operations from remote logins,
and we could also narrow the scope of who has access to production environment accounts,
so the benefits piled up.

In practice, even after building it out, there were quite a few cases
where the people using it didn't know how to search,
so I've put together a quick summary of how to search in the Kibana4 search bar.

## Prerequisites

- Kibana4
- Assume the following domain name:

`http(s)://hogehoge.jp`

### Range Specification

- Search for HTTP status codes from 200 to 400

status: [200 TO 400]

### Negation

- Example) Search for referers other than a specified domain
- For the `referer` field, search using regular expression negation (NOT) pattern matching.

```
NOT referer:/http(s?)\:\/\/hogehoge\.jp\/(.*)/
```

### Compound Search

- Example) Other than a specified domain, AND status 200

```
NOT referer:/http(s?)\:\/\/hogehoge\.jp\/(.*)/ AND status:200
```

I'll add more examples as cases come up.
