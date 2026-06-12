---
layout: post
title: How to Log In to the EC-CUBE Admin Panel Without a Password
date: 2015-03-18
category: Infrastructure
lang: en
translation_id: login-without-password-to-admin
permalink: en/2015/03/18/login-without-password-to-admin/
cover: /img/cover/2015-03-18-login-without-password-to-admin.svg
---

## Overview
Here is a summary of how to log in to the admin panel of an EC-CUBE package without any login credentials.

I did the following when no one knew the admin password and we couldn't access the panel.

{% gist kenzo0107/b3afdecfb7afa6b641df %}


After making the changes above, you can log in without a password.

## After Logging In

+ Reset the password from System Settings > Member Management.
+ Revert the source code to its original state.
