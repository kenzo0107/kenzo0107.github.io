---
layout: post
title: "Fixing a Kibana Error - Discover: An error occurred with your request. Reset your inputs and try again."
date: 2015-10-07
category: Monitoring
lang: en
translation_id: kibana-error-discover-an-error-occured-with-your-request
permalink: en/2015/10/07/kibana-error-discover-an-error-occured-with-your-request/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151007/20151007120432.png
tags:
- Kibana
---

## Problem

One day, when I accessed Kibana > Discover, I ran into the following error,
and Searching could no longer complete.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151007/20151007120432.png" width="100%">
</div>

## Checking the ElasticSearch logs


```
tail -f /var/log/elasticsearch/elasticsearch.log

Failed to execute [org.elasticsearch.action.search.SearchRequest@8307e49] while moving to second phase
java.lang.ClassCastException: java.lang.Long cannot be cast to org.apache.lucene.util.BytesRef
        at org.apache.lucene.search.FieldComparator$TermOrdValComparator.compareValues(FieldComparator.java:902)
        at org.apache.lucene.search.TopDocs$MergeSortQueue.lessThan(TopDocs.java:172)
        at org.apache.lucene.search.TopDocs$MergeSortQueue.lessThan(TopDocs.java:120)
        at org.apache.lucene.util.PriorityQueue.upHeap(PriorityQueue.java:225)
        at org.apache.lucene.util.PriorityQueue.add(PriorityQueue.java:133)
        at org.apache.lucene.search.TopDocs.merge(TopDocs.java:234)
        at org.elasticsearch.search.controller.SearchPhaseController.sortDocs(SearchPhaseController.java:239)
        at org.elasticsearch.action.search.type.TransportSearchQueryThenFetchAction$AsyncAction.moveToSecondPhase(TransportSearchQueryThenFetchAction.java:89)
        at org.elasticsearch.action.search.type.TransportSearchTypeAction$BaseAsyncAction.innerMoveToSecondPhase(TransportSearchTypeAction.java:403)
        at org.elasticsearch.action.search.type.TransportSearchTypeAction$BaseAsyncAction.onFirstPhaseResult(TransportSearchTypeAction.java:202)
        at org.elasticsearch.action.search.type.TransportSearchTypeAction$BaseAsyncAction$1.onResult(TransportSearchTypeAction.java:178)
        at org.elasticsearch.action.search.type.TransportSearchTypeAction$BaseAsyncAction$1.onResult(TransportSearchTypeAction.java:175)
        at org.elasticsearch.search.action.SearchServiceTransportAction$23.run(SearchServiceTransportAction.java:568)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:615)
        at java.lang.Thread.run(Thread.java:745)
```

It turned out to be a bug where a cast was failing.

I figured maybe the mapping wasn't working correctly,
so I started changing various settings under that assumption and eventually arrived at this fix.

## Solution

1. Kibana > Settings > Advanced
2. Change sort:options from {"unmapped_type": "boolean"} to {"ummapped_type": "date" }

That fixed it!


It was also recorded on GitHub as a closed issue.

[Auto detect field type when sorting on unmapped_type fields](https://github.com/elastic/kibana/issues/4593)
