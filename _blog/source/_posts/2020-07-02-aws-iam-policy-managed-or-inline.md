---
title: AWS IAM Policy はインラインでなく、管理ポリシーを積極的に使おう
tags:
- AWS
date: 2020-07-02
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## 概要

IAM Policy で、管理ポリシーとインラインポリシーってどういう違いがあって、どっちを使うべきなのだろう？と調べてみました。

<!-- more -->

## 結論、インラインポリシーを控え、管理ポリシーを積極的に使おう

[管理ポリシーとインラインポリシー](https://docs.aws.amazon.com/ja_jp/IAM/latest/UserGuide/access_policies_managed-vs-inline.html)

上記リンクの AWS ドキュメントの 「管理ポリシーとインラインポリシーの比較」 項目を見ると、管理ポリシーを利用するメリットが明らかです。

> インラインポリシーではなく、管理ポリシーを使用することをお勧めします。
>
> 管理ポリシーは次の機能を備えています。
> * 再利用可能性
> * 一元化された変更管理
> * バージョニングとロールバック
> * アクセス許可管理の委任
> * AWS 管理ポリシーの自動更新



## terraform の気持ちになってみる

terraform の気持ちになって必要なリソースを考えると以下の様になります。

* 管理ポリシー
  * aws_iam_policy
  * aws_iam_user_policy_attachment

* インラインポリシー
  * aws_iam_user_policy

#### 例) 管理ポリシー

```
# IAM User
resource "aws_iam_user" "hoge" {
  name = "hoge"
  path = "/"
}

# 管理ポリシー
resource "aws_iam_policy" "hoge" {
  name   = "hoge"
  policy = data.aws_iam_policy_document.hoge.json
}

# ポリシー
data "aws_iam_policy_document" "hoge" {
  statement {
    ...
  }
}

# ポリシーを IAM User にアタッチ
resource "aws_iam_user_policy_attachment" "hoge" {
  user       = aws_iam_user.hoge.name
  policy_arn = aws_iam_policy.hoge.arn
}
```

#### 例) インラインポリシー

```
# IAM User
resource "aws_iam_user" "hoge" {
  name = "hoge"
  path = "/"
}

# ポリシー
data "aws_iam_policy_document" "hoge" {
  statement {
    ...
  }
}

# インラインポリシーとして IAM User にポリシーをアタッチ
resource "aws_iam_user_policy" "hoge" {
  name   = "hoge"
  user   = aws_iam_user.hoge.name
  policy = data.aws_iam_policy_document.hoge.json
}
```

## まとめ

terraform プロジェクトをレビューする機会がある折には、 `aws_iam_user_policy` を見つけたら是非、目を細めて「管理ポリシーの優位性が...」云々を語り、AWS のドキュメントをリンクを貼ってみてください。

以上
参考になれば幸いです。
