---
title: Sorting a map by key in Terraform and getting the list of values
date: 2022-10-26
lang: en
translation_id: terraform-sort-map
permalink: en/2022/10/26/terraform-sort-map/
cover: https://i.imgur.com/8cuKRz1.png
category: Terraform
---

When you shape a map with a `for` expression in Terraform, it sorts and lays out the keys in ascending order.

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

Using this, let's retrieve the Subnet IDs obtained from a data resource as a list ordered by AZ (a → c → d).

<!-- more -->

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

This is handy when, for example, you launch 10 EC2 instances and want to distribute the subnet AZs in order as a, c, d.

```
locals {
    az_count = length(data.aws_availability_zones.available.names)
}

resource "aws_instance" "app" {
  count = 10

  # NOTE: By using a map type, we take advantage of the keys being ordered in ascending order to arrange the AZs as a → c → d
  subnet_id = values({ for id, s in data.aws_subnet.public : s.availability_zone => id })[count.index % local.az_count]
```

That's all. I hope this is helpful.
