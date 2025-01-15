---
title: Datadog 子組織の削除方法
category: Datadog
date: 2025-01-15
---

備忘録として
Datadog の子組織の削除方法をまとめます。

## 手順

1. 監視や API Key, Application Key を削除
  - 監視が残っていると削除できない場合があります。
  - API Key を削除することで API Key を利用した Datadog Agent からのデータ収集ができなくなり、意図しないコストの発生を抑える意図があります。

2. サポートに連絡
  - 子組織を削除する API は存在せず、ドキュメントに記載のある通り、 Datadog サポートに連絡して削除する必要があります。
  - https://docs.datadoghq.com/ja/account_management/#%E7%B5%84%E7%B9%94%E3%81%AE%E3%82%A2%E3%82%AB%E3%82%A6%E3%83%B3%E3%83%88%E3%82%92%E7%84%A1%E5%8A%B9%E3%81%AB%E3%81%99%E3%82%8B
  - 子組織削除 API が存在しない為、 terraform-provider-datadog でも子組織を管理するリソースを削除しても子組織自体は残ってしまいます。

サポートの状況次第ですが、おおよそ 1週間程度で削除していただけました。

以上です。
