---
title: Ansible のターゲットホストで Python3 を指定し pip install する
tags:
- Ansible
date: 2021-03-07
thumbnail: https://i.imgur.com/aKWcTG7.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## 概要

Raspberry PI Zero WH で、 `python -V` すると `Python 2.7.16` が返ってきた。

Raspberry PI のセットアップは Ansible で管理しており、
Ansible で `unlink python` して `ln -s /usr/bin/python3 /usr/bin/python` をすれば良いのかな？
と思っていたら、もっとシンプルにできたのでメモ。


## OS バージョン情報は以下の通り

```
$ cat /etc/os-release

PRETTY_NAME="Raspbian GNU/Linux 10 (buster)"
NAME="Raspbian GNU/Linux"
VERSION_ID="10"
VERSION="10 (buster)"
VERSION_CODENAME=buster
ID=raspbian
ID_LIKE=debian
HOME_URL="http://www.raspbian.org/"
SUPPORT_URL="http://www.raspbian.org/RaspbianForums"
BUG_REPORT_URL="http://www.raspbian.org/RaspbianBugs"
```


## サムネイルが全てですが、一応

以下の ansible.cfg の設定が全てです。

* ansible.cfg

```
[defaults]
interpreter_python=/usr/bin/python3
```

* tasks/main.yml
```
# NOTE: pip3 として利用する
- name: pip3 install packages
  pip:
    name:
      - mh_z19
```

`ansible-playbook` 実行後、

```
// /usr/bin/python には python2 がリンクされている
$ ls -al /usr/bin/python
lrwxrwxrwx 1 root root 7 Mar  6 15:22 /usr/bin/python -> python2

$ python -V
Python 2.7.16

// python2 にモジュールがインストールされていないことを確認
// pip list でも良いが、メッセージがわかりやすいのでこの記述にしている
$ sudo python -m mh_z19
/usr/bin/python: No module named mh_z19

$ python3 -V
Python 3.7.3

// python3 でモジュールがインストールされていることを確認
$ sudo python3 -m mh_z19
{"co2": 695}
```

わざわざリンクされている python を切り替えなくてもシンプルに Python バージョンを指定して利用できた！

以上
参考になれば幸いです。
