---
layout: post
title: SSH into an EC2 Instance Launched with a Key Pair Registered via Terraform
date: 2017-03-27
categories:
  - [AWS]
  - [Terraform]
  - [Infrastructure]
lang: en
translation_id: create-keypair-by-terraform
permalink: en/2017/03/27/create-keypair-by-terraform/
tags:
  - AWS
  - Terraform
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170327/20170327212027.png
---

## What We'll Do This Time

- Generate a public key and a private key locally on a Mac
- Use Terraform to launch an EC2 instance, allow SSH (port 22) via a security group, and register the key pair

Think of this as a "Hello World" style tutorial for Terraform.

## Environment

- Mac OS 10.12.3 (Sierra)
- Terraform 0.9.1

## Generating the Public and Private Keys

Generate the keys in RSA format.

```
$ ssh-keygen -t rsa

Enter file in which to save the key (/Users/kenzo_tanaka/.ssh/id_rsa): /Users/kenzo_tanaka/.ssh/terraform-test
Enter passphrase (empty for no passphrase): (空のままEnter)
Enter same passphrase again: (空のままEnter)
...
...

// 生成されたか確認
$ ls ~/.ssh/terraform-test*

/Users/kenzo_tanaka/.ssh/terraform-test      # 秘密鍵
/Users/kenzo_tanaka/.ssh/terraform-test.pub　# 公開鍵
```

We'll register the public key on the launched EC2 instance and access it with the private key.

We plan to use it as follows.

```
$ ssh -i ~/.ssh/terraform-test <ec2 user>@<ec2 public ip>
```

## Terraform Configuration Files

- Point!

  - The public key configuration used is set in `resource "aws_key_pair"`.
  - SSH (port 22) is opened in `resource "aws_security_group"`.
  - The security group used in `resource "aws_instance"` is specified via `vpc_security_group_ids`.
    - Using `vpc_security_group_ids` is a good idea when you don't want the instance to be destroyed and recreated each time you add or remove security group conditions.

- main.tf

```terraform
provider "aws" {
  access_key = "${var.access_key}"
  secret_key = "${var.secret_key}"
  region     = "${var.region}"
}

resource "aws_instance" "example" {
  ami           = "${lookup(var.amis, var.region)}"
  instance_type = "t2.nano"
  key_name      = "${aws_key_pair.auth.id}"
  vpc_security_group_ids = ["${aws_security_group.default.id}"]
}

resource "aws_key_pair" "auth" {
  key_name   = "${var.key_name}"
  public_key = "${file(var.public_key_path)}"
}

resource "aws_security_group" "default" {
  name        = "terraform_security_group"
  description = "Used in the terraform"

  # SSH access from anywhere
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

- variables.tf

```terraform
variable "access_key" {}
variable "secret_key" {}
variable "region" {
  default = "ap-northeast-1"
}

variable "amis" {
  type = "map"
  default = {
    us-east-1 = "ami-13be557e"
    us-west-2 = "ami-21f78e11"
    ap-northeast-1 = "ami-1bfdb67c"
  }
}

variable "key_name" {
  description = "Desired name of AWS key pair"
}

variable "public_key_path" {
  description = <<DESCRIPTION
Path to the SSH public key to be used for authentication.
Ensure this keypair is added to your local SSH agent so provisioners can
connect.

Example: ~/.ssh/terraform.pub
DESCRIPTION
}
```

- terraform.tfvars

```terraform
access_key = "A******************Q"
secret_key = "q**************************************Z"

key_name = "terraform-test"
public_key_path = "~/.ssh/terraform-test.pub"
```

## Let's Run It

- Check the execution plan

```
$ terraform plan
```

- Apply

```
$ terraform apply
```

## Verification

- Verify the launch in the AWS console

  - `terraform-test` is specified as the key pair.
  - The VPC and subnet are also attached automatically.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170327/20170327214009.png" width="100%">
</div>

- Key pair
  If you take a look at the key pairs, you can confirm it has been registered.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170327/20170327214404.png" width="100%">
</div>

- Verify the security group

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170327/20170327214628.png" width="100%">
</div>

- Verify SSH login

```
$ ssh -i ~/.ssh/terraform-test ubuntu@ec2-54-65-244-25.ap-northeast-1.compute.amazonaws.com
```

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170327/20170327214837.png" width="100%">
</div>

SSH login succeeded!

## Impressions

I configured this while referring to [terraform](https://www.terraform.io/) to check the intended use of each parameter, but the parameter descriptions themselves are rather rough and don't go as far as explaining how to use them.

I think a good way to learn is to start with the [Terraform tutorial](https://www.terraform.io/intro/getting-started/build.html) and then accumulate patterns as needed from sources like [Stack Overflow](http://stackoverflow.com/questions/tagged/terraform).

## References

{% linkPreview http://cross-black777.hatenablog.com/entry/2016/02/25/090000 _blank %}
