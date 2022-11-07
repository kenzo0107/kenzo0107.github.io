---
layout: post
title: AWS Vault で複数アカウントにMFA認証通過
date: 2018-05-14
tags:
  - AWS
  - Vault
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180514/20180514221849.jpg
---

## AWS Vault とは？

AWS Vault は IAM の認証情報 (Access Key Id, Secret Access Key) を安全に OS のキーストアに保存しアクセスできる仕組みを提供するツールです。

Vault = 金庫 というだけあって
PC 落としても秘匿情報が漏れにくい仕組みにしてくれます。

## 今回の目的

AWS Vault で複数アカウントのコンソールログインを簡単にしたいと思います。

<!-- more -->

AWS IAM を頂く際に MFA 設定をしているかと思います。

デバイス認証することでセキュアなアカウントを管理をする為です。

その際に、以下の様なアプリをインストールし
1 分置きに更新される 6 桁 の数字で認証する仕組みにします。

{% blockquote AppStore https://itunes.apple.com/jp/app/google-authenticator/id388497605 %}
{% endblockquote %}

{% blockquote GooglePlay https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=ja %}
{% endblockquote %}

MFA 自体は
その会社の開発ポリシーにも依りますが、入れておいて損なしの仕組みです。

ただ、毎回 6 桁の数字をコピぺするのは面倒です。

それを簡易的に認証通過する様にしました。

## aws-vault インストール

```sh
macOS%$ brew cask install aws-vault
```

## profile 設定

```sh
aws-vault add <profile>
Enter Access Key ID: <Access Key ID 入力>
Enter Secret Access Key: <Secret Access Key 入力>
```

## 事前準備

```sh
brew tap peco/peco
brew install peco
```

## bash 設定

ご利用の .bashrc, .zshrc 等に設定してください。

```sh
function peco-login-aws-account() {
    local account=$(aws-vault ls | awk 'NR>2 {if ($2 != "-") print $2}' | peco)
    aws-vault login $account
}

function peco-aws-exec() {
    local account=$(aws-vault ls | awk 'NR>2 {if ($2 != "-") print $2}' | peco)
    echo -e "aws-vault exec \"$account\" -- \\" | pbcopy
}

alias avl='peco-login-aws-account'
alias ave='peco-aws-exec'
```

## 使い方

- 設定した profile を選択して Login

```
avl
```

- 設定した profile を選択してコマンド実行

```
ave
```

実際のコマンドを rec して出すのは憚れる内容でしたので貼り付けられず汗

是非一度利用し使用感を試してみてください ♪

毎回パスワード入力というのも辛いところではありますが
MFA の手間に比べれば数段楽です。

AWS Vault は本来はそういう意図ではないと思いますが
楽になるならば良し ♪
