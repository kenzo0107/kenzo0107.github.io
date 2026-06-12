---
layout: post
title: Upgrading AWS Elasticsearch Service 2.2 → 5.5
date: 2017-10-02
categories:
  - [AWS]
  - [Database]
lang: en
translation_id: elasticsearch-service-version-up
permalink: en/2017/10/02/elasticsearch-service-version-up/
tags:
  - AWS
  - Elasticsearch
  -
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170924/20170924222936.png
---

## Overview

When upgrading AWS Elasticsearch Service (ES) from 2.3 to 5.5, I put together
the following notes.

## High-level flow

1. Take a snapshot from the ES 2.3 domain
2. Create an ES 5.5 domain
3. Switch the application's fluentd destination to the ES 5.5 domain
4. Restore the data into the ES 5.5 domain
5. Delete the ES 2.3 domain

## Checking the current version

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

### Also, check the cluster settings in the AWS console

Take notes of the other settings configured on the cluster.

- Instance type
- Access policy

# Managing AWS Elasticsearch Service snapshots in S3

## Create an IAM role

- Create it as an ec2 type

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170924/20170924221853.png" width="100%">
</div>

- Without setting any permissions, click the "Next Step" button

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925113614.png" width="100%">
</div>

- Name the role <b><span style="color: #1464b3">es-index-backups</span></b> and create it

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925113908.png" width="100%">
</div>

You can confirm that it was created with the role ARN arn:aws:iam::<Account ID>:role/es-index-backups

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925114402.png" width="100%">
</div>

- Edit the trust relationship

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925114635.png" width="100%">
</div>

Edit Service to es.amazonaws.com

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

## Create an IAM User

- Select Users > Add user

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925114822.png" width="100%">
</div>

<br/>
<br/>

- Set the user name to `es-index-backup-user`, check Programmatic access, and click `Next Step`

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925115200.png" width="100%">
</div>

<br/>
<br/>

- Without attaching any policy, click `Next Step`

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925115357.png" width="100%">
</div>

- Create `es-index-backup-user` and attach a custom policy that grants access to the role created earlier.

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

- Make a note of the issued access key and secret access key.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170925/20170925120635.png" width="100%">
</div>

## Create an S3 bucket

Create a bucket via S3 > `Create bucket`.

## Create a snapshot repository in Elasticsearch

You need to create a repository in Elasticsearch to manage the snapshots.

Run the following script on a server that can access Elasticsearch.

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

// success
{"acknowledged":true}
```

Repository registration is complete.

## Take a snapshot

Let's name the snapshot `20170926`.

```sh
$ curl -XPUT "https://<Elasticsearch 2.3 Endpoint Domain>/_snapshot/index-backups/20170926"

// success
{"accepted":true}
```

## List snapshots

You can confirm that the snapshot was taken with the name `20170926`.

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

## Delete a snapshot

To delete the snapshot `20170926`, run the DELETE method.

```sh
$ curl -XDELETE https://<Elasticsearch 2.3 Endpoint Domain>/_snapshot/index-backups/20170926

// success
{"acknowledged":true}
```

## Check S3

You can see that the following have been created.

- indices/\*
- meta-\*
- snap-\*

At first I assumed it was done once meta-_ was created, but
it turned out you also have to wait until snap-_ is created.

- It's more reliable to confirm snapshot completion from the CLI.

```sh
$ curl -s -GET https://<Elasticsearch 2.3 Endpoint Domain>/_snapshot/index-backups/20170926

...
      "state": "SUCCESS",
...
...
```

## Create a new Elasticsearch 5.5 Service domain

Create it following the same settings as Elasticsearch 2.3.

## Create the repository

- register_es55_repository.py

Modify the host part of register_es_repository.py to point to the new domain.

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

// success
{"acknowledged":true}
```

## Restore from the snapshot

Restore the `20170926` snapshot.

```sh
$ curl -XPOST "https://<Elasticsearch 5.5 Endpoint Domain>/_snapshot/index-backups/20170926/_restore"

// success
{"accepted": true}
```

## Verify the restore

```sh
$ curl -XGET "https://<Elasticsearch 5.5 Endpoint Domain>/_cat/indices"
```

## A case where the snapshot restore fails

- The .kibana index already exists and cannot be restored.

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

#### Workaround

```sh
curl -XPOST https://<Elasticsearch 5.5 Endpoint Domain>/_snapshot/index-backups/20170926/_restore -d '{
	"indices": "nginx-*"
}' | jq .
```

Using `indices`, you can restore only the indices in the snapshot that match a given regular expression.

This is the approach I took to work around the issue.
If there's a better way, I'd be grateful for your advice.

## By the way

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171002/20171002144856.png" width="100%">
</div>

When I performed the ES 2.2 → 5.5 upgrade with Terraform,
the update finally completed after more than an hour had elapsed.

```
aws_elasticsearch_domain.elasticsearch: Still destroying... (ID: arn:aws:es:ap-northeast-1:xxxxxxxxxxxx:domain/***, 59m11s elapsed)
aws_elasticsearch_domain.elasticsearch: Still destroying... (ID: arn:aws:es:ap-northeast-1:xxxxxxxxxxxx:domain/***, 59m21s elapsed)
aws_elasticsearch_domain.elasticsearch: Still destroying... (ID: arn:aws:es:ap-northeast-1:xxxxxxxxxxxx:domain/***, 59m31s elapsed)
aws_elasticsearch_domain.elasticsearch: Destruction complete after 59m41s
```

That's painful (>\_<)

When managing with Terraform,
it's faster to take a snapshot and then delete the domain from the AWS console.

I concluded that the most reliable approach is the blue-green style: create ES 5.5,
switch over from ES 2.2, run it for a while, and delete ES 2.2 once there are no problems.
