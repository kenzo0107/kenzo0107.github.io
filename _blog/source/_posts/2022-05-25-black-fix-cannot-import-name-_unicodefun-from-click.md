---
title: black 「ImportError: cannot import name _unicodefun from click」 対応
date: 2022-05-25
tags:
- Python
---

python の自動整形ツール [black](https://github.com/psf/black) で以下エラーが発生した為、その時の対応をまとめます。

```
$ black . --check --skip-string-normalization

Traceback (most recent call last):
...
ImportError: cannot import name '_unicodefun' from 'click' ...
...
```

以下参考に black 最新バージョン [22.3.0](https://pypi.org/project/black/22.3.0/) にアップグレードすることで対応できたことを確認しました。

{% linkPreview https://github.com/psf/black/issues/2964 %}

根本原因は black の内部モジュールが click (自身の環境ではバージョン 8.1.3) をインストールしており、そのバグによるものです。

以上
参考になれば幸いです。
