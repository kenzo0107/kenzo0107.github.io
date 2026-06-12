---
layout: post
title: Migrating a GitHub Organization with CasperJS + PhantomJS
date: 2017-10-25
lang: en
translation_id: casperjs-phantomjs-github-organization
permalink: en/2017/10/25/casperjs-phantomjs-github-organization/
tags:
  - casperjs
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171025/20171025214738.png
---

## Overview

When migrating a GitHub Enterprise Organization, I drove the operation through a headless browser using CasperJS and PhantomJS.
Since there is no API for this on GitHub (I think?), I went with this approach.

To be honest, I had been enjoying building browser-based tests with CasperJS + PhantomJS, and since it just worked when I tried it, that's how I ended up adopting it.

## What is a headless browser?

It's a browser without a GUI that you use from the CLI.
It still has the features you'd expect for front-end testing, such as rendering pages, loading images, and logging in.

## Three-line summary

- Run the transfer process through browser operations, including login authentication, with CasperJS + PhantomJS
- After the migration, verify that the original URL redirects to the destination
- If the expected element can't be obtained within the time limit, capture the page

## Let's try it

Please refer to [Get Started](https://github.com/kenzo0107/transfer-repository-on-ghe#get-started).

{% linkPreview https://github.com/kenzo0107/transfer-repository-on-ghe _blank %}

The steps are also summarized below.

## Clone

```sh
macOS%$ git clone https://github.com/kenzo0107/ghe-org-transfer
macOS%$ cd ghe-org-transfer
```

## Edit the <your \*\*\*\*> parts in scripts/ghe-org-transfer.js

```js
var config = {
  // site root.
  siteRoot: 'https://<your github domain>',
  // Github Login path
  loginPath: '/login',
  // Github Login Account
  loginParams: {
    email: '<your email>',
    password: '<your password>',
  },
  viewportSize: {
    width: 3000,
    height: 2500,
  },
  paths: ['<your owner>/<your repository>'],
  destOrganization: '<your destination of organization>',
  reason: 'transfer this repository to new oragnization',
};
```

### Migration example

- ex) hoge/mywonderfulrepo ---> moge/mywonderfulrepo

```js
paths: [
  "hoge/mywonderfulrepo"
],
destOrganization: 'moge',
```

You can specify multiple entries in `paths` without any issues.

## Running the migration

```
macOS%$ make run
```

- Execution result

* Note: After the migration, it tests whether the original URL redirects.

```sh
[url] https://github.aiueo.com/hoge/mywonderfulrepo/settings
[step] fill '#transfer_confirm > form'
[step] input checkbox #team-59
[step] click the button labeled "Transfer"
(^-^) redirect ok:https://github.aiueo.co.jp/hoge/mywonderfulrepo to https://github.aiueo.co.jp/moge/mywonderfulrepo
```

## Wrap-up

Previously, the Grafana API for taking snapshots of Grafana graphs didn't work well, but I was able to capture them with CasperJS + PhantomJS instead.

Wow, so handy ♪

On a completely unrelated note, I tried challenges like getting past the reCAPTCHA used for site authentication, but couldn't make it work...
If anyone has pulled it off, please let me know m(\_ \_)m
