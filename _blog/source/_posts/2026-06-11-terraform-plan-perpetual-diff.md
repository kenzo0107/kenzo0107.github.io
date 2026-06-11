---
title: Terraform plan で毎回出る「意図しない差分」を消す
category: AWS
date: 2026-06-11
cover: /img/cover/2026-06-11-terraform-plan-perpetual-diff.svg
tags:
  - Terraform
  - AWS
  - S3
---

`terraform plan` を実行するたびに、誰も変更していないはずのリソースに差分が出続ける。
いわゆる **perpetual diff（恒久的差分）** に遭遇したことがある人は多いと思います。

放置すると地味に厄介で、

- 本当に変更したい差分が、ノイズに埋もれてレビューしづらくなる
- 「この差分は無視してOK」という暗黙知がチームに溜まり、属人化する
- `plan` がクリーンに通らないので、自動 apply の判断材料に使えない

今回は S3 バケットの暗号化設定で踏んだ perpetual diff を例に、原因と消し方を残しておきます。

<!-- more -->

## 何が起きていたか

S3 バケットのサーバーサイド暗号化（SSE）を設定するコードで、毎回 plan に差分が出続けていました。

```hcl
resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.this.arn
    }
    bucket_key_enabled = true
  }
}
```

一見問題なさそうですが、`plan` を打つと毎回こうなります。

```console
~ resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
    ~ rule {
        ~ apply_server_side_encryption_by_default {
            # (差分が出続ける)
          }
      }
  }
```

## 原因：provider のデフォルト値とコードのズレ

perpetual diff の典型パターンは **「provider / API 側のデフォルト値」と「コードに明示した値」がズレている** ケースです。

S3 の暗号化設定では、

- `sse_algorithm = "aws:kms"` を指定すると、AWS 側が **デフォルトで AWS マネージドキー（aws/s3）** を使う挙動になることがある
- そこにカスタム KMS キーの ARN を明示すると、状態の正規化（normalize）の仕方によって毎回 diff として検出される

といった噛み合わせが起こります。
ほかにも以下はよく perpetual diff を生みます。

- API が値を返さない / 空で返すフィールドを明示している
- AWS 側が自動付与するタグ・ポリシー文をコードでも書いている
- 順序が保証されない配列（IAM ポリシーの Statement など）を毎回並べ替えている

## 対処：不要なパラメータは「書かない」

結論はシンプルで、**AWS 側のデフォルトと同じ値なら、コードに書かない**のが一番効きます。

```hcl
resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.this.arn
    }
    # bucket_key_enabled はデフォルト挙動と一致していたため削除
  }
}
```

「明示しておいた方が親切では？」と思いがちですが、

- **明示した値が provider のデフォルトと一致しているだけ**なら、コードから消しても挙動は変わらない
- むしろ書いてあることで diff ノイズの原因になる

ので、`plan` がクリーンになる方を優先します。

## 切り分けの手順

perpetual diff を踏んだら、私はこの順番で見ています。

1. `terraform plan` の差分が **値の変更なのか、追加/削除なのか** を確認する
2. 該当リソースの [provider ドキュメント](https://registry.terraform.io/providers/hashicorp/aws/latest/docs) で **Optional フィールドのデフォルト値**を調べる
3. `terraform state show <resource>` で **実際に state に入っている値**を確認し、コードと突き合わせる
4. デフォルトと同値なら **コードから削除**、どうしても固定したいなら `lifecycle { ignore_changes = [...] }` を検討する

`ignore_changes` は最後の手段です。差分を「見えなくする」だけなので、まずは「そもそも書かない」で解決できないかを先に探す方が健全です。

## まとめ

- `terraform plan` の perpetual diff は **provider のデフォルト値とコードのズレ**で起きることが多い
- AWS 側のデフォルトと同じ値なら、**コードに書かない**のが最もクリーンな解決策
- `state show` とドキュメントで実値とデフォルトを突き合わせて切り分ける
- `ignore_changes` で隠すのは最後の手段

差分ノイズが減ると、レビューで「本当に意味のある変更」だけに集中できるようになります。地味ですが、運用してると効いてくる改善です。
