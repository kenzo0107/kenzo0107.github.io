---
layout: post
title: Terraform で AWS インフラストラクチャ！
date: 2017-03-23
tags:
- AWS
- Terraform
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170323/20170323222447.png
---


## Terraform とは

- インフラ構成や設定をコードにより実行計画を確認しながら自動化できるツール
- AWS, Google Cloud 等多数のクラウドサービスで利用可能
- HashiCorp社製

## 今回やること

- インスタンス起動
- Elastic IP付きインスタンス起動
- インスタンス破棄

非常にミニマムなインフラ構築をしてみます。
※個人のアカウントでも無料枠を使えば数十円しか掛からなかったです。

## 環境

- Mac OS Sierra X 10.12.3 16D32
- Terraform 0.9.1

## terraform インストール

```
$ brew install terraform
```

## バージョン確認

```
$ terraform version

Terraform v0.9.1
```

では、早速使ってみます。

## EC2 instance (t2.micro) 起動

- main.tf 作成

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

- 実行計画確認

```
$ terraform plan
```

- 実行

```
$ terraform apply
```

Amazon Console からインスタンスが起動されたことが確認できます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170323/20170323224719.png" width="100%">
</div>

## 変数を別ファイルで管理

上記 main.tf を github 等で管理するとなると
access_key, secret_key が露見されてしまいます。

その為、以下の様に別ファイルで管理することが望ましいです。

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
	- terraform 実行時に自動で読み込まれるファイル

```
access_key = "A******************Q"
secret_key = "q**************************************Z"
```

- 実行計画確認

```
$ terraform plan

...

Plan: 1 to add, 0 to change, 0 to destroy.
```

正しく実行できることが確認できました。

`terraform.tfvars` ファイルは .gitignore に登録しておくなど
絶対に公開されない様な設定が望ましいと思います。


## EC2 instance (t2.micro) AMI変更

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

- 実行計画

変更される内容が表示されます。

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

最初に作成したインスタンスは破棄され、新たにインスタンスを作成していることがわかります。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170323/20170323225232.png" width="100%">
</div>

terraform で新規作成・変更ができました。

次は破棄してみましょう。


## EC2 instance (t2.micro) 破棄

- 実行計画確認

破棄対象のリソースが表示されます。

```
$ terraform plan -destroy

...

- aws_instance.example
```

- 実行

```
$ terraform destroy

Do you really want to destroy?
  Terraform will delete all your managed infrastructure.
  There is no undo. Only 'yes' will be accepted to confirm.

  Enter a value: yes (← yes 入力)
...

Destroy complete! Resources: 1 destroyed.
```

Amazon コンソールで破棄されたことを確認できます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170323/20170323225807.png" width="100%">
</div>


## インスタンス起動し Elastic IP (固定IP) 設定

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

- 実行計画確認

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

- 実行

```
$ terraform apply
```

Elastic IP が設定されたインスタンスが起動していることが確認できます。
※ただ、起動しただけで接続できないことがわかります(>_<) 次回実施します

[f:id:kenzo0107:20170323230208p:plain]

- 実行計画確認

破棄されるElastic IP, インスタンスが確認できます。

```
$ terraform plan -destroy

...

- aws_eip.ip

- aws_instance.example
```

- 実行

```
$ terraform destroy

...

Destroy complete! Resources: 2 destroyed.
```

全インスタンスが破棄されていることが確認できました。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170323/20170323230746.png" width="100%">
</div>



## その他便利な設定

### Map 設定

- region 毎に AMI を選択し terraform apply 時に変数指定し選択可能

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

ex) region us-west-2 を選択

```
$ terraform apply -var region=us-west-2
```

### 出力設定

生成されたElastic IPの値が知りたいときなど便利です。

- main.tf

```terraform
resource "aws_eip" "ip" {
    instance = "${aws_instance.example.id}"
}

output "ip" {
    value = "${aws_eip.ip.public_ip}"
}
```

出力値が確認できます。

```
$ terraform apply

...

Outputs:

ip = 52.197.157.206
```

- terraform output <var>

より明示的にパラメータを絞って表示できます。

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

### 構成のグラフ化

```
$ terraform graph | dot -Tpng > graph.png
```

- graph.png

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170324/20170324172034.png" width="100%">
</div>

- dot コマンドがない場合は graphviz インストール

```
$ brew install graphviz
```



## 総評

簡単でしょ？と言われているようなツールでした♪

引き続きプロビジョニングやAWSの各種設定をしていきたいと思います。

次回 [EC2インスタンスを起動し、ローカル環境で作った鍵をキーペア登録しSSHログイン](https://kenzo0107.github.io/2017/03/27/2017-03-27-create-keypair-by-terraform/)を実施します。
