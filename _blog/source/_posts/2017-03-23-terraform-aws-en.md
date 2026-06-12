---
layout: post
title: Building AWS Infrastructure with Terraform!
date: 2017-03-23
lang: en
translation_id: terraform-aws
permalink: en/2017/03/23/terraform-aws/
tags:
  - AWS
  - Terraform
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170323/20170323222447.png
---

## What is Terraform

- A tool that automates infrastructure provisioning and configuration through code, while letting you review the execution plan beforehand
- Works with many cloud services such as AWS and Google Cloud
- Made by HashiCorp

## What We'll Do This Time

- Launch an instance
- Launch an instance with an Elastic IP
- Destroy an instance

Let's build some very minimal infrastructure.
Note: Even on a personal account, it only cost a few tens of yen when using the free tier.

## Environment

- Mac OS Sierra X 10.12.3 16D32
- Terraform 0.9.1

## Installing terraform

```
$ brew install terraform
```

## Checking the Version

```
$ terraform version

Terraform v0.9.1
```

Now let's get right into it.

## Launching an EC2 instance (t2.micro)

- Create main.tf

```
provider "aws" {
  access_key = "A******************Q"
  secret_key = "q**************************************Z"
  region     = "ap-northeast-1"
}

resource "aws_instance" "example" {
  ami           = "ami-71d79f16"
  instance_type = "t2.micro"
}
```

- Check the execution plan

```
$ terraform plan
```

- Apply

```
$ terraform apply
```

You can confirm from the Amazon Console that the instance has been launched.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170323/20170323224719.png" width="100%">
</div>

## Managing Variables in a Separate File

If you manage the main.tf above with something like GitHub,
your access_key and secret_key would be exposed.

For that reason, it's better to manage them in a separate file as shown below.

- main.tf

```
variable "access_key" {}
variable "secret_key" {}
variable "region" {
  default = "ap-northeast-1"
}

provider "aws" {
  access_key = "${var.access_key}"
  secret_key = "${var.secret_key}"
  region     = "${var.region}"
}

resource "aws_instance" "example" {
  ami           = "ami-71d79f16"
  instance_type = "t2.micro"
}
```

- terraform.tfvars
  - A file that is automatically loaded when terraform runs

```
access_key = "A******************Q"
secret_key = "q**************************************Z"
```

- Check the execution plan

```
$ terraform plan

...

Plan: 1 to add, 0 to change, 0 to destroy.
```

We confirmed that it runs correctly.

It's best to set things up so the `terraform.tfvars` file is never published,
for example by registering it in .gitignore.

## Changing the AMI of an EC2 instance (t2.micro)

- main.tf

```
variable "access_key" {}
variable "secret_key" {}
variable "region" {
  default = "ap-northeast-1"
}

provider "aws" {
  access_key = "${var.access_key}"
  secret_key = "${var.secret_key}"
  region     = "${var.region}"
}

resource "aws_instance" "example" {
  ami           = "ami-047aed04"
  instance_type = "t2.micro"
}
```

- Execution plan

The contents that will be changed are displayed.

```
$ terraform plan

...

-/+ aws_instance.example
    ami:                         "ami-71d79f16" => "ami-047aed04" (forces new resource)
    associate_public_ip_address: "true" => "<computed>"
    availability_zone:           "ap-northeast-1a" => "<computed>"
    ebs_block_device.#:          "0" => "<computed>"
    ephemeral_block_device.#:    "0" => "<computed>"
    instance_state:              "running" => "<computed>"
    instance_type:               "t2.micro" => "t2.micro"
    ipv6_addresses.#:            "0" => "<computed>"
    key_name:                    "" => "<computed>"
    network_interface_id:        "eni-f4a214bb" => "<computed>"
    placement_group:             "" => "<computed>"
    private_dns:                 "ip-172-31-31-239.ap-northeast-1.compute.internal" => "<c
omputed>"
    private_ip:                  "172.31.31.239" => "<computed>"
    public_dns:                  "ec2-52-199-88-146.ap-northeast-1.compute.amazonaws.com"
=> "<computed>"
    public_ip:                   "52.199.88.146" => "<computed>"
    root_block_device.#:         "1" => "<computed>"
    security_groups.#:           "0" => "<computed>"
    source_dest_check:           "true" => "true"
    subnet_id:                   "subnet-7a79cc0d" => "<computed>"
    tenancy:                     "default" => "<computed>"
    vpc_security_group_ids.#:    "1" => "<computed>"


Plan: 1 to add, 0 to change, 1 to destroy.
```

You can see that the instance created first is destroyed and a new instance is created.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170323/20170323225232.png" width="100%">
</div>

We were able to create and change resources with terraform.

Next, let's try destroying them.

## Destroying an EC2 instance (t2.micro)

- Check the execution plan

The resources targeted for destruction are displayed.

```
$ terraform plan -destroy

...

- aws_instance.example
```

- Apply

```
$ terraform destroy

Do you really want to destroy?
  Terraform will delete all your managed infrastructure.
  There is no undo. Only 'yes' will be accepted to confirm.

  Enter a value: yes (← enter yes)
...

Destroy complete! Resources: 1 destroyed.
```

You can confirm in the Amazon console that it has been destroyed.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170323/20170323225807.png" width="100%">
</div>

## Launching an Instance and Setting Up an Elastic IP (Static IP)

- main.tf

```terraform
variable "access_key" {}
variable "secret_key" {}
variable "region" {
  default = "ap-northeast-1"
}

provider "aws" {
  access_key = "${var.access_key}"
  secret_key = "${var.secret_key}"
  region     = "${var.region}"
}

resource "aws_instance" "example" {
  ami           = "ami-047aed04"
  instance_type = "t2.micro"
}

resource "aws_eip" "ip" {
    instance = "${aws_instance.example.id}"
}
```

- Check the execution plan

```
$ terraform plan

...

+ aws_eip.ip
    allocation_id:     "<computed>"
    association_id:    "<computed>"
    domain:            "<computed>"
    instance:          "${aws_instance.example.id}"
    network_interface: "<computed>"
    private_ip:        "<computed>"
    public_ip:         "<computed>"
    vpc:               "<computed>"

+ aws_instance.example
    ami:                         "ami-047aed04"
    associate_public_ip_address: "<computed>"
    availability_zone:           "<computed>"
    ebs_block_device.#:          "<computed>"
    ephemeral_block_device.#:    "<computed>"
    instance_state:              "<computed>"
    instance_type:               "t2.micro"
    ipv6_addresses.#:            "<computed>"
    key_name:                    "<computed>"
    network_interface_id:        "<computed>"
    placement_group:             "<computed>"
    private_dns:                 "<computed>"
    private_ip:                  "<computed>"
    public_dns:                  "<computed>"
    public_ip:                   "<computed>"
    root_block_device.#:         "<computed>"
    security_groups.#:           "<computed>"
    source_dest_check:           "true"
    subnet_id:                   "<computed>"
    tenancy:                     "<computed>"
    vpc_security_group_ids.#:    "<computed>"


Plan: 2 to add, 0 to change, 0 to destroy.
```

- Apply

```
$ terraform apply
```

You can confirm that the instance with the Elastic IP set is running.
Note: However, you'll notice that it has only been launched and you can't connect to it yet (>\_<). I'll cover that next time.

[f:id:kenzo0107:20170323230208p:plain]

- Check the execution plan

You can see the Elastic IP and instance that will be destroyed.

```
$ terraform plan -destroy

...

- aws_eip.ip

- aws_instance.example
```

- Apply

```
$ terraform destroy

...

Destroy complete! Resources: 2 destroyed.
```

We confirmed that all instances have been destroyed.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170323/20170323230746.png" width="100%">
</div>

## Other Useful Settings

### Map Settings

- Select an AMI per region, and choose it by specifying a variable at terraform apply time

```terraform
...

variable "amis" {
  type = "map"
  default = {
    us-east-1 = "ami-13be557e"
    us-east-2 = "ami-71d79f16"
    us-west-1 = "ami-00175967"
    us-west-2 = "ami-06b94666"
    ap-northeast-1 = "ami-047aed04"
  }
}

...

resource "aws_instance" "example" {
  ami           = "${lookup(var.amis, var.region)}"
  instance_type = "t2.micro"
}
```

ex) Selecting region us-west-2

```
$ terraform apply -var region=us-west-2
```

### Output Settings

This is handy when, for example, you want to know the value of the generated Elastic IP.

- main.tf

```terraform
resource "aws_eip" "ip" {
    instance = "${aws_instance.example.id}"
}

output "ip" {
    value = "${aws_eip.ip.public_ip}"
}
```

You can confirm the output value.

```
$ terraform apply

...

Outputs:

ip = 52.197.157.206
```

- terraform output <var>

You can display a more explicitly narrowed-down parameter.

```
$ terraform output ip

52.197.157.206
```

- show

```
$ terraform show

...

Outputs:

ip = 52.197.157.206
```

### Visualizing the Configuration as a Graph

```
$ terraform graph | dot -Tpng > graph.png
```

- graph.png

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170324/20170324172034.png" width="100%">
</div>

- If you don't have the dot command, install graphviz

```
$ brew install graphviz
```

## Overall Impressions

It was a tool that seemed to say, "Easy, right?" ♪

I'd like to continue working on provisioning and various AWS configurations.

Next time, I'll do [Launching an EC2 instance, registering a locally created key as a key pair, and logging in via SSH](https://kenzo0107.github.io/2017/03/27/2017-03-27-create-keypair-by-terraform/).
