---
title: AWS Bot 対策
date: 2022-11-29
category: AWS
---

AWS で CloudFront + ECS で Web サービスを配信していますが、
Bot が多く、その対策を WAF で実行しようとしたい際にいくつかつまづきましたので、その備忘録になります。

以下 2 点を試しました。

1. WAF v2 で GEO マッチステートメントで Bot のリクエスト元の海外 IP をブロック
2. WAF v2 Bot Control で Bot 対策

## WAF v2 で GEO マッチステートメントで対策

JP (日本) 以外をブロックしました。

```
resource "aws_wafv2_web_acl" "main" {
  # 日本以外をブロック
  rule {
    action {
      block {}
    }

    statement {
      not_statement {
        statement {
          geo_match_statement {
            country_codes = ["JP"]
          }
        }
      }
    }
```

すると、日本からアクセスしたにも関わらず、
日本外と判断され、ブロックされてしまった事象がありました。

その際はスマートフォン (docomo, au, softbank) でのアクセスでした。

誤検知があったのでこの方法は回避しました。

## WAF v2 Bot Control で Bot 対策

AWS Bot Control で bot 対策をしてみました。

こちらで現状特段大きな問題がないのですが、
AWS Bot Control を terraform で有効化しようとした際につまづいた点をまとめます。

### ManagedRuleGroupConfigs をサポートしていない

※2022-11-29 時点でサポートしておらず、 InspectionLevel の設定ができません。

https://github.com/hashicorp/terraform-provider-aws/issues/23290

```
{
  "Name": "AWS-AWSManagedRulesBotControlRuleSet",
  "Statement": {
    "ManagedRuleGroupStatement": {
      "VendorName": "AWS",
      "Name": "AWSManagedRulesBotControlRuleSet",
      "ManagedRuleGroupConfigs": [
        {
          "AWSManagedRulesBotControlRuleSet": {
            "InspectionLevel": "COMMON"
          }
        }
      ],
      ...
```

### Bot Control Rules をサポートしていない

※ 2022-11-29 時点

Bot Control Rules の設定をサポートしていないので、手動で設定等が必要です。

![](https://i.imgur.com/I66XH5J.png)

### Override rule group action はサポートしている

以下設定を `rule {}` ブロック内に設定すれば、検知モード (ブロック等せずカウントだけ実施する) にできます。

```
    override_action {
      count {}
    }
```

先述した [issue](https://github.com/hashicorp/terraform-provider-aws/issues/23290) で既に言及されているのでいずれサポートされると思います。

利用時には要注意です。

### local-exec で aws-cli からアップデートしちゃおうという猛者がいた

https://github.com/hashicorp/terraform-provider-aws/issues/23287

意図しない挙動があるとも否定できないので terraform で完結させたい。
shell スクリプトのテストや構文チェック等をするのも憚れる。

## 総評

rate limit やその他 SQLi, XSS を設定していたとしても
Bot が一時的に複数 IP 元からリクエストがあると防ぐことが難しいです。

GEO 制限で抑えられたら良かったのですが、リクエストの多いサービスの場合でご検知があると
それだけで商用環境での利用は憚れます。

Bot Control で検知モード (Count) で様子を見て、適宜ブロック設定をしていくのが安全でした。

以上
参考になれば幸いです。
