---
layout: post
title: How to Create a Password-Protected Zip File on Mac OS X
date: 2015-03-11
category: Infrastructure
lang: en
translation_id: how-to-make-zipfile-with-password-on-macosx
permalink: en/2015/03/11/how-to-make-zipfile-with-password-on-macosx/
cover: /img/cover/2015-03-11-how-to-make-zipfile-with-password-on-macosx.svg
---

## Overview
When sending documents and other materials to a client, you typically split them across two emails using a password-protected compressed file.

1st email: the compressed file as an attachment
2nd email: the password for the compressed file

For situations like these, I've put together below the method I often use for creating password-protected zip files in the Terminal.

## Steps

### Generating a Password

{% gist kenzo0107/f51977b8ee502fceac40 %}

Save the generated password.

### Creating a Password-Protected Zip File

{% gist kenzo0107/0b6f41af9a8625ccfe61 %}

That's it.
