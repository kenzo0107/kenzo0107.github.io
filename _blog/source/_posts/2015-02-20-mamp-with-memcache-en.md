---
layout: post
title: Installing Memcache on MAMP and Running It with PHP
date: 2015-02-20
categories:
  - [Database]
  - [Infrastructure]
lang: en
translation_id: mamp-with-memcache
permalink: en/2015/02/20/mamp-with-memcache/
cover: /img/cover/2015-02-20-mamp-with-memcache.svg
---

## Overview
I wanted to install Memcache in my local development environment.

## Environment
MacOSX Yosemite 10.10.1
MAMP3.0.7.3

## Note
What we are installing is Memcache. It is NOT Memcache<span style="color: #d32f2f">d</span>.

## ToDo

+ Download and compile the Memcache source
+ Load memcache.so from php.ini
+ Restart MAMP

## Steps

- Download and compile the Memcache source
- Load memcache.so from php.ini

{% gist kenzo0107/dbcb15cbda2f3f85da27 %}

- Sample usage from PHP

{% gist kenzo0107/365890fe3fd6e44c1fc2 %}

That's all.
