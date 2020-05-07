---
title: CodePipeline で CodeBuild へ環境変数を渡し、上書きすることで CodeBuild を再利用する
tags:
- AWS
- CodeBuild
date: 2020-03-31
---

CodeBuild を再利用し、不要に作成しない様にした話です。

<!-- more -->

## terraform で buildspec を管理してみる

* buildspec.yml
```yml
---
version: 0.2

env:
  variables:
    FOO: "${foo}"
    ...
```

* codebuild.tf
```terraform
data "template_file" "buildspec" {
  template = file("buildspec.yml")

  vars = {
    foo = "foo"
  }
}

resource "aws_codebuild_project" "foo" {
  source {
    type      = "CODEPIPELINE"
    buildspec = data.template_file.buildspec.rendered
  }
```

`terraform apply` 実行し CodeBuild を作成すると、環境変数 `FOO=foo` が設定されます。

## CodePipeline で CodeBuild の環境変数を上書き

CodeBuild の処理内容は同じだが、環境変数だけ変えたい場合に有効です

```terraform
resource "aws_codepipeline" "moge" {
  stage {
    name = "Build"

    action {
      configuration = {
        ProjectName = aws_codebuild_project.foo.name
        EnvironmentVariables = "[{\"name\":\"FOO\",\"value\":\"moge\",\"type\":\"PLAINTEXT\"}]"
      }
```

これで CodePipeline を実行した場合、 `FOO=moge` が指定され、見事上書きされてます。

## 例題

`${repository_url}` に nginx の ECR リポジトリを代入すると Nginx のイメージビルド & ECR プッシュの処理をする CodeBuild が作れます。

```yml
---
version: 0.2

env:
  variables:
    DOCKER_BUILDKIT: 1
    REPOSITORY_URL: "${repository_url}"

phases:
  pre_build:
    commands:
      - $(aws ecr get-login --region $AWS_DEFAULT_REGION --no-include-email)
      - IMAGE_TAG=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
  build:
    commands:
      - >-
        docker build -t $REPOSITORY_URL:latest -f Dockerfile .
      - docker tag $REPOSITORY_URL:latest $REPOSITORY_URL:$IMAGE_TAG
      - docker push $REPOSITORY_URL:latest
      - docker push $REPOSITORY_URL:$IMAGE_TAG
```

CodePipeline で環境変数 `REPOSITORY_URL=123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/fluentd` と指定すると fluentd イメージをビルド & ECR push ができます。

## 結論

無闇に CodeBuild を作成することなかれ

以上
参考になれば幸いです。


## 参考

環境変数の指定の仕方は以下参考にしました。

[Build specification reference for CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)
