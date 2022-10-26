---
title: terraform で map 型の値を key 順にソートした上で value のリストを取得する
date: 2022-10-26
thumbnail: https://i.imgur.com/8cuKRz1.png
---

terraform で map 型を for で整形した際に key を昇順にソートして並べてくれます。

```terraform
> {for k, v in {"a":3, "c":2, "d":1}: v => k}

{
  "1" = "d"
  "2" = "c"
  "3" = "a"
}

> values({for k, v in {"a":3, "c":2, "d":1}: v => k})

[
  "d",
  "c",
  "a",
]
```

これを利用し、data リソースで取得した Subnet ID を AZ 順 (a → c → d) に list で取得してみます。

```terraform
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = ["xxxxx"]
  }
  filter {
    name   = "tag:Name"
    values = ["public-*"]
  }
}

data "aws_subnet" "public" {
  for_each = toset(data.aws_subnets.public.ids)

  id = each.value
}

values({ for id, s in data.aws_subnet.public : s.availability_zone => id })
# [
#   "subnet-xxx", # ap-northeast-1a
#   "subnet-yyy", # ap-northeast-1c
#   "subnet-zzz", # ap-northeast-1d
# ]
```

以下の様に EC2 インスタンスを 10 台起動するときに Subnet の AZ を a, c, d と順々に振り分けたい場合などに便利です。

```
locals {
    az_count = length(data.aws_availability_zones.available.names)
}

resource "aws_instance" "app" {
  count = 10

  # NOTE: map 型にすることで key の昇順で並ぶことを利用し AZ を a → c → d と並べている
  subnet_id = values({ for id, s in data.aws_subnet.public : s.availability_zone => id })[count.index % local.az_count]
```

以上、参考になれば幸いです。
