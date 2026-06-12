---
title: Running git lfs pull on AWS CodeBuild
date: 2022-06-16
lang: en
translation_id: git-lfs-pull-on-codebuild
permalink: en/2022/06/16/git-lfs-pull-on-codebuild/
cover: /img/cover/2022-06-16-git-lfs-pull-on-codebuild.svg
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## Overview

The process of checking out from GitHub in a CodePipeline source action started failing with an error, causing the pipeline to abort.

The cause was that the files under `app/assets/images/` in the Rails project being checked out had grown bloated in size.

This is the story of how I introduced Git LFS to work around that issue.

<!-- more -->

## First, I contacted AWS Support about the problem

They told me there was an ongoing incident with the GitHub source action v2.

```
ただいまリポジトリサイズが大きい場合に GitHub ソースアクション v2 がお問い合わせいただいたエラーで失敗する事象が発生しており、製品担当部署にて原因調査を進めております。
このたびは AWS 側の問題によりご不便ご迷惑をお掛けしておりますこと、深くお詫び申し上げます。
誠に申し訳ございません。

当該事象は CodeCommit または S3 ソースアクションで回避できることを確認しております。
もしパイプラインの実行を急がれます場合は、これらの代替案をお試しくださいませ。
```

According to them, the issue could be worked around by using CodeCommit or S3.

- Temporarily switch from GitHub to CodeCommit
  - Impacts the development flow
- Change the deployment flow, such as generating the files to upload to S3
  - Would file generation be done with something like GitHub Actions? That seems likely to incur verification costs

Rather than a temporary workaround, I looked for an approach that would have minimal impact on the current operation and keep verification costs low.

## Using Git Large File Storage

https://git-lfs.github.com

> Git Large File Storage (LFS) replaces large files such as audio samples, videos, datasets, and graphics with text pointers inside Git, while storing the file contents on a remote server like GitHub.com or GitHub Enterprise.

I figured that by using Git LFS, I could reduce the size of what gets checked out from GitHub, and then run `git lfs pull` where needed to work around the issue.

## Changes on the repository being checked out

Add the following to the target repository.

.gitattributes

```
app/assets/images/**.png filter=lfs diff=lfs merge=lfs -text
app/assets/images/**.jpg filter=lfs diff=lfs merge=lfs -text
app/assets/images/**.webp filter=lfs diff=lfs merge=lfs -text
```

Since the cause of the size bloat was the images under Rails' `app/assets/images/`, I specified them as shown above.

## Changes on the CodePipeline & CodeBuild side

The explanation is based on Terraform.

- Configure the CodePipeline source action to do a full clone.
  - If you don't need to use Git metadata, a shallow clone is preferable since it checks out fewer files

```
resource "aws_codepipeline" "deploy" {
  ...
  stage {
    name = "Source"
    action {
      configuration = {
        OutputArtifactFormat = "CODEBUILD_CLONE_REF" # Git LFS を利用すべく git メタデータを取得する為。
```

- Add permissions to the IAM Role attached to CodeBuild

```
  # Git LFS 管理のオブジェクトを pull する為
  statement {
    actions   = ["codestar-connections:UseConnection"]
    resources = ["<codestarconnections_arn>"]
```

- In the buildspec, install the git-lfs command and run `git-lfs pull`.
  - Specifies v3.2.0, the latest at the time of writing

```
phases:
  pre_build:
    commands:
      # Git LFS 管理のオブジェクトを pull する
      - wget https://github.com/git-lfs/git-lfs/releases/download/v3.2.0/git-lfs-linux-amd64-v3.2.0.tar.gz
      - tar vzxf git-lfs-linux-amd64-v3.2.0.tar.gz
      - cd git-lfs-3.2.0 && ./install.sh && cd ..
      - git remote set-url origin https://medpeer:$GITHUB_TOKEN@github.com/medpeer-dev/wac-rails
      - git-lfs pull
```

With the above changes, I was able to avoid the source action error and confirmed that the deployment succeeded.

## By the way

Thinking "if CodePipeline doesn't work, how about GitHub Actions?", I gave it a try, but ran into `no left space on device`.

That's all.
I hope this is helpful.
