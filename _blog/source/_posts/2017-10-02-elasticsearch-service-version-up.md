---
layout: post
title: AWS Elasticsearch Service バージョンアップ 2.2 → 5.5
date: 2017-10-02
tags:
  - AWS
  - Elasticsearch
  -
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170924/20170924222936.png
---

## 概要

AWS Elasticsearch Service (ES) 2.3 → 5.5 へバージョンアップを実施に際して
以下記事をまとめました。

## 大まかな流れ

1. ES バージョン 2.3 のドメインから Snapshot 取得
2. ES バージョン 5.5 のドメイン作成
3. アプリの fluentd の向け先を ES バージョン 5.5 へ変更
4. ES バージョン 5.5 のドメインにデータリストア
5. ES バージョン 2.3 のドメイン削除

## 現状バージョン確認

```sh
$ curl https://<Elasticsearch 2.3 Endpoint Domain>

{
  "name" : "Jackdaw",
  "cluster_name" : "<Account ID>:xxxxxxxxxx",
  "version" : {
    "number" : "2.3.2",
    "build_hash" : "72aa8010df1a4fc849da359c9c58acba6c4d9518",
    "build_timestamp" : "2016-11-14T15:59:50Z",
    "build_snapshot" : false,
    "lucene_version" : "5.5.0"
  },
  "tagline" : "You Know, for Search"
}
```

### その他、AWS console のクラスターの設定確認

その他クラスターへ設定している情報をメモ

- インスタンスタイプ
- アクセスポリシーの確認

# AWS Elasticsearch Service スナップショットを S3 で管理する

## IAM role 作成

- ec2 タイプで作成

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170924/20170924221853.png" width="100%">
</div>

- アクセス権限は特に設定せず 「次のステップ」ボタンクリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925113614.png" width="100%">
</div>

- ロール名を <b><span style="color: #1464b3">es-index-backups</span></b> とし作成

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925113908.png" width="100%">
</div>

ロール ARN arn:aws:iam::<Account ID>:role/es-index-backups で作成されていることが確認できる

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925114402.png" width="100%">
</div>

- 信頼関係の編集

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925114635.png" width="100%">
</div>

Service を es.amazonaws.com に編集

```js
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "es.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## IAM User 作成

- ユーザ > ユーザ追加 選択

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925114822.png" width="100%">
</div>

<br/>
<br/>

- ユーザ名 `es-index-backup-user` とし プログラムによるアクセスにチェックを入れて `次のステップ` クリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925115200.png" width="100%">
</div>

<br/>
<br/>

- 特にポリシーをアタッチせず `次のステップ` クリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925115357.png" width="100%">
</div>

- `es-index-backup-user` を作成し独自ポリシーで先ほど作成した role へのアクセス許可設定をアタッチします。

```js
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "iam:PassRole"
            ],
            "Resource": "arn:aws:iam::<Account ID>:role/es-index-backups"
        }
    ]
}
```

<br/>

- 発行されたアクセスキー、シークレットアクセスキーをメモしておきます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925120635.png" width="100%">
</div>

## S3 バケット作成

S3 > `バケットを作成する` でバケット作成してください。

## Elasticsearch にてスナップショットリポジトリ作成

スナップショットを管理するリポジトリを Elasticsearch に作成する必要があります。

Elasticsearch へのアクセス可能なサーバにて以下スクリプト実行します。

- register_es_repository.py

```python
from boto.connection import AWSAuthConnection

class ESConnection(AWSAuthConnection):

    def __init__(self, region, **kwargs):
        super(ESConnection, self).__init__(**kwargs)
        self._set_auth_region_name(region)
        self._set_auth_service_name("es")

    def _required_auth_capability(self):
        return ['hmac-v4']

if __name__ == "__main__":

    client = ESConnection(
            region='ap-northeast-1',
            host='<Elasticsearch 2.3 Endpoint Domain>',
            aws_access_key_id='<ACCESS KEY ID>',
            aws_secret_access_key='<SECRET ACCESS KEY>', is_secure=False)

    resp = client.make_request(
        method='POST',
        path='/_snapshot/index-backups',
        data='{"type": "s3","settings": { "bucket": "<bucket name>","region": "ap-northeast-1","role_arn": "arn:aws:iam::<Account ID>:role/es-index-backups"}}'
    )
    body = resp.read()
    print body
```

```sh
$ chmod +x register_es_repository.py

$ python register_es_repository.py

// 成功
{"acknowledged":true}
```

リポジトリ登録完了しました。

## Snapshot 取得

snapshot 名を `20170926` とします。

```sh
$ curl -XPUT "https://<Elasticsearch 2.3 Endpoint Domain>/_snapshot/index-backups/20170926"

// 成功
{"accepted":true}
```

## Snapshot 一覧

`20170926` という snapshot 名で取得したことが確認できます。

```sh
$ curl -s -XGET "https://<Elasticsearch 2.3 Endpoint Domain>/_snapshot/index-backups/_all" | jq .
{
  "snapshots": [
    {
      "snapshot": "20170926",
      "version_id": 2030299,
      "version": "2.3.2",
      "indices": [
        "nginx-access-2017.09.09",
        "nginx-access-2017.09.07",
        "nginx-access-2017.09.08",
        "nginx-error-2017.08.24",
        "nginx-error-2017.08.23",
        ".kibana-4",
...
      ],
      "state": "IN_PROGRESS",
      "start_time": "2017-09-26T03:58:51.040Z",
      "start_time_in_millis": 1506398331040,
      "failures": [],
      "shards": {
        "total": 0,
        "failed": 0,
        "successful": 0
      }
    }
  ]
}
```

## Snapshot 削除

スナップショット `20170926` を削除する場合、DELETE メソッドを実行します。

```sh
$ curl -XDELETE https://<Elasticsearch 2.3 Endpoint Domain>/_snapshot/index-backups/20170926

// 成功
{"acknowledged":true}
```

## S3 確認

以下が作成されているのがわかります。

- indices/\*
- meta-\*
- snap-\*

はじめ meta-_ が作成できたら完了なのかなと思いきや
snap-_ も作られるまで待つ必要がありました。

- CLI 上でスナップショット完了確認した方が確実です。

```sh
$ curl -s -GET https://<Elasticsearch 2.3 Endpoint Domain>/_snapshot/index-backups/20170926

...
      "state": "SUCCESS",
...
...
```

## Elasticsearch 5.5 Service 新規ドメイン作成

Elasticsearch 2.3 の設定に倣って作成します。

## リポジトリ作成

- register_es55_repository.py

register_es_repository.py の host 部分を新規ドメインに修正します。

```python
from boto.connection import AWSAuthConnection

class ESConnection(AWSAuthConnection):

    def __init__(self, region, **kwargs):
        super(ESConnection, self).__init__(**kwargs)
        self._set_auth_region_name(region)
        self._set_auth_service_name("es")

    def _required_auth_capability(self):
        return ['hmac-v4']

if __name__ == "__main__":

    client = ESConnection(
            region='ap-northeast-1',
            host='<Elasticsearch 5.5 Endpoint Domain>',
            aws_access_key_id='<ACCESS KEY ID>',
            aws_secret_access_key='<SECRET ACCESS KEY>', is_secure=False)

    print 'Registering Snapshot Repository'
    resp = client.make_request(
        method='POST',
        path='/_snapshot/index-backups',
        data='{"type": "s3","settings": { "bucket": "<bucket name>","region": "ap-northeast-1","role_arn": "arn:aws:iam::<Account ID>:role/es-index-backups"}}'
    )
    body = resp.read()
    print body
```

```sh
$ chmod +x register_es55_repository.py

$ python register_es55_repository.py

// 成功
{"acknowledged":true}
```

## スナップショットからリストア

`20170926` のスナップショットをリストアします。

```sh
$ curl -XPOST "https://<Elasticsearch 5.5 Endpoint Domain>/_snapshot/index-backups/20170926/_restore"

// 成功
{"accepted": true}
```

## リストア確認

```sh
$ curl -XGET "https://<Elasticsearch 5.5 Endpoint Domain>/_cat/indices"
```

## スナップショットに失敗するケース

- .kibana index が既に存在しており、リストアできない。

```js
{
    "error":{
        "root_cause":[
            {
                "type":"snapshot_restore_exception",
                "reason":"[index-backups:20170926/Hc4rLIoARCWqpyJXeP7edw] cannot restore index [.kibana] because it's open"
            }
        ],
        "type":"snapshot_restore_exception",
        "reason":"[index-backups:20170926/Hc4rLIoARCWqpyJXeP7edw] cannot restore index [.kibana] because it's open"
    },
    "status":500
}
```

#### 対応策

```sh
curl -XPOST https://<Elasticsearch 5.5 Endpoint Domain>/_snapshot/index-backups/20170926/_restore -d '{
	"indices": "nginx-*"
}' | jq .
```

`indices` を用い、スナップショット内のインデックスの中からマッチする正規表現のみをリストアできます。

自身ではこの様な解決法を実施し回避できました。
その他良い方法があれば御指南いただけますと幸いです。

## ちなみに

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171002/20171002144856.png" width="100%">
</div>

Terraform で ES 2.2 → 5.5 バージョンアップを実施した所
1 時間以上経過してようやくアップデートが完了しました。

```
aws_elasticsearch_domain.elasticsearch: Still destroying... (ID: arn:aws:es:ap-northeast-1:xxxxxxxxxxxx:domain/***, 59m11s elapsed)
aws_elasticsearch_domain.elasticsearch: Still destroying... (ID: arn:aws:es:ap-northeast-1:xxxxxxxxxxxx:domain/***, 59m21s elapsed)
aws_elasticsearch_domain.elasticsearch: Still destroying... (ID: arn:aws:es:ap-northeast-1:xxxxxxxxxxxx:domain/***, 59m31s elapsed)
aws_elasticsearch_domain.elasticsearch: Destruction complete after 59m41s
```

これは辛い (>\_<)

Terraform で管理している場合、
スナップショットを取得したら aws console 上でドメイン削除した方が早い。

ブルーグリーン的に ES 5.5 作成して ES 2.2 から乗り換えて
しばらく運用して問題なければ ES 2.2 を削除する方法が一番確実だなと思いました。
