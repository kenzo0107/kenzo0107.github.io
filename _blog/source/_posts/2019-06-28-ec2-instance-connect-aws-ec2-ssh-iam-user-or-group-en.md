---
layout: post
title: Easily Manage SSH Access to AWS EC2 by IAM User or Group with EC2 Instance Connect
date: 2019-06-28
category: AWS
lang: en
translation_id: ec2-instance-connect-aws-ec2-ssh-iam-user-or-group
permalink: en/2019/06/28/ec2-instance-connect-aws-ec2-ssh-iam-user-or-group/
tags:
  - AWS
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190628/20190628154100.png
---

## Overview

On 2019-06-28, <a href="https://aws.amazon.com/jp/about-aws/whats-new/2019/06/introducing-amazon-ec2-instance-connect/">EC2 Instance Connect</a> was announced!

<p>With this, you can grant SSH access permissions using security groups and IAM permissions.</p>

<p>For example,<br/>
you can grant SSH access permission only from the company's IP to IAM Users that belong to a specific IAM User Group,<br/>
and when someone moves to another project or leaves the company, you can revoke their SSH access permission simply by removing them from that IAM User Group.</p>

<!-- more -->

## Test Environment

<p>I tried this on macOS 10.14.3.</p>

## Prerequisites

<pre class="code" data-lang="" data-unlink>$ pip install -U awscli

$ aws s3api get-object --bucket ec2-instance-connect --key cli/ec2instanceconnectcli-latest.tar.gz ec2instanceconnectcli-latest.tar.gz

$ sudo pip install ec2instanceconnectcli-latest.tar.gz</pre>

<p>Add the following to the permissions of the IAM User you created</p>

<pre class="code" data-lang="" data-unlink>{
    &#34;Version&#34;: &#34;2012-10-17&#34;,
    &#34;Statement&#34;: [
        {
            &#34;Sid&#34;: &#34;EC2InstanceConnect&#34;,
            &#34;Action&#34;: [
                &#34;ec2:DescribeInstances&#34;,
                &#34;ec2-instance-connect:SendSSHPublicKey&#34;
            ],
            &#34;Effect&#34;: &#34;Allow&#34;,
            &#34;Resource&#34;: &#34;*&#34;
        }
    ]
}</pre>

<p>This is something you'd want to manage with terraform.</p>

## OSes Supported by EC2 Instance Connect

<ul>
<li>Ubuntu>=16.04</li>
<li>AmazonLinux2>=2.0.20190618</li>
</ul>

## Configuration on the EC2 Side You SSH Into

### Ubuntu>=16.04

<p>You need to install ec2-instance-connect in advance.</p>

<pre class="code" data-lang="" data-unlink>$ sudo apt-get update && sudo apt-get install ec2-instance-connect</pre>

<pre class="code" data-lang="" data-unlink>$ dpkg -l | grep ec2-instance-connect

ii  ec2-instance-connect           1.1.9-0ubuntu3~18.04.1            all          Configures ssh daemon to accept EC2 Instance Connect ssh keys</pre>

### AmazonLinux2>=2.0.20190618

<p>ec2-instance-connect is already configured.</p>

### Security Group

<p>The security group of the EC2 instance you SSH into must have SSH (port 22) open from the source.</p>

## Trying to SSH In

<pre class="code" data-lang="" data-unlink>local%$ mssh ubuntu@i-0f123456abcdefg --profile &lt;profile&gt; --region ap-northeast-1</pre>

<p>At first glance, it looks like everyone logs in as ubuntu, which might make you worried about auditing, but CloudTrail properly records who logged in.</p>

### CloudTrail

<p><figure class="figure-image figure-image-fotolife" title="CloudTrail"><span itemscope itemtype="https://schema.org/Photograph"><img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190628/20190628160255.png" alt="f:id:kenzo0107:20190628160255p:plain" title="f:id:kenzo0107:20190628160255p:plain" class="hatena-fotolife" itemprop="image"></span><figcaption>CloudTrail</figcaption></figure></p>

<p>Logs remain for the following events.</p>

<ul>
<li>SendSSHPublicKey</li>
<li>DescribeInstances</li>
</ul>

<p>Clicking the "View event" button on SendSSHPublicKey displays the JSON, in which you can see the source IP, IAM User Arn, and the target instance ID.</p>

<pre class="code" data-lang="" data-unlink>{
    &#34;eventVersion&#34;: &#34;1.05&#34;,
    &#34;userIdentity&#34;: {
        &#34;type&#34;: &#34;IAMUser&#34;,
        &#34;principalId&#34;: &#34;ABCDEFGHIJK....&#34;,
        &#34;arn&#34;: &#34;arn:aws:iam::123456789012:user/hogehoge&#34;,
        &#34;accountId&#34;: &#34;123456789012&#34;,
        &#34;accessKeyId&#34;: &#34;AKIxxxxxxxxxxxxxxxx&#34;,
        &#34;userName&#34;: &#34;hogehoge&#34;,
        &#34;sessionContext&#34;: {
            &#34;attributes&#34;: {
                &#34;mfaAuthenticated&#34;: &#34;false&#34;,
                &#34;creationDate&#34;: &#34;2019-06-28T06:18:50Z&#34;
            }
        }
    },
    &#34;eventTime&#34;: &#34;2019-06-28T06:18:51Z&#34;,
    &#34;eventSource&#34;: &#34;ec2-instance-connect.amazonaws.com&#34;,
    &#34;eventName&#34;: &#34;SendSSHPublicKey&#34;,
    &#34;awsRegion&#34;: &#34;ap-northeast-1&#34;,
    &#34;sourceIPAddress&#34;: &#34;xx.xxx.xxx.xxx&#34;,
    &#34;userAgent&#34;: &#34;aws-ec2-instance-connect-cli/1.0.0 Python/2.7.16 Darwin/18.2.0 Botocore/1.12.179&#34;,
    &#34;requestParameters&#34;: {
        &#34;instanceId&#34;: &#34;i-0f.......&#34;,
        &#34;osUser&#34;: &#34;ubuntu&#34;,
        &#34;SSHKey&#34;: {
            &#34;publicKey&#34;: &#34;ssh-rsa AAAAB....rHb&#34;
        }
    },
    &#34;responseElements&#34;: null,
    &#34;requestID&#34;: &#34;01234567-890a-1234-5b6d-......&#34;,
    &#34;eventID&#34;: &#34;f51...&#34;,
    &#34;eventType&#34;: &#34;AwsApiCall&#34;,
    &#34;recipientAccountId&#34;: &#34;123456789012&#34;
}</pre>

<p>With this, you can see the access history of the EC2 instance and so on.</p>

## Summary

<p>Managing SSH accounts used to be a hassle, but managing it with IAM permissions has made it remarkably easy!</p>

<p>And auditing with CloudTrail is rock solid!</p>
