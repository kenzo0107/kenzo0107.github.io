---
layout: post
title: Terraform でキーペア登録し起動した EC2 に SSH接続
date: 2017-03-27
tags:
- AWS
- Terraform
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170327/20170327212027.png
---

## 今回やること

- Mac ローカルで公開鍵、秘密鍵を生成
- Terraform でEC2起動、セキュリティグループで SSH (ポート22)許可、key-pair 登録

Terraform の Hello World 的なチュートリアルと思っていただけたら幸いです。

## 環境

- Mac OS 10.12.3 (Sierra)
- Terraform 0.9.1

## 公開鍵、秘密鍵生成

RSAフォーマットで鍵を生成します。

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

公開鍵を起動したEC2インスタンスに登録し
秘密鍵でアクセスします。

以下のように利用する予定です。

```
$ ssh -i ~/.ssh/terraform-test <ec2 user>@<ec2 public ip>
```

## Terraform 設定ファイル

- Point !
    - `resource "aws_key_pair"` で使用する公開鍵設定をしています。
    - `resource "aws_security_group"` でSSH（ポート22）を開いてます。
    - `resource "aws_instance"` で使用しているセキュリティグループの指定は  `vpc_security_group_ids` を利用
        - セキュリティグループの条件追加・削除する場合にインスタンスを一度削除し作り直すことをしたくない場合に vpc_security_group_ids を利用すると良いです。

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

## いざ実行

- 実行計画確認

```
$ terraform plan
```

- 実行

```
$ terraform apply
```

## 確認

- AWS コンソール上で起動確認

    - キーペアに terraform-test が指定されています。
    - vpc, subnet も自動的にアタッチされてます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170327/20170327214009.png" width="100%">
</div>

- キーペア
一応キーペアを見てみると登録されているのがわかります。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170327/20170327214404.png" width="100%">
</div>

- セキュリティグループ確認

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170327/20170327214628.png" width="100%">
</div>


- SSH ログイン確認

```
$ ssh -i ~/.ssh/terraform-test ubuntu@ec2-54-65-244-25.ap-northeast-1.compute.amazonaws.com
```

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170327/20170327214837.png" width="100%">
</div>


無事SSHログインできました！

## 所感

[terraform](https://www.terraform.io/) を見ながら各パラメータの利用意図を確認しながら
設定してみましたが
パラメータの説明自体はざっくりで利用方法まではわからないです。

[Teffaform のチュートリアル](https://www.terraform.io/intro/getting-started/build.html)に始まり
その他 [Stack Overflow](http://stackoverflow.com/questions/tagged/terraform) で
適宜パターンを蓄積していく学習が程よいと思います。


## 参考

{% linkPreview http://cross-black777.hatenablog.com/entry/2016/02/25/090000 _blank %}
