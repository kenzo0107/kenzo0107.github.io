---
title: Reading File Contents in Python
date: 2023-07-21
lang: en
translation_id: python-load-file
permalink: en/2023/07/21/python-load-file/
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

## Overview

This is a memo summarizing how to load the contents of a file in Python 3.

## Preparing the File Used for Testing

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

## Reading the File Contents

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

## Reading Only the First Line of the File

```python
with open("sample.txt", "r") as file:
	d = file.readline()

print(d)
```

```console
greeting:
```

## Reading the File Line by Line

```python
with open("sample.txt", "r") as file:
	d = file.readlines()

print(d)
```

```console
['greeting:\n', '  ja: こんにちは\n', '  en: hello\n', '\n', 'sports:\n', '  ja: 相撲\n', '  en: バスケット\n']
```

## Reading the File and Parsing It as YAML

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

That's all.
I hope you find this helpful.
