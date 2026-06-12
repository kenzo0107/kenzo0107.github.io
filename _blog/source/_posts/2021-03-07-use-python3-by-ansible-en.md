---
title: Specifying Python3 on Ansible Target Hosts to Run pip install
tags:
  - Ansible
date: 2021-03-07
lang: en
translation_id: use-python3-by-ansible
permalink: en/2021/03/07/use-python3-by-ansible/
cover: https://i.imgur.com/aKWcTG7.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## Overview

On a Raspberry Pi Zero WH, running `python -V` returned `Python 2.7.16`.

The Raspberry Pi setup is managed with Ansible, so I was wondering whether I should
`unlink python` and `ln -s /usr/bin/python3 /usr/bin/python` via Ansible.
But it turned out there was a much simpler way, so here's a quick note.

## OS Version Information

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

## The Thumbnail Says It All, but Just in Case

The following ansible.cfg setting is all there is to it.

- ansible.cfg

```
[defaults]
interpreter_python=/usr/bin/python3
```

- tasks/main.yml

```
# NOTE: use it as pip3
- name: pip3 install packages
  pip:
    name:
      - mh_z19
```

After running `ansible-playbook`:

```
// python2 is linked to /usr/bin/python
$ ls -al /usr/bin/python
lrwxrwxrwx 1 root root 7 Mar  6 15:22 /usr/bin/python -> python2

$ python -V
Python 2.7.16

// confirm that the module is not installed for python2
// pip list would also work, but this gives a clearer message, so I use this
$ sudo python -m mh_z19
/usr/bin/python: No module named mh_z19

$ python3 -V
Python 3.7.3

// confirm that the module is installed for python3
$ sudo python3 -m mh_z19
{"co2": 695}
```

Without bothering to switch the linked python, I was able to simply specify the Python version and use it!

That's all.
I hope this is helpful.
