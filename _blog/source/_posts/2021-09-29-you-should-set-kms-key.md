---
title: AWS KMS キーを設定する意味を考える
category: AWS
tags:
- AWS
date: 2021-09-29
---

`aws_rds_cluster` の `kms_key_id` は `Optional` (任意) ですが、
これを設定するとどんなメリットがあるか考えたいと思います。

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

```
resource "aws_kms_key" "rds" {
  enable_key_rotation = true
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

resource "aws_rds_cluster" "db" {
    kms_key_id        = aws_kms_key.rds.arn
}
```

## kms_key_id とは？

`kms_key_id` は terraform の公式ドキュメントにもある通り、ストレージを暗号化する際に必須です。

https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/rds_cluster#kms_key_id
> (Optional) The ARN for the KMS encryption key. When specifying kms_key_id, storage_encrypted needs to be set to true.

## ストレージを暗号化する理由

ストレージを暗号化する理由は、仮に物理的にストレージを持ち出されても、設定している KMS キーがないと復号できず、データの保護ができます。

## 廃棄証明にもなる

以下 AWS のドキュメントを読むとこんな一文があります。
https://aws.amazon.com/jp/blogs/news/data_disposal/

> 暗号化を活用したデータの保護と廃棄記録

ストレージを独自 KMS キーで暗号化しておくことで、
その鍵へのアクセスをポリシーで制御・記録でき、
さらに、鍵自体を廃棄することで、データへのアクセス自体をできなくさせる、ということです。

これにより廃棄証明ができます。

## まとめ

独自管理の KMS キーを設定しておく意味は以下理由がありました。

* データ保護
  * ストレージを暗号化しストレージ持ち出しされても復号できない様にする
* アクセスの制御・記録
  * ポリシーでアクセス制御することで、アクセスの記録が取れる
* 廃棄証明
  * データへのアクセス自体を禁止できる為、廃棄証明になる

## 考えるに至った経緯

KMS キーの設定について考えるきっかけとなったのは、
顧客より「貴社 DB に個人情報が含まれる場合にサービスクローズ時に廃棄証明ができるか？」
という質問があったことです。

廃棄証明って DB 自体消すじゃダメ？と思ったのですが、論理上消してるだけな気もするし、AWS には残りそうな気もする...と思い深掘りしてみるとデータ保護以外にも色々な意味合いがあることに気づきました。

以上
参考になれば幸いです。
