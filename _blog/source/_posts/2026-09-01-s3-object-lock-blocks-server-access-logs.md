---
title: S3 サーバーアクセスログは Object Lock の Retention が設定されたバケットに配信できない
date: 2026-09-01
lang: ja
translation_id: s3-object-lock-blocks-server-access-logs
cover: /img/cover/2026-09-01-s3-object-lock-blocks-server-access-logs.svg
categories:
- [AWS]
- [Terraform]
tags:
- AWS
- S3
- Object Lock
- Terraform
- ログ
- セキュリティ
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

ログ保存用の S3 バケットに Object Lock のデフォルト Retention（改竄防止）を設定していると、そのバケットには **S3 サーバーアクセスログを配信できません**。

厄介なのは、設定自体は普通に通ってしまうことです。Terraform の `apply` は成功し、コンソールでも配信先として指定でき、エラーも通知も出ません。ただログが届かないだけです。ログバケットを改竄防止付きで作り直すときに踏みそうなので、備忘録として残します。

※ 本記事は **2026年9月1日時点**の内容です。バージョン依存の記述は Terraform 1.15.8 / `hashicorp/aws` **6.62.0**（2026年8月26日リリース、執筆時点の最新）を前提としています。この制約は S3 側の仕様なので provider のバージョンには依存しませんが、`aws_s3_bucket_logging` は最新の 6.62.0 でも配信先の Object Lock 設定を検証せず [PutBucketLogging](https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketLogging.html) を呼ぶだけであることを [bucket_logging.go](https://github.com/hashicorp/terraform-provider-aws/blob/v6.62.0/internal/service/s3/bucket_logging.go) で確認しました。**provider 側で弾かれることは期待できません**。

<!-- more -->

## 結論

| 項目 | 内容 |
| --- | --- |
| 制約 | Object Lock 有効（デフォルト Retention 設定済み）のバケットは S3 サーバーアクセスログの配信先にできない |
| 挙動 | エラーも通知もなく、ログが届かない |
| 原因 | Retention が付くオブジェクトの `PutObject` は `Content-MD5` か checksum ヘッダが必須（推察） |
| 影響範囲 | S3 サーバーアクセスログのみ。ELB / CloudFront / VPC フローログは影響を受けない |
| 対処 | S3 サーバーアクセスログ専用の Object Lock なしバケットを分ける、または CloudWatch Logs へ配信する |

## 公式ドキュメントの記載

[Enabling Amazon S3 server access logging](https://docs.aws.amazon.com/AmazonS3/latest/userguide/enable-server-access-logging.html) の Important に明記されています。

> S3 buckets that have S3 Object Lock enabled can't be used as destination buckets for server access logs. Your destination bucket must not have a default retention period configuration.

[Object Lock considerations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-managing.html) 側にも同じ制約が書かれています。

> S3 buckets with Object Lock can't be used as destination buckets for server access logs.

なお、この2文は**微妙に条件が違って読めます**。1文目の前半は「Object Lock が有効なバケットは不可」、後半は「デフォルト Retention の設定があってはならない」です。Object Lock は有効だがデフォルト Retention は未設定、というバケットが使えるのかどうかは、公式ドキュメントからは読み取れませんでした。安全側に倒して、**サーバーアクセスログの配信先には Object Lock を一切設定しない**方針にしています。

## なぜ配信できないのか

Retention が付いた状態でオブジェクトをアップロードするには、整合性チェック用のヘッダが必須である旨が [Object Lock considerations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-managing.html) に記載されています。

> If you use the PutObject API you must specify the `Content-MD5` header, the `x-amz-sdk-checksum-algorithm` header, or both to configure the Object Lock retention period.

デフォルト Retention が設定されたバケットでは、この条件がすべての `PutObject` に掛かります。ログ配信サービス（`logging.s3.amazonaws.com`）がこれらのヘッダを付けているかどうかは公開情報から確認できなかったため断定はできませんが、**付けていないために PUT が成立しない**、というのが素直な説明だと考えています。

## 一番怖いのは、失敗が見えないこと

S3 サーバーアクセスログの配信は best-effort であることが公式に明記されています。

> The completeness and timeliness of server logging is not guaranteed. The log record for a particular request might be delivered long after the request was actually processed, or *it might not be delivered at all*.
>
> — [Logging requests with server access logging](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ServerLogs.html)

つまり「ログが来ない」は仕様の範囲内の挙動として扱われ、配信失敗が例外として表に出てきません。設定作業のどの段階でも弾かれないため、**監査でログを見に行ったときに初めて欠落に気づく**ことになります。実際、ログバケット側の ACL に LogDelivery グループの `WRITE` / `READ_ACP` を付けていて「権限は正しく設定されている」ように見えていても、Retention があると受け取れていません。見かけ上だけ有効になっている状態です。

確認は、配信先の prefix に実際にオブジェクトが増えているかを見るのが確実です。配信は数時間かかることがあるので、設定直後に見て空でも慌てないようにします。

```console
$ aws s3 ls s3://prd.example.logs/s3/prd.example.images/ --recursive | tail
```

## 対処: バケットを分ける

改竄防止は維持したいので、Object Lock 付きのログ保存用バケットと、S3 サーバーアクセスログ専用の Object Lock なしバケットの2つに分けました。ELB / CloudFront / VPC フローログは Retention の影響を受けずに配信できているため、分離するのは S3 サーバーアクセスログだけで済みます。

```hcl
# ログ保存用: Object Lock のデフォルト Retention で改竄防止
resource "aws_s3_bucket" "logs" {
  bucket              = "prd.example.logs"
  object_lock_enabled = true
}

resource "aws_s3_bucket_object_lock_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    default_retention {
      mode = "GOVERNANCE"
      days = 400
    }
  }
}

# S3 サーバーアクセスログ用: Object Lock なし
resource "aws_s3_bucket" "s3_access_logs" {
  bucket = "prd.example.s3-access-logs"
}

resource "aws_s3_bucket_logging" "images" {
  bucket = aws_s3_bucket.images.id

  # NOTE: S3 サーバーアクセスログは Object Lock なしの専用バケットへ配信する
  target_bucket = aws_s3_bucket.s3_access_logs.id
  target_prefix = "s3/${aws_s3_bucket.images.id}/"
}
```

配信の許可は、ACL ではなくバケットポリシーで与えます。新規バケットは ACL 無効（`BucketOwnerEnforced`）がデフォルトかつ AWS の推奨で、この場合 ACL では許可できません。

```hcl
data "aws_iam_policy_document" "s3_access_logs" {
  statement {
    sid    = "S3ServerAccessLogsPolicy"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["logging.s3.amazonaws.com"]
    }

    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.s3_access_logs.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}
```

### 配信先バケットの制約（Object Lock 以外）

同じドキュメントに並んでいる制約もまとめて満たしておく必要があります。

- 配信元バケットと**同一リージョン・同一アカウント**であること
- **SSE-KMS ではなく SSE-S3** であること。SSE-KMS だと、自分が使えない鍵で暗号化されたログが配信される可能性がある
- **Requester Pays** が有効でないこと
- 配信先バケット自身のサーバーアクセスログは有効にしないこと（配信先を配信元と同じにすると無限ループになる）

### 既存バケットで Object Lock を外したい場合

`object_lock_enabled` は**バケット作成後に無効化できません**。デフォルト Retention（`aws_s3_bucket_object_lock_configuration`）だけを外すことはできますが、Object Lock 自体を無効化したい場合はバケットの作り直しが必要です。既存のログバケットへ改竄防止を後付けする場合は、この点も踏まえて最初から2バケット構成にしておくのが無難だと思います。

## 代替案: CloudWatch Logs へ配信する

S3 サーバーアクセスログは、S3 バケット以外に **CloudWatch Logs へ配信する**選択肢もあります（[Delivering server access logs to CloudWatch Logs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/sal-cw-enabling.html)）。Object Lock の制約は「S3 バケットを配信先にした場合」の話なので、こちらを選べばそもそも衝突しません。

- CloudWatch Logs Insights で直接クエリできる
- クロスアカウント / クロスリージョンの集約ができる
- KMS で暗号化できる（S3 配信は SSE-S3 のみ）

ただし CloudWatch の vended logs 料金が掛かります。既存のログを S3 に集約している構成であればバケットを分ける方が素直で、今回はそちらを選びました。

## まとめ

- Object Lock のデフォルト Retention が設定されたバケットには、S3 サーバーアクセスログを配信できない
- 失敗はエラーにも通知にもならず、ログが静かに欠落する。ACL やバケットポリシーが正しく見えていても受け取れていない
- 影響を受けるのは S3 サーバーアクセスログだけで、ELB / CloudFront / VPC フローログは Object Lock 付きバケットへ配信できている
- 改竄防止を維持したままなら「Object Lock 付きのログバケット」と「Object Lock なしの S3 アクセスログ専用バケット」に分けるのが素直
- `object_lock_enabled` は後から無効化できないので、バケット設計の時点で分けておく

参考になれば幸いです。

## 参考

- [Enabling Amazon S3 server access logging](https://docs.aws.amazon.com/AmazonS3/latest/userguide/enable-server-access-logging.html)
- [Logging requests with server access logging](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ServerLogs.html)
- [Object Lock considerations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-managing.html)
- [Delivering server access logs to CloudWatch Logs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/sal-cw-enabling.html)
- [Controlling ownership of objects and disabling ACLs for your bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/about-object-ownership.html)
