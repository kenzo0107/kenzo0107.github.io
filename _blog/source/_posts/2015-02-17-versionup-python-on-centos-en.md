---
layout: post
title: Upgrading Python on CentOS
date: 2015-02-17
categories:
  - [Python]
  - [Infrastructure]
lang: en
translation_id: versionup-python-on-centos
permalink: en/2015/02/17/versionup-python-on-centos/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160223/20160223123929.jpg
---

## Background

I wanted to use pysftp, but the pre-installed 2.4 series was too old and didn't work, so I'm upgrading to a working version in the 2.7 series.

## Environment

CentOS5.8 (Final)

## Python Version to Install

Python2.7.6

## Installation Steps

Installing with yum pulls in other unnecessary modules and overwrites dependencies, so I build from source.

{% gist kenzo0107/5433674dd4e54ec5edfe %}

- Install pip

{% gist kenzo0107/1524267337a7b1f2a478 %}

- Install paramiko and pysftp

{% gist kenzo0107/10bddf345c47302e8bc1 %}

## Summary

No Apache restart required, and the existing Python version was left in place.
