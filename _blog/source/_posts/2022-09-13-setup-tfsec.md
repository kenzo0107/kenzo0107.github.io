---
title: tfsec で terraform 管理リソースのセキュリティ強化
date: 2022-09-13
cover: https://aquasecurity.github.io/tfsec/v0.63.1/imgs/homelogo.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

[tfsec](https://github.com/aquasecurity/tfsec) を使用し [Terraform](https://www.terraform.io/) で管理するリソースのセキュリティを強化する手順を記載します。

<!-- more -->

## ローカルに tfsec インストール

以下例では [asdf](https://github.com/asdf-vm/asdf) を利用し導入しています。
asdf は多数言語に対応しており、 rubyenv, nodenv, goenv の様な個々の言語のバージョン切り替えよりも同様の手順でバージョン切り替えが可能で有用です。

参考: https://github.com/woneill/asdf-tfsec

```console
asdf plugin-add tfsec https://github.com/woneill/asdf-tfsec

管理バージョン表示
asdf list all tfsec
...
1.27.4
1.27.5
1.27.6

asdf install tfsec 1.27.6

// ローカルの設定
asdf local tfsec 1.27.6

// 上記処理で .tool-versions に `tfsec 1.27.6` が追記される
cat .tool-versions
```

## 個々のリソースでルールを除外したいとき

各リソースで `tfsec:ignore` でルールを除外します。

```
resource "aws_lb" "dummy" {
  internal = false # tfsec:ignore:aws-elb-alb-not-public インターネットからのアクセスをする為、許容する
```

以下の様にリソースの上にコメントして追記しても除外が可能ですが、
複数ある場合に見づらくなる為、個人的には上記の各パラメータに設定する方が見通しが良くなると考えております。

```
# tfsec:ignore:aws-elb-alb-not-public インターネットからのアクセスをする為、許容する
resource "aws_lb" "dummy" {
  internal = false
```

## プロジェクト全体でルールを除外したいとき

参考: https://aquasecurity.github.io/tfsec/v1.27.6/getting-started/configuration/config/

.tfsec/config.yml を作成し、除外したいルールを追加します。
あくまでも以下はサンプルで、個々の運用によって除外ルールは変更してください。

```
---
exclude:
  # NOTE: IAM Policy で * (ワイルドカード) の使用を回避すると工数増となり対応が難しくなることが多い為、除外する
  - aws-iam-no-policy-wildcards

  # ALB を internet-facing で利用したい場合が主なので除外する
  - aws-elb-alb-not-public
```

```console
// tfsec 実行ディレクトリを ./envs/prd としています。
tfsec --config-file .tfsec/config.yml ./envs/prd
```

## GitHub Actions で実行する

Pull Request 作成時をトリガーに tfsec が実行される様になります。

```
name: tfsec

on: [pull_request]

jobs:
  tfsec:
    name: tfsec
    runs-on: ubuntu-latest
    timeout-minutes: 3

    strategy:
      fail-fast: false
      matrix:
        directory: ['envs/prd', 'envs/stg']

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Pick tfsec version
        id: tfsec
        run: echo ::set-output name=tfsec_version::$(grep tfsec .tool-versions| awk '{print $2}')

      - name: install tfsec
        run: |
          curl -L https://github.com/tfsec/tfsec/releases/download/v${{ steps.tfsec.outputs.tfsec_version }}/tfsec-linux-amd64 > /tmp/tfsec
          chmod +x /tmp/tfsec
          sudo mv /tmp/tfsec /usr/local/bin

      - name: Terraform security scan
        run: tfsec --config-file .tfsec/config.yml ${{ matrix.directory }}
```

## まとめ

tfsec を導入することで AWS Config 非準拠ルールへの対応の数多くが実行でき、よりセキュアなアーキテクチャ構築に寄与できます。
Pull Request で tfsec をパスしないとマージできない様にすることで運用ルールとして自動的に適用できるのでよりお勧めです。

そして、 SaaS のサービスは日々進化しており、 tfsec もそれに追従しています。
tfsec の定期的なバージョンアップが必須なのでお気をつけください。

以上
参考になれば幸いです。
