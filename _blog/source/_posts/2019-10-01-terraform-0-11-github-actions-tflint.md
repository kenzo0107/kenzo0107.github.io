---
layout: post
title: terraform 0.11 系に対応した GitHub Actions 作った &  tflint も入れてみた♪
date: 2019-10-01
category: Terraform
tags:
- Terraform
---

## 概要

Terraform 用の GitHub Actions として hashicorp 社にて以下リポジトリが用意されています。

[hashicorp/terraform-github-actions](https://github.com/hashicorp/terraform-github-actions)

ですが、上記のリポジトリでは、 terraform の最新版 (2019-09-30 時点 0.12.9) にのみ適用しています。

hashicorp/terraform-github-actions を folk して
0.11 系がなかった為、 **0.11 系に対応した terraform-github-actions** を以下リポジトリに作成しました。

[kenzo0107/terraform-github-actions](https://github.com/kenzo0107/terraform-github-actions)

<!-- more -->

terraform の古いバージョンについての対応は、 terraform 公式に以下リンクにて記載があります。

[Terraform Versions - Terraform GitHub Actions - Terraform by HashiCorp](https://www.terraform.io/docs/github-actions/terraform-versions.html)

古いバージョンは folk して自分で作ってね♪ と書いてあります。

## ついでに

以下追加してみました。

* tflint 追加
* 実行するディレクトリを表示


## 使い方

以下のような terraform プロジェクトがあるとします。

```yml
├── envs
│   ├── prd
│   │   ├── backend.tf
│   │   ├── main.tf
│       ...
│   │   └── variable.tf
│   └── stg
│       ├── backend.tf
│       ├── main.tf
│       ...
│       └── variable.tf
└── modules
    ├── ...
```


## GitHub Actions 設定方法

以下 2 ファイルを root ディレクトリに配置します。


* .github/workflows/main.yml
* .github/workflows/fmt.yml


```
├── .github
│   └── workflows
│       ├── main.yml
│       └── fmt.yml
│
├── envs
│   ├── prd
│   │   ├── backend.tf
│   │   ├── main.tf
│       ...
│   │   └── variable.tf
│   └── stg
│       ├── backend.tf
│       ├── main.tf
│       ...
│       └── variable.tf
└── modules
    ├── ...
```

### .github/workflows/main.yml

```yml
name: Terraform
on: [pull_request]

jobs:
  on-pull-request:
    name: On Pull Request

    strategy:
      matrix:
        env: [stg, prd]

    runs-on: ubuntu-latest

    steps:
    - name: Checkout Repo
      uses: actions/checkout@v1

    - name: ${{ matrix.env }} Terraform Init
      uses: kenzo0107/terraform-github-actions/init@v0.6.0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        TF_ACTION_WORKING_DIR: './envs/${{ matrix.env }}'
        AWS_ACCESS_KEY_ID:  ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY:  ${{ secrets.AWS_SECRET_ACCESS_KEY }}

    - name: ${{ matrix.env }} Terraform Validate
      uses: kenzo0107/terraform-github-actions/validate@v0.6.0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        TF_ACTION_WORKING_DIR: './envs/${{ matrix.env }}'
        AWS_ACCESS_KEY_ID:  ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY:  ${{ secrets.AWS_SECRET_ACCESS_KEY }}

    - name: ${{ matrix.env }} Terraform Lint
      uses: kenzo0107/terraform-github-actions/lint@v0.6.0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        TF_ACTION_WORKING_DIR: './envs/${{ matrix.env }}'

    - name: ${{ matrix.env }} Terraform Plan
      uses: kenzo0107/terraform-github-actions/plan@v0.6.0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        TF_ACTION_WORKING_DIR: './envs/${{ matrix.env }}'
        AWS_ACCESS_KEY_ID:  ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY:  ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```


#### ちょっと解説

##### Pull Request をトリガーに実行されます。

```yml
on: [pull_request]
```


##### リポジトリをチェックアウト

```yml
    - name: Checkout Repo
      uses: actions/checkout@v1
```


##### matrix で stg, prd を並列実行します。

```yml
    strategy:
      matrix:
        env: [stg, prd]
```


##### terraform init, validate, lint, plan

```yml
    - name: ${{ matrix.env }} Terraform Init
...
    - name: ${{ matrix.env }} Terraform Validate
...
    - name: ${{ matrix.env }} Terraform Lint
...
    - name: ${{ matrix.env }} Terraform Plan
```


言わずもがな、以下を実行しています。


* terraform init
* terraform validate
* terraform lint
* terraform plan



`kenzo0107/terraform-github-actions/init@v0.6.0` が terraform v0.11.14 に対応しています。

init, validate, lint は指摘事項がある場合は、Pull Request にコメントしてくれます。

#### terraform plan は必ず実行結果を貼り付けてくれます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190930/20190930221527.png" width="100%">
</div>

これはレビュワーに有難い機能です。

コードの変更内容と `terraform plan` 内容の整合性が取れているかどうかが重要なレビュー観点となる為です。

##### 実行パス指定

パスを移動してから terraform plan 等を実行したい場合に以下環境変数に指定します。

```yml
TF_ACTION_WORKING_DIR: './envs/${{ matrix.env }}'
```


`kenzo0107/terraform-github-actions/plan@v0.6.0` では、
上記の設定した TF_ACTION_WORKING_DIR を terraform plan 実行内容と共に表示するようにしています。((`hashicorp/terraform-github-actions` では、実行したディレクトリパスは Pull Request コメントに乗らない様になってます。))

これは `terraform plan` 実行内容から stg, prd どちらで実行したかわかりずらく、レビュワーを困惑させる可能性がある為です。

##### secrets の設定

```yml
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
AWS_ACCESS_KEY_ID:  ${{ secrets.AWS_ACCESS_KEY_ID }}
AWS_SECRET_ACCESS_KEY:  ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```


secrets.GITHUB_TOKEN は secrets にトークンを設定する必要がありません。

個人的に GitHub が実行する CI/CD だからこそ実現できる秘匿性のある管理方法で、 Actions の大きな利点だと思います。

その他は、 `settings` > `secrets` で設定します。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190930/20190930223443.png" width="100%">
</div>

### .github/workflows/fmt.yml

`terraform fmt` を stg, prd 等は関係なく、リポジトリのルートディレクトリで実行するので
`.github/workflows/main.yml` とは分けました。

こちらも Pull Request をトリガーとして実行されます。

```yml
name: Terraform
on: [pull_request]

jobs:
  on-pull-request:
    name: On Pull Request

    runs-on: ubuntu-latest

    steps:
    - name: Checkout Repo
      uses: actions/checkout@v1

    - name: Terraform fmt
      uses: kenzo0107/terraform-github-actions/fmt@v0.6.0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```


## 総評

GitHub Actions に触れてみようとした題材として非常に簡易だったのでとっつきやすかったです。

そして何より、手間かけましたが、 0.12 系に対応した方が早かったかもしれない...

やんごとなき理由で 0.11 にしている場合以外は、最新に追従した方が良いですね♪

以上
参考になれば幸いです。
