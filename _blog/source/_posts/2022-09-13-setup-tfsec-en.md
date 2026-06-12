---
title: Strengthening the Security of Terraform-Managed Resources with tfsec
date: 2022-09-13
category: Terraform
lang: en
translation_id: setup-tfsec
permalink: en/2022/09/13/setup-tfsec/
cover: https://aquasecurity.github.io/tfsec/v0.63.1/imgs/homelogo.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

This article describes how to use [tfsec](https://github.com/aquasecurity/tfsec) to strengthen the security of resources managed with [Terraform](https://www.terraform.io/).

<!-- more -->

## Installing tfsec locally

In the example below, I install it using [asdf](https://github.com/asdf-vm/asdf).
asdf supports many languages, and it is useful because it lets you switch versions with the same procedure across languages, rather than relying on per-language version switchers like rubyenv, nodenv, or goenv.

Reference: https://github.com/woneill/asdf-tfsec

```console
asdf plugin-add tfsec https://github.com/woneill/asdf-tfsec

Show the manageable versions
asdf list all tfsec
...
1.27.4
1.27.5
1.27.6

asdf install tfsec 1.27.6

// Local configuration
asdf local tfsec 1.27.6

// The step above appends `tfsec 1.27.6` to .tool-versions
cat .tool-versions
```

## When you want to exclude a rule for an individual resource

You can exclude a rule on each resource with `tfsec:ignore`.

```
resource "aws_lb" "dummy" {
  internal = false # tfsec:ignore:aws-elb-alb-not-public インターネットからのアクセスをする為、許容する
```

You can also exclude a rule by adding a comment above the resource as shown below, but
when there are several of them it becomes hard to read, so personally I find it clearer to set them on each individual parameter as shown above.

```
# tfsec:ignore:aws-elb-alb-not-public インターネットからのアクセスをする為、許容する
resource "aws_lb" "dummy" {
  internal = false
```

## When you want to exclude a rule across the whole project

Reference: https://aquasecurity.github.io/tfsec/v1.27.6/getting-started/configuration/config/

Create .tfsec/config.yml and add the rules you want to exclude.
The following is just a sample; change the excluded rules according to your own operations.

```
---
exclude:
  # NOTE: IAM Policy で * (ワイルドカード) の使用を回避すると工数増となり対応が難しくなることが多い為、除外する
  - aws-iam-no-policy-wildcards

  # ALB を internet-facing で利用したい場合が主なので除外する
  - aws-elb-alb-not-public
```

```console
// The tfsec execution directory is set to ./envs/prd here.
tfsec --config-file .tfsec/config.yml ./envs/prd
```

## Running it in GitHub Actions

tfsec will now run triggered by the creation of a Pull Request.

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

## Summary

By introducing tfsec, you can address many of the rules that are non-compliant with AWS Config, contributing to building a more secure architecture.
It is even more recommended to set things up so that a Pull Request cannot be merged unless it passes tfsec, since this automatically enforces it as an operational rule.

Also, SaaS services evolve day by day, and tfsec keeps up with them.
Please be careful, as regularly upgrading the tfsec version is essential.

That's all.
I hope you find it helpful.
