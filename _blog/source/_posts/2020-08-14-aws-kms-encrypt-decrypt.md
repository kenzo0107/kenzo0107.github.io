---
title: aws-cli KMS で暗号化・復号
tags:
- AWS
date: 2020-08-14
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

備忘録です。

### 暗号化

aws cli ver.1

```
aws kms encrypt --key-id alias/<kms鍵> --plaintext "<暗号化したい文字列>" --output text --query CiphertextBlob
```

aws cli ver.2

```
aws kms encrypt --key-id alias/<kms鍵> --plaintext "$(echo -n '<暗号化したい文字列>' | base64)" --output text --query CiphertextBlob
```

### 復号

```
aws kms decrypt --ciphertext-blob fileb://<(echo '文字列'|base64 -d) | jq .Plaintext --raw-output |base64 -d
```
