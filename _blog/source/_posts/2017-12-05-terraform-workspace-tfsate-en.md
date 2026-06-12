---
layout: post
title: Managing tfstate per Environment with terraform workspace
date: 2017-12-05
lang: en
translation_id: terraform-workspace-tfsate
permalink: en/2017/12/05/terraform-workspace-tfsate/
tags:
  - Terraform
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171205/20171205214728.jpg
---

This is a write-up about managing tfstate per environment with terraform workspace.

## Addendum 2019/04/17

At the time of this addendum, workspace had many operational issues, so I am no longer using it. Please refer to the article below.

{% linkPreview https://kenzo0107.github.io/2019/04/17/2019-04-17-terraform-2019-workspace/ _blank %}

## Overview

In the past, when managing Terraform tfstate,
on the 0.8 series I saw code that diligently switched the bucket per environment (stg, prod) using `-backend-config`.

However,
with workspace you can now store state per environment within a single bucket.

Strictly speaking, this doesn't have to be per environment;
the idea is to manage state per set of resources, per module, and so on.

This time, to make it easy to grasp the concept, I split things up per environment.

## History

- In 0.5, managed with S3
- In < 0.9, the storage location was configured with remote config
- In >= 0.9, multiple groups of resources are managed in the same directory with terraform workspace

It has become more and more convenient to use.

## Prerequisites

We assume the following conditions.

- tfstate is managed in S3 via backend.tf

## Migration Steps

### Check tfstate with the existing terraform

- Confirm that the execution plan is as expected.
- If it differs, there is a problem to begin with — either there is already a diff from the current environment, or the tfstate could not be retrieved correctly — so fix that.

```
$ terraform plan
```

### Retrieve the tfstate file

Retrieve terraform.tfstate locally.
Check its contents to make sure the resource configuration is reasonably free of issues.

- 0.8 series

```
$ terraform remote config \
-backend=s3 \
-backend-config="bucket=tfstate.bucket" \
-backend-config="key=terraform.tfstate" \
-backend-config="region=ap-northeast-1" \
-backend-config="profile=aws-hogehoge"
```

- 0.9 series and later

```
macOS%$ terraform state pull > terraform.tfstate
```

### Upgrade to terraform 0.11.x (latest as of December 2017)

With Homebrew, just use upgrade!

```
macOS%$ brew upgrade terraform
```

### Describe state management in backent.tf

If you already have it configured like this, you can skip this step. This is a particularly common way to write it.

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

## Creating a Workspace

- Create workspace `stg`

```
$ terraform workspace new stg
```

- List of workspaces

```
$ terraform workspace list
  default
* stg
```

## Push the tfstate

```
$ terraform state push -force .terraform/terraform.tfstate
```

This pushes terraform.tfstate under the `env:/stg/` directory of the S3 `tfstate.bucket`.
Go check it in S3 to confirm for yourself.

![](https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171205/20171205213108.png)

The key point is that it is `env:`, not `env`.

## Check the Execution Plan

```
$ terraform plan
```

Confirm that the execution plan is as expected, and if there are no problems, the migration is complete.

## Bonus

To run terraform with a specified version,
my current best practice is to wrap it in a Makefile so that it can be run in a one-off Container.

This makes it possible to run a specified version of terraform without depending on the local environment.

#### What is a one-off Container?

A one-off Container is a technique where you launch a Docker container with `run --rm` just to execute a single command one time.

If you wrap the Docker command in a Makefile,
you can use a specified terraform version
just by changing `TERRAFORM_VERSION`.

Below is an example with 0.11.1.

```
TERRAFORM_VERSION=0.11.1

DOCKER=docker run --rm -v ~/.ssh:/root/.ssh:ro -v ~/.aws:/root/.aws:ro -v ${PWD}:/work -w /work hashicorp/terraform:${TERRAFORM_VERSION}

$(eval ENV := $(shell ${DOCKER} workspace show))

ifeq (${ENV}, default)
$(error select workspace ! ex: make init ENV=<stg|prod>)
endif

default: init

init:
	# Initialize the tfstate file
	${DOCKER} init
	# Create the workspace. The "; true" is to skip the error when it already exists
	${DOCKER} workspace new ${ENV}; true
	# Select the created workspace
	${DOCKER} workspace select ${ENV}
	# Sync the tfstate file of the created workspace
	${DOCKER} init

plan:
	${DOCKER} plan

apply
	${DOCKER} apply -auto-approve
```

- Running `make init ENV=stg` bundles the following together
  - Initialize tfstate
  - Create workspace `stg`
  - Initialize with the tfstate of the selected workspace

If you have an even better best practice, please let me know!

I hope this is helpful.
