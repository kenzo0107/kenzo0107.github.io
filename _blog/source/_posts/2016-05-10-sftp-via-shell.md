---
layout: post
title: sftpをシェル化してファイルアップロード
date: 2016-05-10
tags:
- sftp
---

## 概要

データ解析サービスを提供するサードパーティで
指定の Server, Path に指定形式で格納するように、
と指示がありました。

また、
「Protocol は `sftp` のみ許可でお願いします」
とも。

定期実行する必要もあったため
シェルで書けないかということで、
以下まとめました。

## shell

{% gist kenzo0107/a2f7525b6e201daa632c4dec36a9a1ba %}


### Point

- expect で通常、対話形式となるsftpコマンドの先読みでパスワードを通過

- -oオプションで `bachmode no` を指定し以下のエラーを回避

```
Permission denied (publickey,password).
Connection closed
```

- -bオプション バッチファイルにsftpログイン後の実行処理を記述

当方では、Jenkins や cron でシェルを定期実行する必要があった為
明示的にバッチファイルの内容を指定できるようにしています。

以上です。
