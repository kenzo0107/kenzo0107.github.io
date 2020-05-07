---
layout: post
title: EC2 Instance Connect API で ssh ログインできるインタラクティブ cli tool "omssh" を作ってみました。
date: 2019-08-04
tags:
- AWS
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190804/20190804180237.png
---

## 概要

<p>oreno-mssh、またの名を <a href="https://github.com/kenzo0107/omssh">omssh</a> という AWS EC2 Instance Connect API を利用した ssh ログインツールを作成しました。</p>

<p><blockquote class="imgur-embed-pub" lang="en" data-id="YRcyWzC"><a href="https://imgur.com/YRcyWzC">View post on imgur.com</a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script><cite class="hatena-citation"><a href="https://imgur.com/YRcyWzC">imgur.com</a></cite></p>

<!-- more -->

## 作ろうと思った経緯

<p>以前 EC2 Instance Connect API の登場により、EC2 Instance ID 指定で ssh ログインできる様になりました。</p>

<p>これにより、ssh ログイン接続するメンバーに秘密鍵を渡す、公開鍵を登録する等の作業が不要となりました。</p>

{% linkPreview https://kenzo0107.github.io/2019/06/28/2019-06-28-ec2-instance-connect-aws-ec2-ssh-iam-user-or-group/ _blank %}

<p><a href="https://dev.classmethod.jp/cloud/aws/ec2-instance-connect/">mssh</a> を使用した場合、以下の様なコマンドで ssh ログインできます。</p>

<pre class="code" data-lang="" data-unlink>// Amazon Linux への ssh
mssh &lt;EC2 Instance ID&gt; --profile &lt;profile&gt;

// Ubuntu
mssh ubuntu@&lt;EC2 Instance ID&gt; --profile &lt;profile&gt;</pre>


<p>mssh を利用するには `&lt;EC2 Instance ID&gt;` 情報が必要で、毎回 Instance ID を調べる手間がありました。</p>

<p>もちろん踏み台サーバであれば、そうそう再起動され Instance ID が変更されることはないのでメモっておけば良いのでしょうが、
数が多くなると、管理が大変です。</p>

<p>その手間を <a href="https://github.com/ktr0731/go-fuzzyfinder">fuzzyfinder</a> でインタラクティブに解決しようと思いました。</p>

## 使用方法

<p>README.md にもありますが、以下ステップでインストールできます。</p>

<pre class="code" data-lang="" data-unlink>$ git clone https://github.com/kenzo0107/omssh
$ cd omssh
$ make build &amp;&amp; make install</pre>


## 今後

<p>現在、EC2 Instance Connect を利用した運用に切り替えきれないところがあります。</p>

<p>理由は、EC2 インスタンスを Public Subnet に配置していないと EC2 Instance Connect API が利用できない為、踏み台までは EC2 Instance Connect API を利用し ssh ログインできたけど、その先は、秘密鍵が必要になる為です。</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190804/20190804180237.png" width="100%">
</div>

おそらく近々 Private Subnet でも EC2 Instance Connect が利用できる様になるのでは？と期待しています。

そうなれば、踏み台にも omssh を置いて、鍵を意識せず、 IAM の権限だけで、 ssh 権限を管理できる様な世界が実現できます。

AWS サポートに願いを伝えておきます♪
