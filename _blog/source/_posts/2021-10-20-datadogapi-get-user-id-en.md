---
title: Getting the Datadog User ID List with curl
tags:
  - Datadog
date: 2021-10-20
category: Monitoring
lang: en
translation_id: datadogapi-get-user-id
permalink: en/2021/10/20/datadogapi-get-user-id/
cover: https://imgix.datadoghq.com/img/about/presskit/usage/logousage_white.png?auto=format&fit=max&w=847
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

Just a memo to myself.

There was a time when I had registered Datadog users through the console and then needed to bring them under Terraform management after the fact.

To manage them retroactively with the Terraform `datadog_user` resource, you need to run the following:

```console
terraform import datadog_user.this <ユーザ ID>
```

But where on earth is the user ID written?!

Even when I looked at the source of the dashboard, it wasn't there...

I was able to retrieve the user ID via the API as shown below.

```console
$ curl -s -X GET "https://api.datadoghq.com/api/v2/users" -H "Content-Type: application/json" -H "DD-API-KEY: xxx" -H "DD-APPLICATION-KEY: yyy" | jq -r '.data[] | .id +" "+ .attributes.handle'

// response
xxxxxxxx-yyyy-zzzz-aaaa-bbbbbbbbbbbb kenzo.tanaka@example.com
xxxxxxxx-yyyy-zzzz-aaaa-bbbbbbbbbbbb hoge.moge@example.com
```

That user ID sure is long!
