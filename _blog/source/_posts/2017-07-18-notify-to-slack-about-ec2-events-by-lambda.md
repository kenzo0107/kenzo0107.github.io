---
layout: post
title: 5分でできる♪ AWS Lambda で EC2 Event を Slack 通知
date: 2017-07-18
category: AWS
---

以前 AWS EC2 メンテ通知のイベントチェックスクリプトを作成しました。
合わせて、対象インスタンスを停止・起動する様にしました。

{% linkPreview https://kenzo0107.github.io/2017/04/17/2017-04-18-aws-retairement-notification/ %}


これを AWS Lamda で Slack 通知させる様にし
毎朝メンテの必要なイベントがわかる様にしました。

## 事前準備

```console
macOS%$ pip install lambda-uploader awscli
macOS%$ aws configure --profile <profile>
```

## プロジェクト clone

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

## 各種環境に合わせて情報編集

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
|role|EC2リソースをdescribeする権限を所持したポリシーをアタッチ|
|variables|通知先Slack情報|

## AWS Lambda へソースアップロード

```
macOS%$ lambda-uploader --profile <profile>

Î» Building Package
Î» Uploading Package
Î» Fin
```

## AWSコンソールより Lambda 確認

登録されていることがわかります。

![](https://i.imgur.com/lv6F5OD.png)

## テスト実行

イベントを取得しSlackに通知させる様にすることができました。

![](https://i.imgur.com/E5TEXdN.png)

## トリガー設定

CloudWatch スケジュール式で cron 設定し 毎朝届ける様に指定しました。

![](https://i.imgur.com/8qzm6Eg.png)


## 総評

lambda-uploader でのアップロードにより
ローカルで開発→テスト→デプロイ
とバージョン管理が明確になって良いです。

但し、一点気になる点はアップロード後、ソースがコンソール上で見えません。

具体的には
> Lambda 関数 「AWSEvent2Slack」のデプロイパッケージが大きすぎて、インラインコード編集を有効にできません。ただし、関数を今すぐ呼び出すことはできます。

とコンソール上に表示されます。

前まで zip にまとめてアップロードするシェルを書いていたけど
その時はソースは見ることができました。

ローカルで挙動確認しておりコンソール上では見えなくても今のところ支障なしです。

以上
参考になれば何よりです。
