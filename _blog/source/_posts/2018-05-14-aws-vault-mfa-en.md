---
layout: post
title: Passing MFA Authentication for Multiple Accounts with AWS Vault
date: 2018-05-14
category: AWS
lang: en
translation_id: aws-vault-mfa
permalink: en/2018/05/14/aws-vault-mfa/
tags:
  - AWS
  - Vault
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180514/20180514221849.jpg
---

## What is AWS Vault?

AWS Vault is a tool that provides a mechanism for securely storing IAM credentials (Access Key Id, Secret Access Key) in your OS keystore and accessing them.

True to its name (Vault = a safe),
it gives you a setup where your secret information is unlikely to leak even if you lose your PC.

## The Goal This Time

I want to use AWS Vault to make console login for multiple accounts easy.

<!-- more -->

When you receive AWS IAM credentials, I imagine MFA is configured.

This is done to manage secure accounts through device authentication.

In that case, you install an app like the one below
and set up a mechanism that authenticates with a 6-digit number that refreshes every minute.

{% blockquote AppStore https://itunes.apple.com/jp/app/google-authenticator/id388497605 %}
{% endblockquote %}

{% blockquote GooglePlay https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=ja %}
{% endblockquote %}

MFA itself
depends on your company's development policy, but it's a mechanism that does no harm to have in place.

However, copying and pasting a 6-digit number every time is a hassle.

So I set things up to pass authentication more simply.

## Installing aws-vault

```sh
macOS%$ brew cask install aws-vault
```

## Setting Up a profile

```sh
aws-vault add <profile>
Enter Access Key ID: <Access Key ID 入力>
Enter Secret Access Key: <Secret Access Key 入力>
```

## Prerequisites

```sh
brew tap peco/peco
brew install peco
```

## bash Configuration

Add the following to your .bashrc, .zshrc, or similar.

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

## How to Use

- Select a configured profile and log in

```
avl
```

- Select a configured profile and execute a command

```
ave
```

The actual commands were content I'd rather not record and show, so I couldn't paste them. Sorry!

Please give it a try and see how it feels ♪

Having to enter a password every time is a bit painful,
but compared to the hassle of MFA it's far easier.

I don't think this is really what AWS Vault was intended for,
but if it makes life easier, then it's all good ♪
