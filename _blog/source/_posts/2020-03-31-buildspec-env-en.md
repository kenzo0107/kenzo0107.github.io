---
title: Reusing CodeBuild by Passing and Overriding Environment Variables from CodePipeline
tags:
- AWS
- CodeBuild
date: 2020-03-31
categories:
  - [AWS]
  - [Python]
lang: en
translation_id: buildspec-env
permalink: en/2020/03/31/buildspec-env/
cover: /img/cover/2020-03-31-buildspec-env.svg
---

A story about reusing CodeBuild instead of needlessly creating new ones.

<!-- more -->

## Managing buildspec with Terraform

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

When you run `terraform apply` to create the CodeBuild project, the environment variable `FOO=foo` is set.

## Overriding CodeBuild Environment Variables from CodePipeline

This is useful when the CodeBuild processing is the same but you only want to change the environment variables.

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

Now when you run CodePipeline, `FOO=moge` is specified and the value is successfully overridden.

## Example

By substituting the nginx ECR repository into `${repository_url}`, you can create a CodeBuild project that builds the Nginx image and pushes it to ECR.

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

By specifying the environment variable `REPOSITORY_URL=123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/fluentd` in CodePipeline, you can build the fluentd image and push it to ECR.

## Conclusion

Don't create CodeBuild projects recklessly.

That's all.
I hope you find this helpful.


## References

I referred to the following for how to specify environment variables.

[Build specification reference for CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)
