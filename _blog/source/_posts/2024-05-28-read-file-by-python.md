---
title: Python ファイル読み込み
date: 2024-05-28
category: Python
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

Python でファイル内容を読み込みして Azure OpenAI Service に読ませたい時があったのでまとめました。

<!-- more -->

```python
import os
import sys
from docx import Document
from pypdf import PdfReader

# .docx
def read_docx(filepath):
    doc = Document(filepath)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return "\n".join(full_text)

# .pdf
def read_pdf(filepath):
    reader = PdfReader(filepath)
    full_text = ""
    for p in reader.pages:
        full_text += p.extract_text()
    return full_text

# .txt, .md etc...
def read_txt(filepath):
    with open(filepath, 'r') as file:
        content = file.read()
    return content

def main(filepath):
    _, ext = os.path.splitext(filepath)

    if ext == '.docx':
        t = read_docx(filepath)
    elif ext == '.pdf':
        t = read_pdf(filepath)
    else:
        t = read_txt(filepath)

    print(t)


if __name__ == "__main__":
    filepath = sys.argv[1]
    main(filepath)
```

https://gist.github.com/kenzo0107/456439de57b3640c053cf369ca42f358

以前ファイル内容を 1 行ずつ、yaml をパース等は実施しましたので、そちらも参考まで。

{% linkPreview https://kenzo0107.github.io/2023/07/20/2023-07-21-python-load-file/#more _blank %}

以上
参考になれば幸いです。
