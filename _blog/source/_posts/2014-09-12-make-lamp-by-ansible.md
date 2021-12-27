---
layout: post
title: Ansible でサーバ環境構築
date: 2014-09-12
---

## 目的
Ansible でLAMP環境を構築する


## 経緯
Chefでサーバ環境構築していましたが、
設定ファイルが多い印象を持っていた為、
より敷居が低いという噂のAnsibleでの構築を考えました。


## 覚える為に

徐々に設定していく項目を増やしていく、
という方針で進めます。

個人的経験上ですが、
gitやQiitaでplaybookを見ていてもどの記述で何を実現しているか
を理解するのはとっつきにくく、理解せず実現させてしまう可能性もあるからです。



* playbook.yml
```
---
- hosts: test-servers
  sudo: yes

  tasks:
    # Apache
    - name: be sure httpd is installed
      yum: name=httpd state=installed

    - name: be sure httpd is running and enabled
      service: name=httpd state=running enabled=yes
```


## あとがき

以下サイトが大変参考になりました。

http://yteraoka.github.io/ansible-tutorial/

参考サイトを手順通り実行しても出来ない！
ということがよくあるので、
その際はサイトURLとできなかったことをまとめておくと
良いと思いました。

できないできない、と色々ネットサーフィンしてたら
また同じサイトを見てたりということもあるので。
