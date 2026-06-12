---
layout: post
title: Install Sentry with Ansible! Up and Running in Under 10 Minutes
date: 2015-05-10
lang: en
translation_id: install-sentry-by-ansible
permalink: en/2015/05/10/install-sentry-by-ansible/
cover: /img/cover/2015-05-10-install-sentry-by-ansible.svg
---

## What is Sentry

Sentry is a tool that receives and aggregates event logs sent from your applications.
It can also be used to manage error logs.

It charts things like whether an error has been resolved, and how frequently it occurs.

It supports multiple languages and lets even non-engineer project members stay aware of error logs, which makes it useful in that regard as well.

## Overview

I previously wrote an article titled [Installing Sentry on MacOSX + Vagrant (CentOS7) and Verifying It Works](https://kenzo0107.github.io/2015/04/10/2015-04-11-install-sentry-on-centos7/),
and this time I have bundled that up with Ansible.

## Environment

- MacOSX 10.10.3 Yosemite
- Virtual Box 4.3.26
- Vagrant 1.7.2
- ansible 1.9.1
- CentOS7

## Procedure

Please refer to the README on GitHub.
Following the steps, you can have it up and running in 10 minutes.

https://github.com/kenzo0107/vagrant-ansible-sentry-centos7
