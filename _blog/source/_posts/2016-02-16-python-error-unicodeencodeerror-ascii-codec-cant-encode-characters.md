---
layout: post
title: "Pythonエラー対応: UnicodeEncodeError: 'ascii' codec can't encode characters"
date: 2016-02-16
tags:
- Python
---

## 結論
Pythonの文字コードを utf-8 に設定する。

## 概要

python で以下のような画像URLから画像をダウンロードする処理を実装した所
掲題のエラーが発生しました。

```python
# -*- coding: utf-8 -*-

import urllib
import urllib2
import os.path
import sys
from HTMLParser import HTMLParser

def download(url):
    img = urllib.urlopen(url)
    localfile = open(os.path.basename(url),'wb')
    localfile.write(img.read())
    img.close()
    localfile.close()
```

- 具体的にはここでこけてました。

```python
localfile.write(img.read())
```


## 環境

- CentOS Linux release 7.0.1406 (Core)
- Python 2.7.5

---

## 文字コード確認

以下対話式で確認してみると ascii と表示されました。
これを utf-8 に変更します。

```sh
$ python
>>> import sys
>>> sys.getdefaultencoding()
'ascii'
```

## pip パス確認

バージョン確認時にパスが出力されます。

```sh
$ pip --version
pip 7.1.0 from /usr/lib/python2.7/site-packages (python 2.7)
```

## site-packages配下に sitecustomize.py を作成

```sh
vi /usr/lib/python2.7/site-packages/sitecustomize.py
```

```python
import sys
sys.setdefaultencoding('utf-8')
```

上記内容で保存。

## 再度文字コード確認

utf-8 になりました。

```sh
$ python
>>> import sys
>>> sys.getdefaultencoding()
'utf-8'
```

これで掲題のエラーが解決されました。
