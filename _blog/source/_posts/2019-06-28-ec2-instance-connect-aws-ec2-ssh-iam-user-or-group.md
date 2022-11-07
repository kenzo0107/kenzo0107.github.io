---
layout: post
title: EC2 Instance Connect で AWS EC2 への ssh 管理を IAM User or Group で簡単に♪
date: 2019-06-28
tags:
  - AWS
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190628/20190628154100.png
---

## 概要

2019-06-28 に <a href="https://aws.amazon.com/jp/about-aws/whats-new/2019/06/introducing-amazon-ec2-instance-connect/">EC2 Instance Conncet</a> が発表されました！

<p>これによって、セキュリティグループと IAM 権限で ssh アクセス許可が可能になります。</p>

<p>例えば、<br/>
会社の IP からのみ、特定の IAM User Group に所属している IAM User に ssh アクセス権限を付与、<br/>
別のプロジェクトへ異動した、退職した場合は、その IAM User Group から削除で ssh アクセス権限を剥奪できます。</p>

<!-- more -->

## 試験環境

<p>macOS 10.14.3 で試しました。</p>

## 事前準備

<pre class="code" data-lang="" data-unlink>$ pip install -U awscli

$ aws s3api get-object --bucket ec2-instance-connect --key cli/ec2instanceconnectcli-latest.tar.gz ec2instanceconnectcli-latest.tar.gz

$ sudo pip install ec2instanceconnectcli-latest.tar.gz</pre>

<p>発行した IAM User のパーミッション権限に以下を追加</p>

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

<p>この辺りは terraform 管理案件ですね。</p>

## EC2 Instance Conncect 対応 OS

<ul>
<li>Ubuntu>=16.04</li>
<li>AmazonLinux2>=2.0.20190618</li>
</ul>

## ssh ログインする EC2 側の設定

### Ubuntu>=16.04

<p>ec2-instance-connect をインストールしておく必要があります。</p>

<pre class="code" data-lang="" data-unlink>$ sudo apt-get update && sudo apt-get install ec2-instance-connect</pre>

<pre class="code" data-lang="" data-unlink>$ dpkg -l | grep ec2-instance-connect

ii  ec2-instance-connect           1.1.9-0ubuntu3~18.04.1            all          Configures ssh daemon to accept EC2 Instance Connect ssh keys</pre>

### AmazonLinux2>=2.0.20190618

<p>ec2-instance-connect は設定済みです。</p>

### セキュリティグループ

<p>ssh ログイン先となる EC2 インスタンスのセキュリティグループはアクセス元から ssh (22 port) を開けておく必要があります。</p>

## ssh ログインしてみる

<pre class="code" data-lang="" data-unlink>local%$ mssh ubuntu@i-0f123456abcdefg --profile &lt;profile&gt; --region ap-northeast-1</pre>

<p>一見、誰しもが ubuntu でログインしていて監査が不安になりますが、 CloudTrail  はちゃんと誰がログインしたか見ています。</p>

### CloudTrail

<p><figure class="figure-image figure-image-fotolife" title="CloudTrail"><span itemscope itemtype="https://schema.org/Photograph"><img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190628/20190628160255.png" alt="f:id:kenzo0107:20190628160255p:plain" title="f:id:kenzo0107:20190628160255p:plain" class="hatena-fotolife" itemprop="image"></span><figcaption>CloudTrail</figcaption></figure></p>

<p>以下イベントでログが残っています。</p>

<ul>
<li>SendSSHPublicKey</li>
<li>DescribeInstances</li>
</ul>

<p>SendSSHPublicKey の「イベントの表示」ボタンクリックで JSON が表示されますが、その中で、アクセス元 IP, IAM User Arn、アクセス先 インスタンスIDがわかります。</p>

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

<p>こちらで EC2 インスタンスのアクセス履歴等はわかります。</p>

## まとめ

<p>これまで ssh アカウント管理は手間でしたが、IAM 権限での管理によって非常に楽になりました♪</p>

<p>CloudTrail で監査もバッチリ！</p>
