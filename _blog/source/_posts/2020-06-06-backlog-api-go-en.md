---
title: I Built Backlog API in Go
category: Go
tags:
- Go
date: 2020-06-06
lang: en
translation_id: backlog-api-go
permalink: en/2020/06/06/backlog-api-go/
cover: /img/cover/2020-06-06-backlog-api-go.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## I Built Backlog API in Go

{% linkPreview https://github.com/kenzo0107/backlog _blank %}

I'm currently in the process of adding support for more APIs.

## Why I Built the Backlog API

I had a task to migrate from a certain knowledge management system over to Backlog, and I thought, "Let's build a migration tool!" — which meant I needed an API.

Previously, when I built a tool with SAM that sends a Slack DM to "users we want to notify" mentioned in Backlog comments, I handled the API using [griffin-stewie/go-backlog](https://github.com/griffin-stewie/go-backlog).

{% linkPreview https://kenzo0107.github.io/2020/02/25/2020-02-25-backlog-comment-slack-dm/ _blank %}

However,
[griffin-stewie/go-backlog](https://github.com/griffin-stewie/go-backlog) had not been updated since January 2018...

For example, it lacks an API to upload a file and add it to a Backlog Wiki.

So I thought, "In that case!" and decided to build my own.

{% linkPreview https://github.com/kenzo0107/backlog _blank %}

Commits & sponsorships are very welcome m(_ _)m
