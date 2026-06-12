---
title: Encrypting and Decrypting with the aws-cli KMS
tags:
- AWS
date: 2020-08-14
lang: en
translation_id: aws-kms-encrypt-decrypt
permalink: en/2020/08/14/aws-kms-encrypt-decrypt/
cover: /img/cover/2020-08-14-aws-kms-encrypt-decrypt.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

Just a memo for myself.

### Encryption

aws cli ver.1

```
aws kms encrypt --key-id alias/<kms鍵> --plaintext "<暗号化したい文字列>" --output text --query CiphertextBlob
```

aws cli ver.2

```
aws kms encrypt --key-id alias/<kms鍵> --plaintext "$(echo -n '<暗号化したい文字列>' | base64)" --output text --query CiphertextBlob
```

### Decryption

```
aws kms decrypt --ciphertext-blob fileb://<(echo '文字列'|base64 -d) | jq .Plaintext --raw-output |base64 -d
```
