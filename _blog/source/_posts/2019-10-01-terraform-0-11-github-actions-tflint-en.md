---
layout: post
title: I Built a GitHub Action for Terraform 0.11 and Added tflint Too
date: 2019-10-01
lang: en
translation_id: terraform-0-11-github-actions-tflint
permalink: en/2019/10/01/terraform-0-11-github-actions-tflint/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190930/20190930221527.png
category: Terraform
tags:
- Terraform
---

## Overview

HashiCorp provides the following repository as a GitHub Action for Terraform.

[hashicorp/terraform-github-actions](https://github.com/hashicorp/terraform-github-actions)

However, the repository above only applies to the latest version of Terraform (0.12.9 as of 2019-09-30).

Since there was nothing for the 0.11 series, I forked hashicorp/terraform-github-actions and created **terraform-github-actions for the 0.11 series** in the following repository.

[kenzo0107/terraform-github-actions](https://github.com/kenzo0107/terraform-github-actions)

<!-- more -->

Support for older versions of Terraform is documented officially by Terraform at the following link.

[Terraform Versions - Terraform GitHub Actions - Terraform by HashiCorp](https://www.terraform.io/docs/github-actions/terraform-versions.html)

It says that for older versions you should fork it and build it yourself.

## While I Was At It

I also added the following.

* Added tflint
* Display the directory being executed


## How to Use

Suppose you have a Terraform project like the following.

```yml
├── envs
│   ├── prd
│   │   ├── backend.tf
│   │   ├── main.tf
│       ...
│   │   └── variable.tf
│   └── stg
│       ├── backend.tf
│       ├── main.tf
│       ...
│       └── variable.tf
└── modules
    ├── ...
```


## How to Configure GitHub Actions

Place the following 2 files in the root directory.


* .github/workflows/main.yml
* .github/workflows/fmt.yml


```
├── .github
│   └── workflows
│       ├── main.yml
│       └── fmt.yml
│
├── envs
│   ├── prd
│   │   ├── backend.tf
│   │   ├── main.tf
│       ...
│   │   └── variable.tf
│   └── stg
│       ├── backend.tf
│       ├── main.tf
│       ...
│       └── variable.tf
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


#### A Quick Explanation

##### It runs triggered by Pull Requests.

```yml
on: [pull_request]
```


##### Check out the repository

```yml
    - name: Checkout Repo
      uses: actions/checkout@v1
```


##### Run stg and prd in parallel using matrix.

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


Needless to say, it runs the following.


* terraform init
* terraform validate
* terraform lint
* terraform plan



`kenzo0107/terraform-github-actions/init@v0.6.0` supports terraform v0.11.14.

For init, validate, and lint, if there are any issues to point out, it comments on the Pull Request.

#### terraform plan always pastes the execution result.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190930/20190930221527.png" width="100%">
</div>

This is a feature that reviewers will appreciate.

That is because whether the code changes and the `terraform plan` output are consistent is an important point of review.

##### Specifying the execution path

When you want to change into a directory before running terraform plan and so on, specify it in the following environment variable.

```yml
TF_ACTION_WORKING_DIR: './envs/${{ matrix.env }}'
```


In `kenzo0107/terraform-github-actions/plan@v0.6.0`, I made it display the TF_ACTION_WORKING_DIR you configured above together with the terraform plan output. ((In `hashicorp/terraform-github-actions`, the executed directory path is not included in the Pull Request comment.))

This is because, from the `terraform plan` output alone, it is hard to tell whether it was run against stg or prd, which can confuse reviewers.

##### Configuring secrets

```yml
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
AWS_ACCESS_KEY_ID:  ${{ secrets.AWS_ACCESS_KEY_ID }}
AWS_SECRET_ACCESS_KEY:  ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```


For secrets.GITHUB_TOKEN, you do not need to set a token in secrets.

I personally think this is a confidential management method that is only possible precisely because it is CI/CD run by GitHub, and it is one of the big advantages of Actions.

For everything else, set it under `settings` > `secrets`.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190930/20190930223443.png" width="100%">
</div>

### .github/workflows/fmt.yml

Since `terraform fmt` is run at the root directory of the repository regardless of stg, prd, and so on, I separated it from `.github/workflows/main.yml`.

This one is also run triggered by Pull Requests.

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


## Final Thoughts

As a subject for getting my feet wet with GitHub Actions, it was very simple and easy to approach.

And above all, despite the effort I put in, it might have been faster to just support the 0.12 series...

Unless you have some unavoidable reason to stay on 0.11, it is better to keep up with the latest version.

That's all.
I hope this is helpful.
