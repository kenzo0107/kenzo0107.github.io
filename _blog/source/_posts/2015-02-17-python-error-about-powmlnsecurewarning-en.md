---
layout: post
title: 'Python Error Fix: PowmInsecureWarning: Not using mpz_powm_sec.  You should rebuild using libgmp >= 5 to avoid timing attack vulnerability.   _warn("Not using mpz_powm_sec.  You should rebuild using libgmp >= 5 to avoid timing attack vulnerability.", PowmInsec'
date: 2015-02-17
lang: en
translation_id: python-error-about-powmlnsecurewarning
permalink: en/2015/02/17/python-error-about-powmlnsecurewarning/
cover: /img/cover/2015-02-17-python-error-about-powmlnsecurewarning.svg
---


## Overview

When using pysftp, it complained that I should upgrade to gmp5 or higher.

pysftp requires paramiko, and the pycrypto that paramiko depends on is the one emitting the error.

## ToDo

Install gmp5
Rebuild python
Uninstall & reinstall pycrypto

## Steps

{% gist kenzo0107/7ff8994a65c7a97bf52a %}

That's it.
