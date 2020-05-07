---
layout: post
title: AWS [Retirement Notification] 対応
date: 2017-04-18
tags:
- AWS
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170418/20170418105821.png
---

## 概要

とある日、AWS よりこんなメール通知が来ました。

要約すると
ホストしている基盤のハードウェアで回復不可能な障害が検知されたので
指定期限までに対応しないとインスタンスが停止する、とのこと。

今回こちらの対応をまとめました。

```
Dear Amazon EC2 Customer,

We have important news about your account (AWS Account ID: xxxxxxxxxxxx). EC2 has detected degradation of the underlying hardware hosting your Amazon EC2 instance (instance-ID: i-xxxxxxxx) in the ap-northeast-1 region. Due to this degradation, your instance could already be unreachable. After 2017-04-25 04:00 UTC your instance, which has an EBS volume as the root device, will be stopped.

You can see more information on your instances that are scheduled for retirement in the AWS Management Console (https://console.aws.amazon.com/ec2/v2/home?region=ap-northeast-1#Events)

* How does this affect you?
Your instance's root device is an EBS volume and the instance will be stopped after the specified retirement date. You can start it again at any time. Note that if you have EC2 instance store volumes attached to the instance, any data on these volumes will be lost when the instance is stopped or terminated as these volumes are physically attached to the host computer

* What do you need to do?
You may still be able to access the instance. We recommend that you replace the instance by creating an AMI of your instance and launch a new instance from the AMI. For more information please see Amazon Machine Images (http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html) in the EC2 User Guide. In case of difficulties stopping your EBS-backed instance, please see the Instance FAQ (http://aws.amazon.com/instance-help/#ebs-stuck-stopping).

* Why retirement?
AWS may schedule instances for retirement in cases where there is an unrecoverable issue with the underlying hardware. For more information about scheduled retirement events please see the EC2 user guide (http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-retirement.html). To avoid single points of failure within critical applications, please refer to our architecture center for more information on implementing fault-tolerant architectures: http://aws.amazon.com/architecture

If you have any questions or concerns, you can contact the AWS Support Team on the community forums and via AWS Premium Support at: http://aws.amazon.com/support

Sincerely,
Amazon Web Services
```



- AWS Console イベントを見ると一覧で表示されている。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170418/20170418095219.png" width="100%">
</div>

- AWS Console 詳細を見ると Notice が出ている。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170411/20170411215054.png" width="100%">
</div>

## ToDO

ボリュームタイプによって異なります。

- EBSボリューム
	- インスタンスの停止後、起動 (Reboot は ×)


- インスタンスストアボリューム
	- AMI からインスタンス再作成、データ移行

今回は EBS ボリューム対応について記載してます。


## 対応

対象インスタンスが多かったのでローカルPC (macOS) から awscli でインスタンス停止→起動するシェル作成しました。
本番環境で利用されるインスタンスも含まれていた為、1件ずつ実行することとしました。

## 事前準備

- awscli, jq インストール

```
$ brew install awscli jq
```

- 各アカウント毎のアクセスキー、シークレットキー等設定

```
$ aws configure --profile <profile>
$ grep 'profile' ~/.aws/config
```

### インスタンスの停止・再起動シェル

{% gist kenzo0107/b841bfad242e87da3625e5d980845529 %}

以下のように実行すると
インスタンスが起動(running)していれば
停止後、再び起動し、ステータスチェックをするようにしました。

```
$ sh stop_and_start_ec2_instance.sh "<profile>" "<instance id>"
```

### イベント情報取得シェル

.aws/config で設定されている profile を全てチェックし
未対応インスタンスのみ表示する様修正しました。

{% gist kenzo0107/b79e05f6fc6692a1d631fd874ccb3e6b %}

## 結果確認

大体 1インスタンス 5分程度で完了。
問題なく停止起動でき、対象イベントが一覧から消えたことを確認しました♪

## 所感

メンテ対象インスタンスの Region が northeast に集中していたのが気になる点でした。
このインスタンス何に使ってるんだっけ？とならない様に、インスタンスやprivate key の命名ルール必須と感じました。

以上です。
