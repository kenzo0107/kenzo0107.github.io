---
layout: post
title: terraform workspace で環境毎に tfsate 管理
date: 2017-12-05
tags:
  - Terraform
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171205/20171205214728.jpg
---

terraform workspace で環境毎に tfsate 管理した話です。

## 追記 2019/04/17

追記時点で workspace は運用時点の問題が多くあった為、利用していません。以下記事ご参考いただければと思います。

{% linkPreview https://kenzo0107.github.io/2019/04/17/2019-04-17-terraform-2019-workspace/ _blank %}

## 概要

Terraform tfstate の管理をかつて
0.8 系では `-backend-config` でせっせと環境(stg,prod) 毎に bucket を変えて、
なんてコードを見てきました。

ですが、
workspace で 1 つの bucket に 環境毎に保管できる様になりました。

厳密には環境毎でなくとも
リソースの集合毎、module 毎等で管理するイメージですが

今回はイメージを捉えやすく環境毎で分けました。

## 歴史

- 0.5 で S3 で管理、
- < 0.9 では、 remote config で管理場所を設定
- > = 0.9 では、terraform workspace で同一ディレクトリで複数のリソース群を管理

とより利用しやすくなりました。

## 前提

以下条件とします。

- tfstate は backend.tf で s3 管理

## 移行手順

### 既存 terraform で tfstate 確認

- 想定の実行計画通りか確認します。
- 異なる場合は、そもそも現環境と差分が生じている、及び、tfstate が正しく取得できていない等、問題ありなのでそちらを修正します。

```
$ terraform plan
```

### tfstate ファイル取得

local に terraform.tfstate を取得します。
中身を確認してリソースの設定がある程度問題ないか確認しておきます。

- 0.8 系

```
$ terraform remote config \
-backend=s3 \
-backend-config="bucket=tfstate.bucket" \
-backend-config="key=terraform.tfstate" \
-backend-config="region=ap-northeast-1" \
-backend-config="profile=aws-hogehoge"
```

- 0.9 系以降

```
macOS%$ terraform state pull > terraform.tfstate
```

### terraform 0.11.x (2017 年 12 月現在最新) へバージョンアップ

Homebrew ならば upgrade で！

```
macOS%$ brew upgrade terraform
```

### state 管理を backent.tf で記述

既にこの様に設定されている方はスキップです。特に普遍的な書き方です。

```
terraform {
  backend "s3" {
      bucket  = "tfstate.bucket"
      key        = "terraform.tfstate"
      region   = "ap-northeast-1"
      encrypt = true
      profile   = "aws-hogehoge"
    }
}
```

## Workspace 作成

- Workspace `stg` 作成

```
$ terraform workspace new stg
```

- workspace リスト一覧

```
$ terraform workspace list
  default
* stg
```

## tfstate を push

```
$ terraform state push -force .terraform/terraform.tfstate
```

これで S3 `tfstate.bucket` の `env:/stg/` ディレクトリ以下に terraform.tfstate が push されました。
実際に S3 を見て確認してみてください。

![](https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171205/20171205213108.png)

`env` でなく `env:` なのが肝です。

## 実行計画確認

```
$ terraform plan
```

想定の実行計画通りか確認して問題なければ移行完了です。

## おまけ

terraform を指定したバージョンで実行するには
one-off Container で実行できる様に Makefile でラップする、
が今の所自分の中のベストプラクティスです。

これによって local 環境に依存せず指定したバージョンの terraform 実行が可能となります。

#### one-off Container とは

one-off Container は Docker コンテナを `run --rm` で 1 度のコマンド実行の為だけに起動する手法です。

Makefile で Docker コマンドをラップしておくと
`TERRAFORM_VERSION` を変更するだけで
指定の terraform バージョンを利用できます。

以下は 0.11.1 の例です。

```
TERRAFORM_VERSION=0.11.1

DOCKER=docker run --rm -v ~/.ssh:/root/.ssh:ro -v ~/.aws:/root/.aws:ro -v ${PWD}:/work -w /work hashicorp/terraform:${TERRAFORM_VERSION}

$(eval ENV := $(shell ${DOCKER} workspace show))

ifeq (${ENV}, default)
$(error select workspace ! ex: make init ENV=<stg|prod>)
endif

default: init

init:
	# tfstate ファイル初期化
	${DOCKER} init
	# workspace 作成. "; true" は既に作成済みエラーをスキップする為
	${DOCKER} workspace new ${ENV}; true
	# 作成した workspace を選択
	${DOCKER} workspace select ${ENV}
	# 作成した workspace の tfstate ファイルを同期
	${DOCKER} init

plan:
	${DOCKER} plan

apply
	${DOCKER} apply -auto-approve
```

- `make init ENV=stg` 実行で以下まとめてました
  - tfstate 初期化
  - workspace `stg` 作成
  - 選択した workspace の tfstate で初期化

きっとさらに素敵なベストプラクティスがあれば教えてください！

参考になれば幸いです。
