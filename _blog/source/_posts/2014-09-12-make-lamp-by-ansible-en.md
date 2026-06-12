---
layout: post
title: Building a Server Environment with Ansible
date: 2014-09-12
lang: en
translation_id: make-lamp-by-ansible
permalink: en/2014/09/12/make-lamp-by-ansible/
cover: /img/cover/2014-09-12-make-lamp-by-ansible.svg
---

## Goal
Build a LAMP environment with Ansible.


## Background
I had been building server environments with Chef, but
I felt it required a lot of configuration files,
so I decided to try building with Ansible, which is rumored to have a lower barrier to entry.


## To learn it

I'll proceed with the approach of gradually increasing the number of items I configure.

This is based on my personal experience: when looking at playbooks on GitHub or Qiita,
it's hard to grasp which statement accomplishes what,
and there's a risk of getting things working without actually understanding them.



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


## Afterword

The following site was very helpful.

http://yteraoka.github.io/ansible-tutorial/

It often happens that even when you follow a reference site's steps exactly, things just don't work!
When that happens, I thought it would be good to make a note of the site URL along with what didn't work.

Because while grumbling "it doesn't work, it doesn't work" and surfing the net,
you sometimes end up looking at the very same site again.
