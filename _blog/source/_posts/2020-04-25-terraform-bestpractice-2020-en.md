---
title: 'Terraform Best Practices Spring 2020 ~Ditching Modules~'
category: Terraform
tags:
  - Terraform
toc: true
date: 2020-04-25
lang: en
translation_id: terraform-bestpractice-2020
permalink: en/2020/04/25/terraform-bestpractice-2020/
cover: https://i.imgur.com/PRuN9u8.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## Overview

Inspired by `#InfraStudy`, here we go!

It's already been a year since I wrote the article below in 2019. After accumulating more Terraform operational experience, I've updated my best practices for spring 2020.

{% linkPreview https://kenzo0107.github.io/2019/04/17/2019-04-17-terraform-2019-workspace/ _blank %}

As usual, the conclusion first.

<!-- more -->

## Conclusion

- I tried ditching modules

I stopped using this ↓

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

And switched to this ↓

```
.
└──envs/
    ├── bootstrap/
    ├── prd/
    └── stg/
```

## I Tried Ditching Modules

When building a typical web service with modules, I used to structure things like this:

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

`bootstrap` creates the DynamoDB used for tfstate and lock management.

`modules/common` holds resources that are created in common across `modules/stg` and `modules/prd`.

- Example: an S3 bucket for storing logs

The intent was to avoid duplication in the spirit of `Don't Repeat Yourself`.

However, this structure led to operational problems.

### The "Is This modules/stg or modules/common?" Problem

Suppose you manage an S3 bucket in modules/common/s3.tf like this:

```terraform
resource "aws_s3_bucket" "assets" {
  bucket = "${var.env}.${var.service_name}.assets"

  cors_rule {
    max_age_seconds = 3000
  }
}
```

Now, what would you do if, for verification purposes, you wanted to set `max_age_seconds = 0` for stg only?

I've written about `var.env == stg ? 1 : 0` before, but it burns through a lot of mental bandwidth, so I'd rather avoid using it.

One workable idea would be to split the logic between modules/stg/iam.tf and modules/prd/iam.tf.

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

This lets us avoid `var.env == stg ? 1 : 0` at the code level.

However, as you may have noticed, this requires updating the tfstate.

```sh
cd envs/stg
terraform state rm module.common.aws_s3_bucket.assets
terraform import module.stg.aws_s3_bucket.assets stg-hoge-assets

cd envs/prd
terraform state rm module.common.aws_s3_bucket.assets
terraform import module.prd.aws_s3_bucket.assets stg-hoge-assets
```

In this example there's only 1 resource, so it's not too bad. But when there are multiple resources, you end up doing state removal for multiple resources × 2 (stg, prd), which makes updating the state extremely tedious.

And from a code perspective, even though we avoided `var.env == stg ? 1 : 0`, we still couldn't avoid breaking DRY.

## Why Did We Split It in the First Place?

We adopted modules/common on the assumption that it was reusable.

But as the example shows, operational experience taught me that the cost of losing reusability is high, and that such cases happen easily.

## So I Tried Ditching Modules

I realized that there's little need to seek reusability between stg and prd within the same service. In fact, a structure where their configurations can diverge significantly is easier to operate. That's why I settled on the structure from the conclusion above.

```
.
└──envs/
    ├── bootstrap/
    ├── prd/
    └── stg/
```

## Cases Where Modules Are Useful

That said, there are plenty of situations where the reusability of modules really shines.

Example: IAM management across multiple AWS accounts

Suppose you own multiple AWS accounts a, b, c, d, e. Developers basically create IAM users in account a, and modules are handy when you want to bind roles so that the other accounts b through e can be assumed (switch role) from a.

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

// Bind to Switch Role
module "iam_role" {
  source = "../../modules/iam_user"
  ...
}
```

Here reusability is actually desirable, and I found that modules are an excellent fit.

## The Journey to Find Best Practices Continues

There are problems you only notice once you actually operate something, and every time you overcome one, you run into a new one.

Recently I've had the "in a Terraform project, I tend to pile up way too many files when asking for a Pull Request review" problem lol.

When you fall into the lazy mindset of "it's the usual structure we both know," you end up with an aggressively large number of files.

Since that also needlessly drains other people's resources, I think reviewability is an important factor too, so I `git cherry-pick` to break things into smaller chunks.

I also run terraform init, plan, and fmt in GitHub Actions and append the results as PR comments. This makes it easier to review the plan output, and it fails the build on fmt violations.

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

That's all.
I hope you find it helpful.
