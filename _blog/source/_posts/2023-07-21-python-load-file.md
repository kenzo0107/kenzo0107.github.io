---
title: python でファイルの内容を取得する
date: 2023-07-21
category: Python
cover: https://i.imgur.com/V4yCTSm.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

---

## 概要

Python3 でファイルの中身をロードする方法をまとめた備忘録です。

## テストで使用するファイル用意

```
cat <<EOF> sample.txt
greeting:
  ja: こんにちは
  en: hello

sports:
  ja: 相撲
  en: バスケット
EOF
```

## ファイルの内容を取得

```python
with open("sample.txt", "r") as file:
	d = file.read()

print(d)
```

```console
greeting:
  ja: こんにちは
  en: hello

sports:
  ja: 相撲
  en: バスケット
```

## ファイルの 1 行目のみ取得

```python
with open("sample.txt", "r") as file:
	d = file.readline()

print(d)
```

```console
greeting:
```

## ファイルを行毎に取得

```python
with open("sample.txt", "r") as file:
	d = file.readlines()

print(d)
```

```console
['greeting:\n', '  ja: こんにちは\n', '  en: hello\n', '\n', 'sports:\n', '  ja: 相撲\n', '  en: バスケット\n']
```

## ファイルを取得し Yaml としてパースする

```sh
pip install pyyaml
```

```python
import yaml

with open("sample.txt", "r") as file:
    d = yaml.safe_load(file)

print(d)
print('---')
print(d['greeting']['ja'])
```

```console
{'greeting': {'ja': 'こんにちは', 'en': 'hello'}, 'sports': {'ja': '相撲', 'en': 'バスケット'}}
---
こんにちは
```

以上
参考になれば幸いです。
