---
title: Terraform CodePipeline 認証エラー対応
category: Terraform
tags:
- AWS
date: 2020-11-20
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

# 概要

Terraform で管理する CodePipeline で GitHub 認証エラーが発生した為、その回避方法をまとめます。

terraform-provider-aws v3.0.0 で以下対応がされましたが、別の問題が発生している様です。

> resource/aws_codepipeline: Removes GITHUB_TOKEN environment variable (#14175)

# エラーが発生する経緯

terraform のコードは以下の様になっています。

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

こちらで `configuration = {...}` の設定で GitHub 認証をしています。

初回 terraform apply 実行時に OAuthToken に設定した値は tfstate ファイルに hash 化されて保存されます。
その後、何かしらリソースを更新すると、その tfstate にある hash 化された token が UpdatePipeline に渡され GitHub 認証エラーが発生する、
というものです。

なので、初回は CodePipeline で問題なく GitHub 認証されますが、その後、 `terraform apply` 実行しリソース更新後に CodePipeline で GitHub 認証エラーが発生します。

上記については以下 issue にて言及されていました。

{% linkPreview https://github.com/hashicorp/terraform-provider-aws/issues/15200#issuecomment-700808677 _blank %}

## 回避策

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

GitHub 認証を変更無視する様にし、 CodePipeline の認証を更新させない様にすることで
GitHub 認証エラーを回避できました。

```
  lifecycle {
    ignore_changes = [stage[0].action[0].configuration]
  }
```

以前の provider バージョンで `terraform plan` で OAuthToken が毎回差分に出てしまう問題で対応していたコードが舞い戻ってきました。

他の対応方法があればご教示いただければ幸いです。

以上
参考になれば幸いです。
