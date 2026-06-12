---
layout: post
title: 'Ansible FAILED! => {"msg": "to use the ''ssh'' connection type with passwords,
  you must install the ssh pass program"} on macOS'
date: 2019-09-19
lang: en
translation_id: ansible-failed-msg-to-use-the-ssh-connection-type-with-passwords-you-must-install-the-ssh-pass-program-on-macos
permalink: en/2019/09/19/ansible-failed-msg-to-use-the-ssh-connection-type-with-passwords-you-must-install-the-ssh-pass-program-on-macos/
cover: /img/cover/2019-09-19-ansible-failed-msg-to-use-the-ssh-connection-type-with-passwords-you-must-install-the-ssh-pass-program-on-macos.svg
tags:
- Ansible
- ssh
---

When I used Ansible on macOS, I ran into the error shown in the title.

Here is how to work around it.

```sh
brew install https://git.io/sshpass.rb
```

It took a little while for the installation to complete.

That's all.
I hope this helps.

## References

[Ansible 2.3.1 - sshpass Error](https://everythingshouldbevirtual.com/automation/ansible-2-3-1-sshpass-error/)
