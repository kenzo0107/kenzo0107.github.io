---
title: AWS CodeBuild で git lfs pull する
date: 2022-06-16
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## 概要

CodePipline のソースアクションで GitHub からチェックアウトする処理がエラーとなり、異常終了する事象が発生しました。

チェックアウトする Rails プロジェクトの app/assets/images/ 以下のファイル容量が肥大化していたことが要因でした。

上記を回避すべく Git LFS を導入した話です。

<!-- more -->

## まず問題発生について AWS サポートに問い合わせた

GitHub ソースアクション v2 で障害が発生しているとのこと

```
ただいまリポジトリサイズが大きい場合に GitHub ソースアクション v2 がお問い合わせいただいたエラーで失敗する事象が発生しており、製品担当部署にて原因調査を進めております。
このたびは AWS 側の問題によりご不便ご迷惑をお掛けしておりますこと、深くお詫び申し上げます。
誠に申し訳ございません。

当該事象は CodeCommit または S3 ソースアクションで回避できることを確認しております。
もしパイプラインの実行を急がれます場合は、これらの代替案をお試しくださいませ。
```

CodeCommit や S3 なら回避できるとのこと。

- GitHub から CodeCommit に一時的に変更する
  - 開発フローに影響あり
- S3 へアップロードするファイルの生成等、デプロイフローを変更する
  - ファイルの生成は GitHub Actions 等でやる？検証コスト掛かりそう

一時的な回避策でなく、現運用に極力影響なく、また、検証コストを下げる方法がないかと模索しました。

## Git Large File Storage を利用する

https://git-lfs.github.com

> Git Large File Storage（LFS）は、オーディオサンプル、ビデオ、データセット、グラフィックスなどの大きなファイルを Git 内部のテキストポインタに置き換え、ファイルの内容は GitHub.com や GitHub Enterprise などのリモートサーバに格納します。

Git LFS を利用することで、GitHub からのチェックアウトする容量を抑え、必要箇所で git lfs pull することで回避できないかと考えました。

## チェックアウトするリポジトリ側の対応

対象のリポジトリに以下追加します。

.gitattributes

```
app/assets/images/**.png filter=lfs diff=lfs merge=lfs -text
app/assets/images/**.jpg filter=lfs diff=lfs merge=lfs -text
app/assets/images/**.webp filter=lfs diff=lfs merge=lfs -text
```

容量の肥大化要因が Rails の app/assets/images/ 以下の画像だったので上記のように指定しています。

## CodePipeline & CodeBuild 側の対応

terraform ベースで説明しています。

- CodePipeline のソースアクションで full clone 設定にします。
  - git メタデータを利用する必要がない場合は shallow clone の方がチェックアウトするファイルが少なくて済む

```
resource "aws_codepipeline" "deploy" {
  ...
  stage {
    name = "Source"
    action {
      configuration = {
        OutputArtifactFormat = "CODEBUILD_CLONE_REF" # Git LFS を利用すべく git メタデータを取得する為。
```

- CodeBuild にアタッチしている IAM Role に権限追加

```
  # Git LFS 管理のオブジェクトを pull する為
  statement {
    actions   = ["codestar-connections:UseConnection"]
    resources = ["<codestarconnections_arn>"]
```

- buildspec で git-lfs コマンドをインストールし git-lfs pull しています。
  - 執筆事典最新の v3.2.0 を指定

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

以上の対応でソースアクションのエラーを回避でき、無事デプロイできることを確認しました。

## ちなみに

CodePipeline がダメなら GitHub Actions ではどうか？という気持ちで試した所、
`no left space on device` が発生してしまいました。

以上
参考になれば幸いです。
