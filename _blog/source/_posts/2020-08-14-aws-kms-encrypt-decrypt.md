---
title: aws-cli KMS で暗号化・復号
tags:
- AWS
date: 2020-08-14
---

備忘録です。

### 暗号化

```
aws kms encrypt --key-id alias/<kms鍵> --plaintext "<暗号化したい文字列>" --output text --query CiphertextBlob
```

### 復号

```
aws kms decrypt --ciphertext-blob fileb://<(echo '文字列'|base64 -d) | jq .Plaintext --raw-output |base64 -d
```