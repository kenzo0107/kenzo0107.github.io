---
title: Reading Files in Python
date: 2024-05-28
lang: en
translation_id: read-file-by-python
permalink: en/2024/05/28/read-file-by-python/
cover: /img/cover/2024-05-28-read-file-by-python.svg
category: Python
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

I once needed to read the contents of a file in Python and feed it to the Azure OpenAI Service, so I put together this summary.

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

I had previously worked on reading file contents line by line, parsing YAML, and so on, so here is that post for reference as well.

{% linkPreview https://kenzo0107.github.io/2023/07/20/2023-07-21-python-load-file/#more _blank %}

That's all.
I hope you find this helpful.
