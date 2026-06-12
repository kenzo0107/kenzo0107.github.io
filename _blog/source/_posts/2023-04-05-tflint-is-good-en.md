---
title: Adding the tflint linter for Terraform and running syntax checks in GitHub Actions
date: 2023-04-05
lang: en
translation_id: tflint-is-good
permalink: en/2023/04/05/tflint-is-good/
cover: /img/cover/2023-04-05-tflint-is-good.svg
category: Terraform
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

I introduced [tflint](https://github.com/terraform-linters/tflint) as a linter for Terraform,
and since running the checks in GitHub Actions worked out well, I'm writing it up here.

<!-- more -->

## Installing with asdf

With [asdf](https://asdf-vm.com/guide/introduction.html#nvm-n-rbenv-etc) you can install and switch between multiple versions.

Install via asdf:

```console
asdf plugin-add tflint https://github.com/skyzyx/asdf-tflint
```

## Configuring GitHub Actions

This is the configuration that runs tflint when a Pull Request is created or updated.

It runs tflint for each of the following directories:

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

It usually completes in less than a minute, but since three minutes is more than enough to finish
and to avoid unintentionally long-running executions, I set it to time out after 3 minutes.

This depends on the number of resources, so adjust it as appropriate.

## Why specify GITHUB_TOKEN

I thought it might not be necessary, but the official docs include the following comment:

> When you install plugins with tflint --init, TFLint calls the GitHub API to get release metadata. By default, this is an unauthenticated request, subject to a rate limit of 60 requests per hour per IP address.

Because unauthenticated requests are subject to a rate limit of 60 requests per hour per IP address,
you need to set this in order to avoid that limit.

That's all.
I hope this is helpful.
