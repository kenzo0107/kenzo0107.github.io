---
title: Working Around Terraform CodePipeline GitHub Authentication Errors
category: Terraform
tags:
- AWS
date: 2020-11-20
lang: en
translation_id: terraform-codepipeline-github-oauth-error
permalink: en/2020/11/20/terraform-codepipeline-github-oauth-error/
cover: /img/cover/2020-11-20-terraform-codepipeline-github-oauth-error.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

# Overview

A GitHub authentication error occurred in a CodePipeline managed by Terraform, so this post summarizes how to work around it.

<!-- more -->

The following change was made in terraform-provider-aws v3.0.0, but it seems a different problem arises as a result.

> resource/aws_codepipeline: Removes GITHUB_TOKEN environment variable (#14175)

# How the Error Occurs

The Terraform code looks like this.

```
resource "aws_codepipeline" "deploy" {
  ...
  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "ThirdParty"
      provider         = "GitHub"
      version          = "1"
      output_artifacts = [local.prefix]

      configuration = {
        OAuthToken           = var.github_token
        Owner                = "xxx"
        Repo                 = "yyy"
        Branch               = "master"
        PollForSourceChanges = "false"
      }
    }
  }
```

GitHub authentication is performed via the `configuration = {...}` settings here.

On the first `terraform apply`, the value set for `OAuthToken` is stored in the tfstate file as a hash.
After that, when you update any resource, the hashed token in that tfstate is passed to `UpdatePipeline`, causing a GitHub authentication error.

So while GitHub authentication works fine in CodePipeline the first time, after running `terraform apply` and updating a resource, a GitHub authentication error occurs in CodePipeline.

This is discussed in the following issue.

{% linkPreview https://github.com/hashicorp/terraform-provider-aws/issues/15200#issuecomment-700808677 _blank %}

## Workaround

```
resource "aws_codepipeline" "deploy" {
  ...
  stage {
    name = "Source"

    action {
      ...
      configuration = {
        OAuthToken           = var.github_token
        Owner                = "xxx"
        Repo                 = "yyy"
        Branch               = "master"
        PollForSourceChanges = "false"
      }
    }
  }

  ...

  # NOTE: GitHub 認証エラーの暫定対応として GitHub の設定変更を無視します。
  # see: https://github.com/hashicorp/terraform-provider-aws/issues/15200#issuecomment-700808677
  lifecycle {
    ignore_changes = [stage[0].action[0].configuration]
  }
}
```

By ignoring changes to the GitHub authentication so that CodePipeline's authentication is not updated, I was able to work around the GitHub authentication error.

```
  lifecycle {
    ignore_changes = [stage[0].action[0].configuration]
  }
```

The code I had used to deal with the problem of `OAuthToken` always showing up as a diff in `terraform plan` on earlier provider versions has come back around again.

I would appreciate hearing about any other ways to handle this.

That's all.
I hope you find this helpful.
