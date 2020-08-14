---
title: AWS S3 Bucket の特定フォルダ以下を社外に共有する際のポイント
category: Terraform
tags:
- AWS
date: 2020-08-13
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## 概要

AWS S3 Bucket の特定パスを社外に共有する際のポイントをまとめました。

<!-- more -->

## 共有方法案

共有方法案として以下 3 案を考えました。

### 案1. A 社の所有するストレージのアップロード権限をいただく

こちらの S3 Bucket `hoge.share` へのアクセス許可設定を追加することなく、弊社からオブジェクトをアップロードする。

* メリット
  * こちらの S3 Bucket へのアクセス許可設定を追加することなくセキュア。
  * 共有したくないオブジェクトをこちら都合で精査できる。
* デメリット
  * オブジェクトアップロードする作業コストが発生。
  * オブジェクト数が多いと時間が掛かる。
  * A社のストレージが S3 なら Bucket コピーが使えるが、そうでない場合、一度ダウンロードする作業コストが掛かる。

### 案2. ROM に入れてお渡し

一度ダウンロードして CD-ROM に入れて A 社にお渡し。

（監査で ROM に入れてお渡し、と指示されることが過去ありました）

* メリット
  * 案1 と近しいが、インターネットを経由しないという点でよりセキュア
* デメリット
  * オブジェクト数が多いと時間が掛かる
  * 共有頻度が高くなると発送手続きが多くなり、その作業コストが掛かる。

### 案3. A 社から弊社 S3 Bucket へのアクセスを許可する

* メリット
  * 弊社作業コストが少なく済む。こちらはアクセス権限を付与するのみ
* デメリット
  * A 社の作業工数が高くなる。

案1 がセキュアで良さそうです。

自分が実際のタスクで対応したのは 案3 でした。
その際は、期日が非常に短く、こちらの作業コストがかけられないというビジネス的な事情からでした。

案3について、検討したことを結論からまとめていきます。

## 結論: 共有するオブジェクトが既知かどうかで付与する権限が変わる。

ユースケースとして、弊社の S3 Bucket `hoge.share` の特定パス `aaa/bbb` 以下のオブジェクトを A 社に共有するとします。

### A社と共有するファイルが既知である場合

A 社と共有するファイルが毎回 `hoge.share` の `aaa/bbb/c.gz` と取り決めがある場合、以下の様なポリシーで A 社の ip 制限ができます。

```json
{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Effect":"Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::hoge.share/aaa/bbb/c.gz"],
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": ["<A社IP>/32"]
        }
      }
    }
  ]
}
```

A社IP から以下コマンドでダウンロードが可能です。

```sh
curl https://s3-ap-northeast-1.amazonaws.com/hoge.share/aaa/bbb/c.gz --output c.gz
```

### A社と共有するファイルが不特定の場合

* A社用の IAM User (無権限)で作成
* S3 Bucket ポリシーで A社IP で制限し、 A社用 IAM User に対し `s3:GetObject` `s3:ListBucket` を許可

#### 上記実装に至った経緯

`aaa/bbb/` 以下のオブジェクト全てを共有する、という様な場合に以下の様な `curl` でワイルドカードを指定して一括ダウンロードはできません。

```sh
curl https://s3-ap-northeast-1.amazonaws.com/hoge.share/aaa/bbb/*
```

一括ダウンロードする際には `s3:ListBucket` 権限が必要で、それをサポートする方法が IP 許可だけでは実現できませんでした。

例) 一括ダウンロードするコマンド
```
aws s3 cp --recusive s3://hoge.share/aaa/bbb/ .
```

A社用の IAM User の作成時には無権限とし、 S3 Bucket Policy で明示的な A社用 IAM User のアクセス許可を定義しています。

```json
{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Effect":"Allow",
      "Principal": {
        "AWS": ["<A 社用 IAM User ARN>"]
      },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::hoge.share/aaa/bbb/*"],
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": ["<A社IP>/32"]
        }
      }
    },
    {
      "Effect":"Allow",
      "Principal": {
        "AWS": ["<A 社用 IAM User ARN>"]
      },
      "Action": ["s3:ListBucket"],
      "Resource": ["arn:aws:s3:::hoge.share"],
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": ["<A社IP>/32"]
        },
        "StringLike": {
          "s3:prefix": ["aaa/bbb/*"]
        }
      }
    }
  ]
}
```

また、考慮すべき点として、
`hoge.share` へのアクセスログを別途担保する必要があります。

それも含め、対応をまとめたものを Terraform でまとめました。

{% gist kenzo0107/fef3f4127e9ac4a6af3030b1d60689f1 %}

## まとめ

S3 Bucket の特定フォルダ以下を共有する方法を改めて検討してみて
いろいろな方法があるなと思いました。

共有先との関係性によってもメリット・デメリットがあろうかと思います。

こんな良い方法があるよ！という連絡お待ちしています m(_ _)m
