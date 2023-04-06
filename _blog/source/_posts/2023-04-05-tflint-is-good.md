---
title: terraform の linter tflin を導入し、GitHub Actions で構文チェック
date: 2023-04-05
category: Terraform
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

terraform の linter として [tflint](https://github.com/terraform-linters/tflint) を導入し、
GitHub Actions でチェックが良かったのでまとめます。

## asdf で導入

[asdf](https://asdf-vm.com/guide/introduction.html#nvm-n-rbenv-etc) で複数バージョンの導入・切り替えが可能です。

asdf 経由で導入

```console
asdf plugin-add tflint https://github.com/skyzyx/asdf-tflint
```

## GitHub Actions で設定

Pull Request 作成・更新時に tflint を走らせる設定です。

以下ディレクトリ毎に tflint を実行しています。

- envs/prd
- envs/stg

```.github/workflows/tflint.yml
name: Lint

on: [pull_request]

jobs:
  tflint:
    name: tflint
    timeout-minutes: 3
    runs-on: ubuntu-latest

    strategy:
      fail-fast: false
      matrix:
        directory: ['envs/prd', 'envs/stg']

    steps:
      - uses: actions/checkout@v3

      - name: Pick terraform_version
        id: tflint
        run: echo "tflint_version=$(grep tflint .tool-versions | awk '{print $2}')" >> $GITHUB_OUTPUT

      - uses: terraform-linters/setup-tflint@v3
        name: Setup TFLint
        with:
          tflint_version: v${{ steps.tflint.outputs.tflint_version }}

      - name: Init TFLint
        run: tflint --init
        working-directory: ./${{ matrix.directory }}
        env:
          # https://github.com/terraform-linters/tflint/blob/master/docs/user-guide/plugins.md#avoiding-rate-limiting
          GITHUB_TOKEN: ${{ github.token }}

      - name: Execute tflint
        run: tflint
        working-directory: ./${{ matrix.directory }}
```

## timeout-minutes: 3

おおよそ完了する時間は 1 分も掛からないですが、3 分もあれば終わるのと
意図せぬ長時間の実行を回避すべく、3 分でタイムアウトする様に設定しています。

リソース数にもよるので適宜設定してください。

## GITHUB_TOKEN を指定する理由

いらなそう？と思いましたが、公式に以下コメントがあります。

> When you install plugins with tflint --init, TFLint calls the GitHub API to get release metadata. By default, this is an unauthenticated request, subject to a rate limit of 60 requests per hour per IP address.

認証されていないリクエストで、IP アドレスあたり 1 時間あたり 60 リクエストというレート制限がある為、
それを回避する為に設定する必要があるとのこと。

以上
参考になれば幸いです。
