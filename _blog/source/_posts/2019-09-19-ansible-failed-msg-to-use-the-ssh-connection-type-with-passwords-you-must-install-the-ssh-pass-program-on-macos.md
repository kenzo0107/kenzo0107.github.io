---
layout: post
title: 'Ansible FAILED! => {"msg": "to use the ''ssh'' connection type with passwords,
  you must install the ssh pass program"} on MacOS'
date: 2019-09-19
tags:
- Ansible
- ssh
---

MacOS で Ansible を利用した所、掲題のようなエラーが発生しました。

その際の対策です。

```sh
brew install https://git.io/sshpass.rb
```

インストール完了まで少々時間かかりました。

以上
参考になれば幸いです。

## 参照

[Ansible 2.3.1 - sshpass Error](https://everythingshouldbevirtual.com/automation/ansible-2-3-1-sshpass-error/)
