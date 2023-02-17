---
title: RDS DB メンテ回避方法
date: 2023-02-17
category: AWS
cover: https://i.imgur.com/7h0nRNw.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

RDS で突如として対応必須のメンテナンスが現れた時にメンテ延期した方法をまとめました。

<!-- more -->

## 概要

突如として `2 日後` に自動適用される DB エンジンバージョンアップのメンテナンスが現れました。

通常であれば AWS からの 1 ヶ月以上前に事前の通知メールがあり、余裕を持って対応できたいたのですが、あまりに突然で回避方法を AWS SA さんやサポートに問い合わせました。

## 結論

メンテナンスウィンドウを変更することで延期することができました。

元々の `Apply date` が `2023-02-19 04:30` です。

`2023年2月17日 金曜日` とすると
次回メンテナンスウィンドウを現在日より前の `木曜日` に変更します。

terraform では以下のような修正です。

```
- maintenance_window = "sat:19:30-thu:20:00"
+ maintenance_window = "thu:19:30-thu:20:00"
```

![](https://i.imgur.com/8kiXsyT.png)

すると `Apply date` が `2023年2月24日 木曜日` に変更されました。

### aws-cli でも確認

![](https://i.imgur.com/IXctjg7.png)

`aws rds describe-pending-maintenance-actions` を実施した所、
`AutoAppliedAfterDate` や `CurrentApplyDate` が無事更新されており、
`ForceApplyDate` もなかったことから
無事メンテが延期されたことを確認しました。

SA さんに念の為、確認した所、問題なさそうとのことでした。

## AWS ドキュメントでメンテ延期方法の記載があったが...

[メンテナンスアクションを延期する](https://aws.amazon.com/jp/premiumsupport/knowledge-center/rds-maintenance-window/#Defer_maintenance_actions)

上記参考に実施しようとしたところ、 Action のメニューに「アップグレードを延期」(Defer upgrade) はありませんでした。

※ 英語版のドキュメントでもなかったです。

これについての AWS SA さんの回答は以下の通りでした。

> ちょっと私も自分の環境で再現ができておらず、ドキュメントも見つけられていないのですが、適用できるケースとできないケースがあるのかも知れません。
> すでにスタートした Upgrade は延期できない、とは明記されているのですが(明確なお答えができずすみません)

今回の件では適用できないケースだったのかもしれません。

## 突発的なメンテは起こり得るものなのか？ また検知方法は？

AWS の回答としては以下の通りです。

> パッチの緊急性ほか、複数の要素によって、余裕を持って通知されるケースもあれば、事前通知がない状態で突然スケジュールされるケースもある

> 社内でも確認しましたが、あいにく ○ 日前までに通知する、といった明確な SLA はない

もしメンテナンスのメール通知だけ信じていたら危うく意図せぬサービスダウンが発生していた所でした。

## 検知方法

EventBridge でメンテイベントの検知 →Chatbot の仕組みは手っ取り早いと思います。

{% linkPreview https://blog.serverworks.co.jp/aws-health-event-to-slack-via-aws-chatbot _blank %}

私自身はメンテイベントの詳細が把握しづらいので Lambda で整形してから Slack 通知する様にしています。
Lambda は日次で実行し、メンテイベントが消えるまで通知し続ける様にしています。

以上
参考になれば幸いです。
