---
layout: post
title: 独自pre-commit設定
date: 2015-04-17
---

## 手順

{% gist kenzo0107/db07d64898cc4b6418ed %}

pre-commitは以下からどうぞ

https://github.com/kenzo0107/git-hooks


- php構文チェック (php -l )
- masterでのcommit禁止
- php-cs-fixerでPSR準拠でコード変換処理はコメントアウト中
