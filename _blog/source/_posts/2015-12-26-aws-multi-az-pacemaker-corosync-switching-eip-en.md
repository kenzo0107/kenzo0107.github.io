---
layout: post
title: Switching Elastic IPs with Pacemaker + Corosync in an AWS Multi-AZ Setup
date: 2015-12-26
lang: en
translation_id: aws-multi-az-pacemaker-corosync-switching-eip
permalink: en/2015/12/26/aws-multi-az-pacemaker-corosync-switching-eip/
cover: https://i.imgur.com/QBvFhti.png
tags:
- AWS
- Pacemaker
- Corosync
---

## Overview

This post summarizes my implementation of
failover by switching an EIP across Multi-AZ on AWS
using Pacemaker & Corosync.

The idea is illustrated below.

- Normal state

![Normal](http://i.imgur.com/QBvFhti.png)

- When a failure occurs on Instance A placed in Availability Zone A,
  the EIP is reassigned to Instance B placed in Availability Zone B

![Accident occured](http://i.imgur.com/xoJ3h8s.png?1)


## ToDo

- Configure VPC and Subnets
- Install / configure Pacemaker & Corosync
- Build the cluster
- Create the EIP reassignment script
- Run the failover test


## Environment

- CentOS 7 (x86_64) with Updates HVM (t2.micro)
* Since this is for verification, I am using t2.micro.


## Building the VPC and Subnets

The following article does an excellent job of summarizing this, so please use it as a reference;
I will reuse these settings as-is from here on.

[0から始めるAWS入門①：VPC編](http://qiita.com/hiroshik1985/items/9de2dd02c9c2f6911f3b)

##### Just in case, here are the VPC and Subnet settings.

- VPC settings

| *Item*   | *Value*     |
| -------- | ----------- |
| Name tag | Any         |
| CIDR     | 10.0.0.0/16 |
| tenancy  | Default     |

- Subnet settings

| *Item*            | Subnet 1                                                       | Subnet 2                                                       |
| ----------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| Name tag          | Any (easier to manage if associated with the VPC's tag name)   | Any (easier to manage if associated with the VPC's tag name)   |
| VPC               | Select the VPC created above                                   | Select the VPC created above                                   |
| Availability Zone | ap-northeast-1a                                                | ap-northeast-1c                                                |
| CIDR              | 10.0.0.0/24                                                    | 10.0.1.0/24                                                    |



Based on the VPC settings above, I will configure the following.

The setup we are building looks like this.

<div style="text-align:center;">
<img src="http://i.imgur.com/Vecob6k.png" width="100%">
</div>


## Creating the Security Group

In advance, create the security group to be attached to the two instances we will create this time.

<div style="text-align:center;">
<img src="http://i.imgur.com/OMoO3DE.png" width="100%">
</div>

#### Allow SSH login from My IP

| *Item*               | Value                        |
| -------------------- | ---------------------------- |
| Security group name  | VPC-for-EIP (any)            |
| Description          | VPC-for-EIP (any)            |
| VPC                  | Select the VPC created above |

<div style="text-align:center;">
<img src="http://i.imgur.com/PV3aosl.png" width="100%">
</div>


#### Editing the created security group

- Search with the filter
<div style="text-align:center;">
<img src="http://i.imgur.com/iCAVdLY.png" width="100%">
</div>

<span style="color:red">* Adjust the following according to your environment.</span>

- Set the source to the security group ID you created, then add and save the following

| *Type*       | *Protocol*   | *Port Range* | *Source*                       | *Purpose*                                                                                                                                                          |
| ------------ | ------------ | ------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| All TCP      | TCP          | 0 - 65535    | The security group ID you created | Fully open since this is for verification. Adjust the settings as appropriate.                                                                                  |
| All ICMP     | ICMP         | 0 - 65535    | The security group ID you created | For checking ping connectivity. Fully open since this is for verification. Adjust the settings as appropriate.                                                  |
| All UDP      | UDP          | 0 - 65535    | The security group ID you created | The ports required by corosync are 5404 - 5405 by default. Be careful if you change the settings depending on your environment. Fully open since this is for verification. Adjust the settings as appropriate. |
| SSH          | TCP          | 20           | My IP                          | For SSH login from your own PC. There is no need to set this in a real environment.                                                                              |
| HTTP         | TCP          | 80           | My IP                          | For failover verification. There is no need to set this in a real environment.                                                                                   |

<div style="text-align:center;">
<img src="http://i.imgur.com/tqo68AU.png" width="100%">
</div>

That completes creating the security group to apply to the instances.


---

## Creating the Policy

This time, we need to run the following commands.

| *Command*                    | *Purpose*                                  |
| ---------------------------- | ------------------------------------------ |
| aws ec2 associate-address    | Associate an Elastic IP with an instance   |
| aws ec2 disassociate-address | Disassociate an Elastic IP from an instance |
| aws ec2 describe-addresses   | Get details about IP addresses             |




##### Access the Identity & Access Management page
<div style="text-align:center;">
<img src="http://i.imgur.com/SXbwsQO.png" width="100%">
</div>

##### Click "Create Policy"

<div style="text-align:center;">
<img src="http://i.imgur.com/YtCrsuO.png" width="100%">
</div>

##### Create a custom policy

<div style="text-align:center;">
<img src="http://i.imgur.com/ESnqZ9e.png" width="100%">
</div>

##### Enter the custom policy details

- Policy name (any)

floatingElasticIP


- Policy document

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:Describe*",
                "ec2:DisassociateAddress",
                "ec2:AssociateAddress"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```

<div style="text-align:center;">
<img src="http://i.imgur.com/pBl5BIx.png" width="100%">
</div>

##### Confirm

<div style="text-align:center;">
<img src="http://i.imgur.com/NQCNu3S.png" width="100%">
</div>





## Creating the IAM Role

Create a role that has permission to reassign the Elastic IP.

##### Click "Create New Role"
<div style="text-align:center;">
<img src="http://i.imgur.com/5gceMNE.png" width="100%">
</div>

##### Set the role name
<div style="text-align:center;">
<img src="http://i.imgur.com/jm6Xd6R.png" width="100%">
</div>

##### Select the role type
Click the "Select" button for `Amazon EC2`
<div style="text-align:center;">
<img src="http://i.imgur.com/1WlUrxd.png" width="100%">
</div>

##### Attach the policy
<div style="text-align:center;">
<img src="http://i.imgur.com/2SQnomX.png" width="100%">
</div>

##### Review the registered details and create the role
<div style="text-align:center;">
<img src="http://i.imgur.com/2ShhAQb.png" width="100%">
</div>

##### Confirm it was created
<div style="text-align:center;">
<img src="http://i.imgur.com/ku9OuEY.png" width="100%">
</div>

That completes creating the IAM role to apply to the instances.


## Creating the User

##### Access the Identity & Access Management page
<div style="text-align:center;">
<img src="http://i.imgur.com/SXbwsQO.png" width="100%">
</div>

##### Click Users in the menu & click the Create New Users button
<div style="text-align:center;">
<img src="http://i.imgur.com/CgXjbXe.png" width="100%">
</div>

##### Enter the user name and click the Create button
<div style="text-align:center;">
<img src="http://i.imgur.com/krwAV7x.png" width="100%">
</div>

##### Click Download Credentials

A CSV containing the `Access Key Id` and `Secret Access Key` will be downloaded.
Store it carefully.

<div style="text-align:center;">
<img src="http://i.imgur.com/aijHfiD.png" width="100%">
</div>

##### Access the created user

<div style="text-align:center;">
<img src="http://i.imgur.com/GZlHWhS.png" width="100%">
</div>


##### Start attaching the policy

<div style="text-align:center;">
<img src="http://i.imgur.com/7eqSqLN.png" width="100%">
</div>

##### Check the policy and attach it

<div style="text-align:center;">
<img src="http://i.imgur.com/GzFx20A.png" width="100%">
</div>

With that,
the `floatingIP` user with `AmazonEC2FullAccess` permission has been created.

The credentials for this user will be used in the `Install aws-cli` step.

---

## Creating the Instances

- Create an instance (hereafter Instance A) in the Subnet (ap-northeast-1a) of the VPC created above.


#### Click "Launch Instance"
<div style="text-align:center;">
<img src="http://i.imgur.com/xUusATW.png" width="100%">
</div>


#### Select the machine image

This time we select `CentOS 7 (x86_64) with Updates HVM`.

<div style="text-align:center;">
<img src="http://i.imgur.com/lpufR9j.png" width="100%">
</div>


#### Select the instance type

Since I want to use the free tier for verification this time, I select `t2.micro`.

<div style="text-align:center;">
<img src="http://i.imgur.com/6dtDEyx.png" width="100%">
</div>

#### Configure instance details

Set the primary IP of `Instance A`, created in `ap-northeast-1a`,
to `10.0.0.20`.

<div style="text-align:center;">
<img src="http://i.imgur.com/NLKElwj.png" width="100%">
</div>


#### Add storage

Proceed to the next step without changing anything in particular

<div style="text-align:center;">
<img src="http://i.imgur.com/oxgrhev.png" width="100%">
</div>


#### Tag the instance

Set `Instance A` for the `Name` tag.
* This is arbitrary, so any easy-to-understand text is fine.

<div style="text-align:center;">
<img src="http://i.imgur.com/hPol99o.png" width="100%">
</div>


#### Configure the security group

- Select the security group created in advance

<div style="text-align:center;">
<img src="http://i.imgur.com/M0eWyCo.png" width="100%">
</div>


#### Confirm the instance creation

<div style="text-align:center;">
<img src="http://i.imgur.com/IAEUp2R.png" width="100%">
</div>

That completes creating `Insntace A`.


## Create `Instance B` in the same way

###### Main differences from `Instance A`

- Select Subnet `10.0.1.0/24`
- Set the instance tag to `Instance B`

###### Notes when configuring `Instance B`
- For the `security group`, select the same `security group` configured for
`Instance A` for `Instance B` as well.


<div style="text-align:center;">
<img src="http://i.imgur.com/it25cK3.png" width="100%">
</div>


## Disable the Source/Destination check

* For both Instance A and B above, you need to set `Source/Destination Check` (Networking > Change Source/Dest. Check) to `Disabled`.

<div style="text-align:center;">
<img src="http://i.imgur.com/eYjJF0i.png" width="100%">
</div>


## First things to do after SSH login to the instances

#### Install the minimum required modules

* git is required when installing the shell script used to reassign the Elastic IP.

```
[Instance A & B ]# yum install -y git

[Instance A & B ]# git --version

git version 1.8.3.1
```

#### Install httpd and php for failover verification

These are installed and started purely to observe the behavior during failover.
<span style="color:red">* This is not a required step.</span>

```
[Instance A & B ]# yum --disableexcludes=main install -y gcc
[Instance A & B ]# yum install -y gmp gmp-devel
[Instance A & B ]# yum install -y php php-mysql httpd libxml2-devel net-snmp net-snmp-devel curl-devel gettext
[Instance A & B ]# echo '<?php print_r($_SERVER["SERVER_ADDR"]); ?>' > /var/www/html/index.php
[Instance A & B ]# systemctl start httpd
[Instance A & B ]# systemctl enable httpd
```



#### Adjust the system clock to JST

If the time inside the OS is out of sync with the actual time,
aws-cli may not work correctly,
so let's adjust it just in case.

```
# Take a backup
[Instance A & B ]# cp /etc/sysconfig/clock /etc/sysconfig/clock.org

# Make the setting persist even after a reboot.
[Instance A & B ]# echo -e 'ZONE="Asia/Tokyo"\nUTC=false' > /etc/sysconfig/clock

# Take a backup
[Instance A & B ]# cp /etc/localtime /etc/localtime.org

# Set Asia/Tokyo as localtime
[Instance A & B ]# ln -sf  /usr/share/zoneinfo/Asia/Tokyo /etc/localtime

[Instance A & B ]# date

```



## Creating the Elastic IP

Create an Elastic IP and associate it with `Server A`.

##### Allocate a new address

<div style="text-align:center;">
<img src="http://i.imgur.com/Xcv1hQ5.png" width="100%">
</div>

##### Click "Associate" in the confirmation popup

<div style="text-align:center;">
<img src="http://i.imgur.com/8LUxbhs.png" width="100%">
</div>

##### Confirm success

<div style="text-align:center;">
<img src="http://i.imgur.com/UQ1YPk4.png" width="100%">
</div>

##### Associate with an instance

<div style="text-align:center;">
<img src="http://i.imgur.com/Cpol9pv.png" width="100%">
</div>

##### Select the instance to associate

<div style="text-align:center;">
<img src="http://i.imgur.com/bJVJcSv.png" width="100%">
</div>

##### Confirm

<div style="text-align:center;">
<img src="http://i.imgur.com/uQlaHyf.png" width="100%">
</div>

With that, the Elastic IP has been associated with Instance A.


## SSH login to Instance A & B

- SSH login to Instance A
```
[Local PC]# ssh -i aws.pem centos@<Instance A's Public IP>
```

- SSH login to Instance B
```
[Local PC]# ssh -i aws.pem centos@<Instance B's Public IP>
```

## Configuring /etc/hosts

```
[Instance A ]# uname -n
ip-10-0-0-10.ap-northeast-1.compute.internal
```

```
[Instance B ]# uname -n
ip-10-0-1-10.ap-northeast-1.compute.internal
```

```
[Instance A & B ]# vi /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6

# Add the following
10.0.0.20 ip-10-0-0-20.ap-northeast-1.compute.internal
10.0.1.20 ip-10-0-1-20.ap-northeast-1.compute.internal
```

## Installing Pacemaker & Corosync

- pcs is the Pacemaker cluster management tool that replaces the legacy crmsh, and using pcs is recommended on RHEL/CentOS 7.

```
[Instance A & B ]# yum -y install pcs fence-agents-all
```


- Check the versions

```
[Instance A & B ]# pcs --version
0.9.143

[Instance A & B ]# pacemakerd --version
Pacemaker 1.1.13-10.el7
Written by Andrew Beekhof

[Instance A & B ]# corosync -v
Corosync Cluster Engine, version '2.3.4'
Copyright (c) 2006-2009 Red Hat, Inc.
```



## Setting the hacluster password

When the corosync package is installed, a `hacluster` user is automatically added.
Set the password for that `hacluster` user.

```
[Instance A & B ]# passwd hacluster
Changing password for user hacluster.
New password:
Retype new password:
passwd: all authentication tokens updated successfully.
```



## Starting pcsd

To perform cluster monitoring

```
[Instance A & B ]# systemctl start pcsd
[Instance A & B ]# systemctl enable pcsd
[Instance A & B ]# systemctl status pcsd
```


## Cluster authentication

Verify access authentication to each host that forms the cluster.

Run this from either one of the instances.
The following is run from Instance A.

```
[Instance A ]# pcs cluster auth ip-10-0-0-20.ap-northeast-1.compute.internal ip-10-0-1-20.ap-northeast-1.compute.internal
Username: hacluster
Password:
ip-10-0-1-20.ap-northeast-1.compute.internal: Authorized
ip-10-0-0-20.ap-northeast-1.compute.internal: Authorized
```

If you see `Authorized` output as above, there is no problem, but
if you see an error such as `Unable to Communicate` like below,
review the settings on `each Instance`.


- Example of an authentication error
```
[Instance A ]# pcs cluster auth ip-10-0-0-20.ap-northeast-1.compute.internal ip-10-0-1-20.ap-northeast-1.compute.internal -u hacluster -p ruby2015
Error: Unable to communicate with ip-10-0-0-20.ap-northeast-1.compute.internal
Error: Unable to communicate with ip-10-0-1-20.ap-northeast-1.compute.internal
```


## Cluster configuration

Configure the cluster.

```
[Instance A ]# pcs cluster setup --name aws-cluster ip-10-0-0-20.ap-northeast-1.compute.internal ip-10-0-1-20.ap-northeast-1.compute.internal --force

Shutting down pacemaker/corosync services...
Redirecting to /bin/systemctl stop  pacemaker.service
Redirecting to /bin/systemctl stop  corosync.service
Killing any remaining services...
Removing all cluster configuration files...
ip-10-0-0-20.ap-northeast-1.compute.internal: Succeeded
ip-10-0-1-20.ap-northeast-1.compute.internal: Succeeded
Synchronizing pcsd certificates on nodes ip-10-0-0-20.ap-northeast-1.compute.internal, ip-10-0-1-20.ap-northeast-1.compute.internal...
ip-10-0-0-20.ap-northeast-1.compute.internal: Success
ip-10-0-1-20.ap-northeast-1.compute.internal: Success

Restaring pcsd on the nodes in order to reload the certificates...
ip-10-0-0-20.ap-northeast-1.compute.internal: Success
ip-10-0-1-20.ap-northeast-1.compute.internal: Success
```


## Starting the cluster

Start the cluster across all hosts.

```
[Instance A ]# pcs cluster start --all

ip-10-0-1-20.ap-northeast-1.compute.internal: Starting Cluster...
ip-10-0-0-20.ap-northeast-1.compute.internal: Starting Cluster...
```

## Installing aws-cli

Use the `Access Key Id` and `Secret Access Key` written in the `credentials.csv`
that you downloaded in the `Creating the User` step.

```
[Instance A & B ]# rpm -iUvh http://dl.fedoraproject.org/pub/epel/7/x86_64/e/epel-release-7-5.noarch.rpm
[Instance A & B ]# yum -y install python-pip
[Instance A & B ]# pip --version
pip 7.1.0 from /usr/lib/python2.7/site-packages (python 2.7)

[Instance A & B ]# pip install awscli
[Instance A & B ]# aws configure
AWS Access Key ID [None]: *********************
AWS Secret Access Key [None]: **************************************
Default region name [None]: ap-northeast-1
Default output format [None]: json
```

## Creating the EIP reassignment resource

Register it as a resource that is triggered when heartbeat detects a problem.

`OCF_ROOT` is specified as a constant, but it does not exist, so

```
[Instance A & B ]# cd /tmp
[Instance A & B ]# git clone https://github.com/moomindani/aws-eip-resource-agent.git
[Instance A & B ]# cd aws-eip-resource-agent
[Instance A & B ]# sed -i 's/\${OCF_ROOT}/\/usr\/lib\/ocf/' eip
[Instance A & B ]# mv eip /usr/lib/ocf/resource.d/heartbeat/
[Instance A & B ]# chown root:root /usr/lib/ocf/resource.d/heartbeat/eip
[Instance A & B ]# chmod 0755 /usr/lib/ocf/resource.d/heartbeat/eip
```


## Configuring pacemaker

##### Disable stonish

```
[Instance A ]# pcs property set stonith-enabled=false
```

##### Configure quorum so that it does not take any special action even if `split-brain` occurs

```
[Instance A ]# pcs property set no-quorum-policy=ignore
```

> What is `split-brain`?
> When a problem such as a disconnection occurs on the network used for heartbeat communication, a host mistakenly assumes another host has failed,
> and the standby host, which should not become active, ends up becoming active.


- [Split-Brain wiki](http://linux-ha.org/wiki/Split_Brain)
- [Quorum wiki](https://ja.wikipedia.org/wiki/Quorum)


##### Set the wait time on attribute value updates ( `crmd-transition-delay` ) to 0s (seconds)

```
[Instance A ]# pcs property set crmd-transition-delay="0s"
```

- [Pacemaker-1.0.11 がリリースされました](http://linux-ha.osdn.jp/wp/archives/1498)


##### No automatic failback; set the number of attempts to restart the resource on the same server to 1

```
[Instance A ]# pcs resource defaults resource-stickiness="INFINITY" migration-threshold="1"
```

##### EIP switching configuration

The Elastic IP we created and associated with `Instance A` this time is `52.192.203.215`.
Reflect it in the following configuration.

```
[Instance A ]# pcs resource create eip ocf:heartbeat:eip \
    params \
        elastic_ip="52.192.203.215" \
    op start   timeout="60s" interval="0s"  on-fail="stop" \
    op monitor timeout="60s" interval="10s" on-fail="restart" \
    op stop    timeout="60s" interval="0s"  on-fail="block"
```

## Checking the cluster configuration

```
[Instance A ]# pcs config

pcs config
Cluster Name: aws-cluster
Corosync Nodes:
 ip-10-0-0-20.ap-northeast-1.compute.internal ip-10-0-1-20.ap-northeast-1.compute.internal
Pacemaker Nodes:
 ip-10-0-0-20.ap-northeast-1.compute.internal ip-10-0-1-20.ap-northeast-1.compute.internal

Resources:
 Resource: eip (class=ocf provider=heartbeat type=eip)
  Attributes: elastic_ip=52.192.203.215
  Operations: start interval=0s timeout=60s on-fail=stop (eip-start-interval-0s)
              monitor interval=10s timeout=60s on-fail=restart (eip-monitor-interval-10s)
              stop interval=0s timeout=60s on-fail=block (eip-stop-interval-0s)

Stonith Devices:
Fencing Levels:

Location Constraints:
Ordering Constraints:
Colocation Constraints:

Resources Defaults:
 resource-stickiness: INFINITY
 migration-threshold: 1
Operations Defaults:
 No defaults set

Cluster Properties:
 cluster-infrastructure: corosync
 cluster-name: aws-cluster
 crmd-transition-delay: 0s
 dc-version: 1.1.13-10.el7-44eb2dd
 have-watchdog: false
 no-quorum-policy: ignore
 stonith-enabled: false
```

## Verifying the failover

In the `Install httpd and php for failover verification` step,
we placed an index.php file in the DocumentRoot (/var/www/html/)
that displays the `Private IP` (`$_SERVER["SERVER_ADDR"]`).

From the browser, you can tell, based on the Private IP, whether you are
accessing Instance A or Instance B.


##### Access the Elastic IP from the browser

When you access the Elastic IP `52.192.203.215`,
you can see that the Private IP `10.0.0.20` is displayed.

You can tell that the Elastic IP is currently associated with Instance A.

<div style="text-align:center;">
<img src="http://i.imgur.com/fF2SwAb.png" width="100%">
</div>

##### Stop corosync on Instance A

```
[Instance A]# systemctl stop corosync
```

##### Access the Elastic IP from the browser again

When you reload the browser you displayed earlier a few times,
you can see that the Private IP `10.0.1.20` is displayed.

You can tell that the Elastic IP has been associated with Instance B.

<div style="text-align:center;">
<img src="http://i.imgur.com/ddnCfF5.png" width="100%">
</div>


The Elastic IP has been disassociated from Instance A and is now associated with Instance B.

You can also confirm this on the console page.

With that, although it is a simple example,
the floating IP (Elastic IP) of the Cloud Design Pattern has been achieved.


That's all.



## References

- [CentOS7.1でPacemaker+corosyncによるクラスタを構成する](http://kan3aa.hatenablog.com/entry/2015/06/05/135150)
- [PacemakerでEIPを付替えるResource Agentを書いてみた](https://moomindani.wordpress.com/2014/05/27/aws-eip-resource-agent/)
- [yum updateしたらcrmコマンドが無くなった！(pcsコマンド対照表)](http://doruby.kbmj.com/taka/20131018/yum_update_crm_pcs_)
- [pacemaker + corosync で HA クラスタ構築](http://news.mynavi.jp/news/2013/05/14/092/)
- [動かして理解するPacemaker ～CRM設定編～](http://linux-ha.osdn.jp/wp/archives/3868)
