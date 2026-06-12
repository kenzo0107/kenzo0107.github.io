---
layout: post
title: I built "omssh", an interactive CLI tool for SSH login via the EC2 Instance Connect API
date: 2019-08-04
category: AWS
lang: en
translation_id: ec2-instance-connect-api-ssh-cli-tool-omssh
permalink: en/2019/08/04/ec2-instance-connect-api-ssh-cli-tool-omssh/
tags:
  - AWS
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190804/20190804180237.png
---

## Overview

<p>I created an SSH login tool called oreno-mssh, also known as <a href="https://github.com/kenzo0107/omssh">omssh</a>, which leverages the AWS EC2 Instance Connect API.</p>

<p><blockquote class="imgur-embed-pub" lang="en" data-id="YRcyWzC"><a href="https://imgur.com/YRcyWzC">View post on imgur.com</a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script><cite class="hatena-citation"><a href="https://imgur.com/YRcyWzC">imgur.com</a></cite></p>

<!-- more -->

## Why I Decided to Build It

<p>With the arrival of the EC2 Instance Connect API, it became possible to SSH into an instance simply by specifying its EC2 Instance ID.</p>

<p>This eliminated the need to hand out private keys to members who connect via SSH, register public keys, and so on.</p>

{% linkPreview https://kenzo0107.github.io/2019/06/28/2019-06-28-ec2-instance-connect-aws-ec2-ssh-iam-user-or-group/ _blank %}

<p>When using <a href="https://dev.classmethod.jp/cloud/aws/ec2-instance-connect/">mssh</a>, you can SSH in with commands like the following.</p>

<pre class="code" data-lang="" data-unlink>// SSH into Amazon Linux
mssh &lt;EC2 Instance ID&gt; --profile &lt;profile&gt;

// Ubuntu
mssh ubuntu@&lt;EC2 Instance ID&gt; --profile &lt;profile&gt;</pre>

<p>To use mssh, you need the `&lt;EC2 Instance ID&gt;` information, and it was a hassle to look up the Instance ID every single time.</p>

<p>Of course, for a bastion server you could just jot it down, since it rarely gets restarted and the Instance ID rarely changes. But as the number of servers grows, this becomes hard to manage.</p>

<p>I decided to solve that hassle interactively with <a href="https://github.com/ktr0731/go-fuzzyfinder">fuzzyfinder</a>.</p>

## Usage

<p>As described in the README.md, you can install it with the following steps.</p>

<pre class="code" data-lang="" data-unlink>$ git clone https://github.com/kenzo0107/omssh
$ cd omssh
$ make build && make install</pre>

## Going Forward

<p>At the moment, there are still cases where I can't fully switch over to an EC2 Instance Connect–based workflow.</p>

<p>The reason is that the EC2 Instance Connect API can only be used when the EC2 instance is placed in a Public Subnet. So while I can SSH into the bastion using the EC2 Instance Connect API, anything beyond that still requires a private key.</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190804/20190804180237.png" width="100%">
</div>

I'm hopeful that, before long, EC2 Instance Connect will become usable in Private Subnets as well.

If that happens, I could place omssh on the bastion too, and a world becomes possible where SSH access is managed purely through IAM permissions, without ever having to think about keys.

I'll be sure to pass my wish along to AWS Support ♪
