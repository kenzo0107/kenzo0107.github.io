---
layout: post
title: "Kibana エラー対応 - Discover: An error occurred with your request. Reset your inputs and try again."
date: 2015-10-07
tags:
- Kibana
---

## 問題

ある日、Kibana > Discover にアクセスすると以下のようなエラー表示で
Searchingが完了できない状態に陥った。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151007/20151007120432.png" width="100%">
</div>

## ElasticSearchログ確認


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

キャストがうまくいってないバグ出てました。

マッピングがうまくいってないのかな？
と問題を想定して色々設定変更していたらここにたどり着いた。

## 解決

1. Kibana > Settings > Advanced
2. sort:options {"unmapped_type": "boolean"} → {"ummapped_type": "date" } に変更

これで治った！


GithubでもClose Issueとして残ってましたね。

[Auto detect field type when sorting on unmapped_type fields](https://github.com/elastic/kibana/issues/4593)
