---
title: curl で Datadog ユーザ ID リスト取得
tags:
- Datadog
date: 2021-10-20
---

備忘録です。

Datadog ユーザをコンソール上で登録し、後追いで terraform `datadog_user` で管理したいときに `terraform import datadog_user.this <ユーザ ID>` を実行する必要があります。

ユーザ ID は Datadog コンソール上でも表示されない。。

ユーザ ID を以下で取得できます。

```console
$ curl -s -X GET "https://api.datadoghq.com/api/v2/users" -H "Content-Type: application/json" -H "DD-API-KEY: xxx" -H "DD-APPLICATION-KEY: yyy" | jq -r '.data[] | .id +" "+ .attributes.handle'

// response
xxxxxxxx-yyyy-zzzz-aaaa-bbbbbbbbbbbb kenzo.tanaka@example.com
xxxxxxxx-yyyy-zzzz-aaaa-bbbbbbbbbbbb hoge.moge@example.com
```

ユーザ ID 長っ！
