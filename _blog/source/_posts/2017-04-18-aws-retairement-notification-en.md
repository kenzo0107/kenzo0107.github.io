---
layout: post
title: Handling the AWS [Retirement Notification]
date: 2017-04-18
lang: en
translation_id: aws-retairement-notification
permalink: en/2017/04/18/aws-retairement-notification/
tags:
  - AWS
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170418/20170418105821.png
---

## Overview

One day, I received an email notification like this from AWS.

To summarize:
An unrecoverable failure had been detected on the hardware hosting my infrastructure,
and unless I took action by the specified deadline, the instance would be stopped.

Here is a write-up of how I handled it this time.

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

- Looking at the AWS Console Events page, it is shown in the list.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170418/20170418095219.png" width="100%">
</div>

- Looking at the AWS Console details, a Notice is displayed.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170411/20170411215054.png" width="100%">
</div>

## ToDO

This differs depending on the volume type.

- EBS volume

  - Stop the instance, then start it (Reboot is NOT acceptable)

- Instance store volume
  - Recreate the instance from an AMI and migrate the data

This time I cover the EBS volume case.

## Handling

Since there were many target instances, I created a shell script on my local PC (macOS) that uses awscli to stop and then start each instance.
Because some of the instances are used in the production environment, I decided to run them one at a time.

## Prerequisites

- Install awscli and jq

```
$ brew install awscli jq
```

- Configure the access key, secret key, and so on for each account

```
$ aws configure --profile <profile>
$ grep 'profile' ~/.aws/config
```

### Shell script to stop and restart an instance

{% gist kenzo0107/b841bfad242e87da3625e5d980845529 %}

When run as shown below,
if the instance is running,
it stops and then starts the instance again, and performs a status check.

```
$ sh stop_and_start_ec2_instance.sh "<profile>" "<instance id>"
```

### Shell script to retrieve event information

I modified it to check all the profiles configured in .aws/config
and display only the instances that have not yet been handled.

{% gist kenzo0107/b79e05f6fc6692a1d631fd874ccb3e6b %}

## Verifying the results

Each instance took roughly 5 minutes to complete.
The stop and start went smoothly, and I confirmed that the target events disappeared from the list ♪

## Impressions

One thing that caught my attention was that the maintenance-target instances were concentrated in the northeast region.
To avoid the "wait, what was this instance used for again?" situation, I felt that naming conventions for instances and private keys are essential.

That's all.
