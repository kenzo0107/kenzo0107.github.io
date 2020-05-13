---
layout: post
title: AWS EC2 t2 から t3 へ移行する為の step by step
date: 2018-09-14
tags:
- AWS
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180914/20180914130511.jpg
---

## 概要

<p>AWS EC2 に t3 系インタスタンスが登場した為、サクッとできるかと思いきや、つまづいた箇所をまとめました。</p>

<p>今回対象のインスタンスは HVM で ubuntu 16.04.5 LTS を使用しました。</p>

## t2 と比べて t3 は何がいいの？

<ul>
<li><a href="https://aws.amazon.com/jp/ec2/pricing/on-demand/">安い！</a> <a href="#f-9c1c347d" name="fn-9c1c347d" title="本稿執筆時 2018-09-14">*1</a></li>
<li>t2.small 以下は仮装コア数が 1 でしたが、 t3 では 2 倍！</li>
<li><a href="https://docs.aws.amazon.com/ja_jp/AWSEC2/latest/UserGuide/t2-credits-baseline-concepts.html">t2 と t3 、同じインスタンスサイズでクレジットが倍！</a></li>
<li><a href="https://docs.aws.amazon.com/ja_jp/AWSEC2/latest/UserGuide/t2-unlimited.html">クレジットが無制限モードデフォルトで有効！</a></li>
<li>EBS 最適化がデフォルトで有効</li>
</ul>

<!-- more -->

## t2 から t3 へ移行する大まかな流れ

<p>要は、ena モジュールをインストールし、EC2 ENA サポートを有効化する必要がありました。</p>

<ol>
<li>t2 インスタンス停止</li>
<li>AMI 作成</li>
<li>t2 インスタンス起動</li>
<li>t2 インスタンスでカーネルモジュール(ena) のインストール</li>
<li>ena モジュールインストール確認</li>
<li>t2 インスタンス停止</li>
<li>インスタンスタイプを t3 へ変更 (credit: unlimited もしたい場合はここで)</li>
<li>t3 インスタンス起動</li>
</ol>


### ENA って？

<p><a href="https://aws.amazon.com/jp/blogs/news/elastic-network-adapter-high-performance-network-interface-for-amazon-ec2/">Elastic Network Adapter – Amazon EC2 向けの高性能パフォーマンスネットワークインターフェイス</a></p>

<blockquote><p>プロセッサのワークロードを軽くし、ネットワークパケットと生成または処理を行う vCPU 間で短く効率的なパスを作成するために構築されています。</p></blockquote>

<p><a href="https://docs.aws.amazon.com/ja_jp/AWSEC2/latest/UserGuide/enhanced-networking-ena.html#enhanced-networking-ena-ubuntu">Linux インスタンスにおける Elastic Network Adapter (ENA) を使用した拡張ネットワーキングの有効化</a> には以下のように記載があります。</p>

<blockquote><p>Amazon EC2 は、Elastic Network Adapter (ENA) を介して C5, C5d, F1, G3, H1, I3, m4.16xlarge, M5, M5d, P2, P3, R4, R5, R5d, X1, X1e, and z1d インスタンスに拡張されたネットワーキング機能を提供します。</p>

<p>拡張ネットワーキングは、Amazon EC2 コンソールから管理することはできません。</p>

<p>HVM インスタンスでのみサポート</p></blockquote>

### まとめると、

<ul>
<li>Amazon EC2 向けの高性能パフォーマンスネットワークインターフェイス</li>
<li>HVM (Hardware-assited VM:完全仮想化) 環境でサポートされている。</li>
<li>PV (ParaVirtual:準仮想化) 環境ではサポートされない。</li>
<li>ENA というカーネルモジュールを介す事で、インスタンスに拡張されたネットワーキング機能が利用できる。</li>
</ul>


<p>pv/hvm は AWS コンソール＞EC2 説明の「仮想化」の項目で確認できます。<br/>
pv の場合は、 hvm の移行を検討する必要があります。</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180914/20180914130817.png" width="100%">
</div>

<p>以下から設定に進みます。</p>

<h1>ENA 有効化設定手順</h1>

<p>以下前提とします。</p>

<ul>
<li>AMI を取る等のバックアップが済んでいる。</li>
<li>t2.small から t3.small に移行する。</li>
</ul>


## Ubuntu での拡張ネットワーキングの有効化

<pre class="code" data-lang="" data-unlink>ubuntu:~$ sudo apt-get update && sudo apt-get upgrade -y linux-aws</pre>


<p>他OSの対応法も先ほどの <a href="https://docs.aws.amazon.com/ja_jp/AWSEC2/latest/UserGuide/enhanced-networking-ena.html#enhanced-networking-ena-ubuntu">Linux インスタンスにおける Elastic Network Adapter (ENA) を使用した拡張ネットワーキングの有効化</a> に記載されています。</p>

### W: mdadm: /etc/mdadm/mdadm.conf defines no arrays. エラーが発生した場合

<p>`/etc/mdadm/mdadm.conf` ファイルに以下一文を追記します。</p>

<pre class="code" data-lang="" data-unlink>ARRAY &lt;ignore&gt; devices=&lt;ルートデバイス&gt;</pre>


<p>自分の場合は以下の一文を一番下に追記して、もう一度 コマンド実行したら通りました。</p>

<pre class="code" data-lang="" data-unlink>ARRAY &lt;ignore&gt; devices=/dev/sda1</pre>


## ena カーネルモジュールに関する情報表示

<p>`modinfo ena` を実行し以下のように表示されれば OK です。</p>

<pre class="code" data-lang="" data-unlink>ubuntu:~$ modinfo ena

filename:       /lib/modules/4.4.0-81-generic/kernel/drivers/net/ethernet/amazon/ena/ena.ko
version:        1.1.2
license:        GPL
description:    Elastic Network Adapter (ENA)
author:         Amazon.com, Inc. or its affiliates
...</pre>


## EC2 ENA サポート有効化

<pre class="code" data-lang="" data-unlink>// インスタンス停止
macOS%$ aws ec2 stop-instances --instance-ids &lt;instance id&gt;

// ENA サポート設定
macOS%$ aws ec2 modify-instance-attribute --instance-id &lt;instance id&gt; --ena-support true

// EBS 最適化 (任意)
macOS%$ aws ec2 modify-instance-attribute --instance-id &lt;instance id&gt; --ebs-optimized

// credit unlimited 設定 (任意)
macOS%$ aws ec2 modify-instance-credit-specification --instance-credit-specification &#34;InstanceId=i-&lt;instance id&gt;,CpuCredits=unlimited&#34;

// インスタンスタイプ変更
macOS%$ aws ec2 modify-instance-attribute --instance-id &lt;instance id&gt; --instance-type t3.small

// インスタンス起動
macOS%$ aws ec2 start-instances --instance-ids &lt;instance id&gt;</pre>


<p>これで t3 デビューを飾ることができました♪</p>

## 参照

<ul>
<li><a href="https://docs.aws.amazon.com/ja_jp/AWSEC2/latest/UserGuide/enhanced-networking-ena.html#enhanced-networking-ena-ubuntu">Linux インスタンスにおける Elastic Network Adapter (ENA) を使用した拡張ネットワーキングの有効化</a></li>
<li><a href="https://askubuntu.com/questions/834903/i-dont-have-a-raid-but-get-the-warning-mdadm-conf-defines-no-arrays">Stack Exchange:I don't have a RAID but get the warning mdadm.conf defines no arrays</a></li>
</ul>
