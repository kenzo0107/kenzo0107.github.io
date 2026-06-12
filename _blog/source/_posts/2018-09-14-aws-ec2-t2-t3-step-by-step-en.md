---
layout: post
title: Step-by-Step Guide to Migrating AWS EC2 from t2 to t3
date: 2018-09-14
category: AWS
lang: en
translation_id: aws-ec2-t2-t3-step-by-step
permalink: en/2018/09/14/aws-ec2-t2-t3-step-by-step/
tags:
  - AWS
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180914/20180914130511.jpg
---

## Overview

<p>With the arrival of the t3 instance family on AWS EC2, I expected the migration to be a breeze, but I ran into a few snags. This post summarizes where I got stuck.</p>

<p>The instance I worked with this time was an HVM instance running ubuntu 16.04.5 LTS.</p>

## What makes t3 better than t2?

<ul>
<li><a href="https://aws.amazon.com/jp/ec2/pricing/on-demand/">Cheaper!</a> <a href="#f-9c1c347d" name="fn-9c1c347d" title="本稿執筆時 2018-09-14">*1</a></li>
<li>With t2.small and below, the number of virtual cores was 1, but with t3 it's doubled!</li>
<li><a href="https://docs.aws.amazon.com/ja_jp/AWSEC2/latest/UserGuide/t2-credits-baseline-concepts.html">For the same instance size, t3 grants twice the credits of t2!</a></li>
<li><a href="https://docs.aws.amazon.com/ja_jp/AWSEC2/latest/UserGuide/t2-unlimited.html">Unlimited credit mode is enabled by default!</a></li>
<li>EBS optimization is enabled by default</li>
</ul>

<!-- more -->

## The general flow of migrating from t2 to t3

<p>In short, you need to install the ena module and enable EC2 ENA support.</p>

<ol>
<li>Stop the t2 instance</li>
<li>Create an AMI</li>
<li>Start the t2 instance</li>
<li>Install the kernel module (ena) on the t2 instance</li>
<li>Verify the ena module installation</li>
<li>Stop the t2 instance</li>
<li>Change the instance type to t3 (if you also want credit: unlimited, do it here)</li>
<li>Start the t3 instance</li>
</ol>

### What is ENA?

<p><a href="https://aws.amazon.com/jp/blogs/news/elastic-network-adapter-high-performance-network-interface-for-amazon-ec2/">Elastic Network Adapter – A High-Performance Network Interface for Amazon EC2</a></p>

<blockquote><p>It is built to lighten the processor's workload and to create a short, efficient path between the vCPUs that generate or process network packets.</p></blockquote>

<p>The page <a href="https://docs.aws.amazon.com/ja_jp/AWSEC2/latest/UserGuide/enhanced-networking-ena.html#enhanced-networking-ena-ubuntu">Enabling Enhanced Networking with the Elastic Network Adapter (ENA) on Linux Instances</a> states the following.</p>

<blockquote><p>Amazon EC2 provides enhanced networking capabilities to C5, C5d, F1, G3, H1, I3, m4.16xlarge, M5, M5d, P2, P3, R4, R5, R5d, X1, X1e, and z1d instances via the Elastic Network Adapter (ENA).</p>

<p>Enhanced networking cannot be managed from the Amazon EC2 console.</p>

<p>Supported only on HVM instances</p></blockquote>

### To summarize,

<ul>
<li>A high-performance network interface for Amazon EC2</li>
<li>Supported in HVM (Hardware-assisted VM: full virtualization) environments.</li>
<li>Not supported in PV (ParaVirtual: paravirtualization) environments.</li>
<li>By going through the kernel module called ENA, the instance can use enhanced networking capabilities.</li>
</ul>

<p>You can check pv/hvm under the "Virtualization" item in the EC2 description in the AWS console.<br/>
If it's pv, you'll need to consider migrating to hvm.</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180914/20180914130817.png" width="100%">
</div>

<p>Let's proceed with the configuration below.</p>

<h1>Procedure for Enabling ENA</h1>

<p>The following assumptions apply.</p>

<ul>
<li>A backup, such as taking an AMI, has been completed.</li>
<li>Migrating from t2.small to t3.small.</li>
</ul>

## Enabling enhanced networking on Ubuntu

<pre class="code" data-lang="" data-unlink>ubuntu:~$ sudo apt-get update && sudo apt-get upgrade -y linux-aws</pre>

<p>How to handle other OSes is also described in the earlier <a href="https://docs.aws.amazon.com/ja_jp/AWSEC2/latest/UserGuide/enhanced-networking-ena.html#enhanced-networking-ena-ubuntu">Enabling Enhanced Networking with the Elastic Network Adapter (ENA) on Linux Instances</a>.</p>

### If the error W: mdadm: /etc/mdadm/mdadm.conf defines no arrays. occurs

<p>Add the following line to the `/etc/mdadm/mdadm.conf` file.</p>

<pre class="code" data-lang="" data-unlink>ARRAY &lt;ignore&gt; devices=&lt;ルートデバイス&gt;</pre>

<p>In my case, I appended the following line at the very bottom, and when I ran the command again it went through.</p>

<pre class="code" data-lang="" data-unlink>ARRAY &lt;ignore&gt; devices=/dev/sda1</pre>

## Displaying information about the ena kernel module

<p>Run `modinfo ena`, and if it displays output like the following, you're good.</p>

<pre class="code" data-lang="" data-unlink>ubuntu:~$ modinfo ena

filename:       /lib/modules/4.4.0-81-generic/kernel/drivers/net/ethernet/amazon/ena/ena.ko
version:        1.1.2
license:        GPL
description:    Elastic Network Adapter (ENA)
author:         Amazon.com, Inc. or its affiliates
...</pre>

## Enabling EC2 ENA support

<pre class="code" data-lang="" data-unlink>// Stop the instance
macOS%$ aws ec2 stop-instances --instance-ids &lt;instance id&gt;

// Configure ENA support
macOS%$ aws ec2 modify-instance-attribute --instance-id &lt;instance id&gt; --ena-support true

// EBS optimization (optional)
macOS%$ aws ec2 modify-instance-attribute --instance-id &lt;instance id&gt; --ebs-optimized

// credit unlimited setting (optional)
macOS%$ aws ec2 modify-instance-credit-specification --instance-credit-specification &#34;InstanceId=i-&lt;instance id&gt;,CpuCredits=unlimited&#34;

// Change the instance type
macOS%$ aws ec2 modify-instance-attribute --instance-id &lt;instance id&gt; --instance-type t3.small

// Start the instance
macOS%$ aws ec2 start-instances --instance-ids &lt;instance id&gt;</pre>

<p>And with that, I was able to make my t3 debut ♪</p>

## References

<ul>
<li><a href="https://docs.aws.amazon.com/ja_jp/AWSEC2/latest/UserGuide/enhanced-networking-ena.html#enhanced-networking-ena-ubuntu">Enabling Enhanced Networking with the Elastic Network Adapter (ENA) on Linux Instances</a></li>
<li><a href="https://askubuntu.com/questions/834903/i-dont-have-a-raid-but-get-the-warning-mdadm-conf-defines-no-arrays">Stack Exchange: I don't have a RAID but get the warning mdadm.conf defines no arrays</a></li>
</ul>
