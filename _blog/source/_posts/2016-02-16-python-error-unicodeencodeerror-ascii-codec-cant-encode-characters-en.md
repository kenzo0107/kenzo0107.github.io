---
layout: post
title: "Fixing a Python Error: UnicodeEncodeError: 'ascii' codec can't encode characters"
date: 2016-02-16
lang: en
translation_id: python-error-unicodeencodeerror-ascii-codec-cant-encode-characters
permalink: en/2016/02/16/python-error-unicodeencodeerror-ascii-codec-cant-encode-characters/
cover: /img/cover/2016-02-16-python-error-unicodeencodeerror-ascii-codec-cant-encode-characters.svg
tags:
- Python
---

## Conclusion
Set Python's character encoding to utf-8.

## Overview

While implementing code in Python to download images from image URLs like the one below,
I ran into the error mentioned in the title.

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

- Specifically, it was failing here.

```python
localfile.write(img.read())
```


## Environment

- CentOS Linux release 7.0.1406 (Core)
- Python 2.7.5

---

## Checking the character encoding

When I checked interactively as shown below, it displayed ascii.
Let's change this to utf-8.

```sh
$ python
>>> import sys
>>> sys.getdefaultencoding()
'ascii'
```

## Checking the pip path

The path is printed when you check the version.

```sh
$ pip --version
pip 7.1.0 from /usr/lib/python2.7/site-packages (python 2.7)
```

## Create sitecustomize.py under site-packages

```sh
vi /usr/lib/python2.7/site-packages/sitecustomize.py
```

```python
import sys
sys.setdefaultencoding('utf-8')
```

Save with the contents above.

## Check the character encoding again

It is now utf-8.

```sh
$ python
>>> import sys
>>> sys.getdefaultencoding()
'utf-8'
```

This resolved the error mentioned in the title.
