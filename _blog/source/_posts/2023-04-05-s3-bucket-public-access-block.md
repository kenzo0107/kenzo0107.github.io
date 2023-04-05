---
title: S3 のパブリックアクセスブロック有効後、無効にした際の S3 Object の ACL の挙動
date: 2023-04-05
category: AWS
cover: https://i.imgur.com/cEbTyJe.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## 概要

パブリックアクセスのブロックが無効となっている S3 Bucket で
パブリックアクセスのブロックを有効化しその後、無効化した際に
Object の ACL に影響があるか確認します。

## まず結論

公式ドキュメントに記載がある通りであることが確認できた。

ACL = public-read の S3 Object が
パブリックアクセスブロックを有効化するとパブリックアクセスが不可となり
その後、パブリックアクセスブロックを無効化するとパブリックアクセス可能となることが確認できた。

AWS コンソール上だとパブリックアクセスブロック有効化時に
Everyone Read の権限が消えるので一瞬ドキッとするが、
無効化した際に元に戻ることが確認できた。

## 公式ドキュメント参照

https://docs.aws.amazon.com/ja_jp/AmazonS3/latest/userguide/access-control-block-public-access.html

> ブロックパブリックアクセス設定は既存のポリシーまたは ACL を変更しません。そのため、ブロックパブリックアクセス設定を削除しても、パブリックポリシーまたは ACL を持つバケットまたはオブジェクトは再びパブリックにアクセス可能になります。

パブリックアクセスのブロックを有効化し、その後、無効にしてもオブジェクトの ACL には影響がない、
とのこと。

## 試すこと

1. パブリックアクセスブロック無効の S3 Bucket 作成
2. acl = public-read のファイルを S3 にアップロード
3. ファイルに S3 Object URL でアクセスできることを確認
4. S3 のパブリックアクセスブロックを有効化
5. ファイルに S3 Object URL でアクセスできないことを確認
6. S3 のパブリックアクセスブロックを無効化
7. ファイルに S3 Object URL でアクセスできることを確認

## 試してみた

<details><summary>terraform でテスト用の S3 Bucket 作成</summary>

```terraform
resource "aws_s3_bucket" "test" {
  bucket = "test-by-kenzo-tanaka"
}

resource "aws_s3_bucket_acl" "test" {
  bucket = aws_s3_bucket.test.id
  acl    = "private"
}

resource "aws_s3_bucket_versioning" "test" {
  bucket = aws_s3_bucket.test.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "test" {
  bucket = aws_s3_bucket.test.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3/${aws_s3_bucket.test.id}/"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "test" {
  bucket = aws_s3_bucket.test.bucket
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# パブリックアクセスのブロックを無効化した状態
resource "aws_s3_bucket_public_access_block" "test" {
  bucket = aws_s3_bucket.test.id

  ignore_public_acls      = false
  restrict_public_buckets = false
  block_public_acls       = false
  block_public_policy     = false
}
```

</details>

### acl = public-read でファイルアップロード

```bash
$ echo "public read" > public_read.txt

// acl=public-read (公開状態) で S3 に pubilc_read.txt をアップロード
$ aws s3 cp public_read.txt s3://test-by-kenzo-tanaka/ --acl public-read

$ echo "private" > private.txt

// acl=private (非公開状態) で S3 に private.txt をアップロード
$ aws s3 cp private.txt s3://test-by-kenzo-tanaka/ --acl private
```

acl = public-read とした場合誰でもアクセスできる公開状態であることを確認できる。

![](https://i.imgur.com/6jdIsrE.png)

![](https://i.imgur.com/eJnnwA4.png)

### S3 Object URL へのアクセス可否の確認

```bash
// acl = public-read にしているので S3 Object URL にアクセスできる
$ curl -I https://test-by-kenzo-tanaka.s3.ap-northeast-1.amazonaws.com/public_read.txt

HTTP/1.1 200 OK
...

// acl = private にしているので S3 Object URL にアクセスできない
$ curl -I https://test-by-kenzo-tanaka.s3.ap-northeast-1.amazonaws.com/private.txt

HTTP/1.1 403 Forbidden
...
```

### S3 パブリックアクセスブロックを有効化する

```terraform
resource "aws_s3_bucket_public_access_block" "test" {
  bucket = aws_s3_bucket.test.id

  ignore_public_acls      = true
  restrict_public_buckets = true
  block_public_acls       = true
  block_public_policy     = true
}
```

- パブリックアクセスブロックが有効化されたことを確認
  ![](https://i.imgur.com/Uf1JYsa.png)

- public_read.txt の Everyone の Read が消えている
  ![](https://i.imgur.com/8JtlgXd.png)

- private.txt は特に変わらず
  ![](https://i.imgur.com/45wN1Yt.png)

public_read.txt, private.txt いずれもアクセスを試みるも 403 Forbidden となることを確認

```bash
$ curl -I https://test-by-kenzo-tanaka.s3.ap-northeast-1.amazonaws.com/public_read.txt

HTTP/1.1 403 Forbidden
...

$ curl -I https://test-by-kenzo-tanaka.s3.ap-northeast-1.amazonaws.com/private.txt

HTTP/1.1 403 Forbidden
...
```

### 再び S3 パブリックアクセスブロックを無効化する

再度パブリックアクセスブロックを無効化する

```terraform
resource "aws_s3_bucket_public_access_block" "test" {
  bucket = aws_s3_bucket.test.id

  ignore_public_acls      = false
  restrict_public_buckets = false
  block_public_acls       = false
  block_public_policy     = false
}
```

- パブリックアクセスのブロックが無効化されたことを確認
  ![](https://i.imgur.com/cEbTyJe.png)

- public_read.txt の Everyone の Read が復活していることを確認
  ![](https://i.imgur.com/k5qPlMm.png)

- private.txt は変わらず
  ![](https://i.imgur.com/sCQv7F9.png)

public_read.txt はパブリックアクセスが可能となり
private.txt はパブリックアクセスが不可であることが確認できました。

```bash
$ curl -I https://test-by-kenzo-tanaka.s3.ap-northeast-1.amazonaws.com/public_read.txt

HTTP/1.1 200 OK
...

$ curl -I https://test-by-kenzo-tanaka.s3.ap-northeast-1.amazonaws.com/private.txt

HTTP/1.1 403 Forbidden
...
```

## 総評

結論に記載した通り、公式ドキュメントの通りであることが確認できました。

以上
参考になれば幸いです。
