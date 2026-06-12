---
layout: post
title: "Easy in 5 Minutes: Notify Slack of EC2 Events with AWS Lambda"
date: 2017-07-18
lang: en
translation_id: notify-to-slack-about-ec2-events-by-lambda
permalink: en/2017/07/18/notify-to-slack-about-ec2-events-by-lambda/
cover: https://i.imgur.com/6RCTdfi.png
category: AWS
---

Previously I created a script to check for AWS EC2 maintenance notification events.
On top of that, I made it stop and start the target instances.

{% linkPreview https://kenzo0107.github.io/2017/04/17/2017-04-18-aws-retairement-notification/ %}


I set this up to send Slack notifications via AWS Lambda
so that I can find out every morning which events require maintenance.

## Prerequisites

```console
macOS%$ pip install lambda-uploader awscli
macOS%$ aws configure --profile <profile>
```

## Cloning the Project

```
macOS%$ git clone https://github.com/kenzo0107/AWSEC2Events2Slack
macOS%$ tree AWSEC2Events2Slack
.
├── README.md
├── event.json
├── lambda.json
├── lambda_function.py
└── requirements.txt
```

## Editing the Information to Match Each Environment

- lambda.json

```
{
    "name": "AWSEvent2Slack",
    "description": "Notificate AWS events to Slack",
    "region": "ap-northeast-1",
    "handler": "lambda_function.lambda_handler",
    "role": "arn:aws:iam::xxxxxxxxxxxx:role/lambda-check-events-to-slack",
    "timeout": 60,
    "memory": 128,
    "variables":
    {
        "SLACK_INCOMING_WEBHOOK":"https://hooks.slack.com/services/XXXXXXXXX/XXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX",
        "SLACK_CHANNEL":"#channel",
        "SLACK_USERNAME":"AWSEvent2Slack",
        "SLACK_ICON_URL":"http://i.imgur.com/6RCTdfi.png"
    }
}
```

|Item|Explain|
|---|---|
|role|Attach a policy that holds permission to describe EC2 resources|
|variables|Slack destination information for notifications|

## Uploading the Source to AWS Lambda

```
macOS%$ lambda-uploader --profile <profile>

Î» Building Package
Î» Uploading Package
Î» Fin
```

## Checking Lambda in the AWS Console

You can see that it has been registered.

![](https://i.imgur.com/lv6F5OD.png)

## Running a Test

I was able to make it fetch events and notify Slack.

![](https://i.imgur.com/E5TEXdN.png)

## Configuring the Trigger

I set up a cron with a CloudWatch schedule expression so that it is delivered every morning.

![](https://i.imgur.com/8qzm6Eg.png)


## Overall Impressions

Uploading with lambda-uploader makes the flow of
develop locally → test → deploy
and version management nice and clear.

However, one thing that bothers me is that after uploading, the source is not visible in the console.

Specifically, the following message
> The deployment package of the Lambda function "AWSEvent2Slack" is too large to enable inline code editing. However, you can still invoke your function right now.

is displayed in the console.

I used to write a shell script that bundled everything into a zip and uploaded it,
and back then I could see the source.

Since I verify the behavior locally, there is no problem for now even if it is not visible in the console.

That's all.
I hope this is helpful.
