---
title: Terraform ベストプラクティス 2020 春 ~moduleやめてみた~
category: Terraform
tags:
  - Terraform
toc: true
date: 2020-04-25
cover: https://i.imgur.com/PRuN9u8.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## 概要

`#InfraStudy` に刺激を受け、書きます！

2019 年に以下記事を書いてから早 1 年、terraform 運用歴を重ね、2020 年春のベストプラクティスを更新しました。

{% linkPreview https://kenzo0107.github.io/2019/04/17/2019-04-17-terraform-2019-workspace/ _blank %}

例によって、まず結論、

<!-- more -->

## 結論

- module やめてみた

↓ これをやめて、

```
.
├──envs/
│   ├── bootstrap/
│   ├── prd/
│   └── stg/
│
└──modules
    ├── bootstrap/
    ├── common/
    ├── prd/
    └── stg/
```

↓ これにした！

```
.
└──envs/
    ├── bootstrap/
    ├── prd/
    └── stg/
```

## module やめてみた

一般的な Web サービスを構築する際に module を利用した時は以下の様に構成にしていました。

```
.
├──envs/
│   ├── bootstrap/
│   ├── prd/
│   └── stg/
│
└──modules
    ├── bootstrap/
    ├── common/
    ├── prd/
    └── stg/
```

bootstrap は tfstate や Lock 管理用 DynamoDB を作成します。

`modules/common` は、 `modules/stg`, `modules/prd` で共通で作成するリソースが置かれます。

- 例: ログ保存用の S3 Bucket

`Don't Repeat Yourself` の精神で重複を避ける狙いがありました。

ですが、この構成にした場合、運用上問題が生じました。

### これ modules/stg, modules/common どっち？ 問題

modules/common/s3.tf で以下の様に S3 Bucket を管理しているとします

```terraform
resource "aws_s3_bucket" "assets" {
  bucket = "${var.env}.${var.service_name}.assets"

  cors_rule {
    max_age_seconds = 3000
  }
}
```

ここで stg のみ検証の為、 max_age_seconds = 0 にしたい、としたらどうすると良いでしょう？

`var.env == stg ? 1 : 0` は以前にも書きましたが、脳内リソースの消費が激しくなるので使うのを避けたいです。

modules/stg/iam.tf, modules/prd/iam.tf で処理を分ける、
という案ならできそうです。

- modules/stg/s3.tf

```
resource "aws_s3_bucket" "assets" {
  bucket = "${var.env}.${var.service_name}.assets"

  cors_rule {
    max_age_seconds = 0
  }
}
```

- modules/prd/s3.tf

```
resource "aws_s3_bucket" "assets" {
  bucket = "${var.env}.${var.service_name}.assets"

  cors_rule {
    max_age_seconds = 3000
  }
}
```

これで `var.env == stg ? 1 : 0` を回避しコード上は回避できました。

但し、お気づきの通り、 tfstate の更新が必要です。

```sh
cd envs/stg
terraform state rm module.common.aws_s3_bucket.assets
terraform import module.stg.aws_s3_bucket.assets stg-hoge-assets

cd envs/prd
terraform state rm module.common.aws_s3_bucket.assets
terraform import module.prd.aws_s3_bucket.assets stg-hoge-assets
```

例では 1 resource のみなので、この程度ですが、複数リソースがある場合は、
複数リソースの state 削除 × 2 (stg,prd) となり、 state の更新処理が非常に面倒です。

コード的にも `var.env == stg ? 1 : 0` 避けたものの DRY は避けられていない。

## そもそも何故分けた？

modules/common が再利用性がある、とし採用しました。

ですが、例題の様に、再利用性がなくなった時のコストが大きく、また、発生しやすいことが運用でわかりました。

## だから module やめてみた

同じサービスで stg, prd で再利用性を求める必要が少なく、むしろ、その構成に大きく差分が生じやすい方が運用しやすいことがわかった為、
最初の結論の構成としました。

```
.
└──envs/
    ├── bootstrap/
    ├── prd/
    └── stg/
```

## module が便利な例

とはいえ、 module の再利用性が発揮される効果は十分にあります。

例: 複数 AWS Account での IAM 管理

AWS Account a,b,c,d,e と複数所持し、
基本、開発者は a で IAM User を発行し、
他 b ~ e は a からスイッチロールできる様、 Role に紐付けする際には便利です。

```
.
├──envs/
│   ├── a/
│   ├── b/
│   ├── c/
│   ├── d/
│   └── e/
│
└──modules
    ├── backend/
    ├── iam_user/
    └── iam_role/
```

- env/a/main.tf

```
module "backend" {
  source = "../../modules/backend"
  ...
}

module "iam_user" {
  source = "../../modules/iam_user"
  ...
}
```

- env/b/main.tf

```
module "backend" {
  source = "../../modules/backend"
  ...
}

// Switch Role へ紐付け
module "iam_role" {
  source = "../../modules/iam_user"
  ...
}
```

再利用性がむしろ求められ、 module と相性がとても良いことがわかりました。

## ベストプラクティスを探す旅は続く

運用してみて気付く問題があり、またそれを乗り越える度にまた新たな問題に出会います。

ここ最近は 「terraform プロジェクトで Pull Request のレビュー依頼する時についついファイル数盛り盛りになっちゃう問題」がありました w

「お互いに知ってるいつもの構成だから」という甘い考えがあるとついつい攻撃的なファイル数になっちゃったり。

人のリソースを無為に奪ってしまう行為でもあるので、`git cherry-pick` して小分けにする様、レビューしやすさも大事な要素だなと考えています。

また、 GitHub Actions で terraform init, plan, fmt を実行し実行結果を PR コメントに追記することで、plan 情報の確認をしやすくしたり、 fmt の違反行為で失敗させたりしています。

- .github/workflows/terraform.yml

```
---
name: Terraform
on: [pull_request]

env:
  TF_VERSION: 0.12.24
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

jobs:
  plan:
    name: Plan

    strategy:
      matrix:
        env: [stg, prd]

    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repo
        uses: actions/checkout@v2

      - name: Terraform Init
        uses: hashicorp/terraform-github-actions@master
        with:
          tf_actions_version: ${{ env.TF_VERSION }}
          tf_actions_subcommand: 'init'
          tf_actions_working_dir: 'envs/${{ matrix.env }}'
          tf_actions_comment: 'true'

      - name: Terraform Plan
        uses: hashicorp/terraform-github-actions@master
        with:
          tf_actions_version: ${{ env.TF_VERSION }}
          tf_actions_subcommand: 'plan'
          tf_actions_working_dir: 'envs/${{ matrix.env }}'
          tf_actions_comment: 'true'
          args: '-lock=false'

  fmt:
    name: Format

    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repo
        uses: actions/checkout@v2

      - name: 'Terraform Format'
        uses: hashicorp/terraform-github-actions@master
        with:
          tf_actions_version: ${{ env.TF_VERSION }}
          tf_actions_subcommand: 'fmt'
          tf_actions_comment: 'true'
```

以上
参考になれば幸いです。
