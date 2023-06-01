---
title: AWS Savings Plans Coverage API 実行時に DataUnavailableException エラーが発生する
date: 2023-06-01
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## 概要

AWS Savings Plans Coverage API 実行時に DataUnavailableException エラーが発生しました。

```console
$ aws ce get-savings-plans-coverage --time-period Start=2023-05-31,End=2023-06-01 --group-by Type=DIMENSION,Key=INSTANCE_TYPE_FAMILY Type=DIMENSION,Key=REGION Type=DIMENSION,Key=SERVICE

An error occurred (DataUnavailableException) when calling the GetSavingsPlansCoverage operation:
```

発生する条件を AWS サポートに確認しました。

## サポートの回答

「対象期間について Savings Plans 適用対象サービスを使用していない場合、上記エラーが発生する」
とのこと。

## Cost Explorer で確認

Cost Explorer で Savings Plans > Coverage report にも以下メッセージがありました。

> No savings plans coverage data was returned for this time period. Please adjust the time period or filters if this seems incorrect.」

![](https://i.imgur.com/ztLP9oV.png)

## まとめ

Savings Plans カバレッジ取得時に DataUnavailableException エラーが発生する
= Savings Plans 適用対象サービスを使用していない
= Savings Plans を買う必要がない

ということでした。

以上
参考になれば幸いです。
