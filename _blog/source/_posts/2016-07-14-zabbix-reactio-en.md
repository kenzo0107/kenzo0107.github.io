---
layout: post
title: Zabbix + Reactio Integration
date: 2016-07-14
categories:
  - [Monitoring]
  - [Infrastructure]
lang: en
translation_id: zabbix-reactio
permalink: en/2016/07/14/zabbix-reactio/
tags:
  - Monitoring
  - Zabbix
  - Reactio
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160728/20160728142804.jpg
---

## Overview

With Reactio going free, its features have been unlocked, making it possible to integrate with various monitoring and alerting tools.
Taking this opportunity, I integrated Zabbix with Reactio and put together this summary.

[Reactio is becoming free](http://blog.reactio.jp/entry/2016/07/04/090000)

## Environment

- Zabbix 3.0
- CentOS Linux release 7.2.1511 (Core)

This assumes Zabbix 3.0 is already installed and running.

## Host Configuration in the Zabbix Admin UI

<span style="color:#A9E2F3">* Skip this if it is already configured.</style>

Configuration > Hosts > create

- Host name: Project1

<img src="http://i.imgur.com/12vbmdE.png" width="400px"/>

## Creating a Reactio Project

Incidents are managed per project.

https://`<Organization ID>`.reactio.jp/settings/project

Use the Host name configured in the Zabbix admin UI as the Project name.

<div style="text-align:center;">
<img src="http://i.imgur.com/f9YS11z.png" width="100%">
</div>

## Issuing a Reactio API Key

On the same page as the project creation page, click the "+" button in the API section to issue an API KEY.

<div style="text-align:center;">
<img src="http://i.imgur.com/knN5mkT.png" width="100%">
</div>

<div style="text-align:center;">
<img src="http://i.imgur.com/HvjKrvQ.png" width="100%">
</div>

## Installing zabbix-reactio

```
$ cd /usr/lib/zabbix/alertscripts
$ git clone http://github.com/zabbix-reactio
```

## Configuring the Zabbix DB Info, the Reactio Project, and the Issued API KEY in the Config File

```
$ cd /usr/lib/zabbix/alertscripts/zabbix-reactio
$ vi config.inc
```

- Set the DB info in db_info
- Set `<Organization ID>`
- Set Project = API KEY

```
[db_info]
host = <DB Host>
user = <DB user>
pass = <DB pass>
db   = <DB name>

[reactio_url]
default = https://<Organization ID>.reactio.jp/api/v1/incidents

[api_key]
Project1 = <Project1's API KEY>
Project2 = <Project2's API KEY>
Project3 = <Project3's API KEY>
...
...
```

## Adding a DB Column

- Add a Reactio Incident ID column to the Zabbix alerts table.

```
$ cd /usr/lib/zabbix/alertscripts/zabbix-reactio
$ mysql -h <DB Host> -u <DB user> -p<DB pass> <DB name> -e "`cat add_reactioincidentid.sql`"
$ mysql -h <DB Host> -u <DB user> -p<DB pass> <DB name> -e "SHOW COLUMNS FROM alerts"

+---------------------+---------------------+------+-----+---------+-------+
| Field               | Type                | Null | Key | Default | Extra |
+---------------------+---------------------+------+-----+---------+-------+
| alertid             | bigint(20) unsigned | NO   | PRI | NULL    |       |
| actionid            | bigint(20) unsigned | NO   | MUL | NULL    |       |
| eventid             | bigint(20) unsigned | NO   | MUL | NULL    |       |
| userid              | bigint(20) unsigned | YES  | MUL | NULL    |       |
| clock               | int(11)             | NO   | MUL | 0       |       |
| mediatypeid         | bigint(20) unsigned | YES  | MUL | NULL    |       |
| sendto              | varchar(100)        | NO   |     |         |       |
| subject             | varchar(255)        | NO   |     |         |       |
| message             | text                | NO   |     | NULL    |       |
| status              | int(11)             | NO   | MUL | 0       |       |
| retries             | int(11)             | NO   |     | 0       |       |
| error               | varchar(128)        | NO   |     |         |       |
| esc_step            | int(11)             | NO   |     | 0       |       |
| alerttype           | int(11)             | NO   |     | 0       |       |
| reactio_incident_id | int(11)             | NO   |     | 0       |       |    ← you can confirm it has been added
+---------------------+---------------------+------+-----+---------+-------+
```

> In Reactio, every incident is managed by an ID.
> When Zabbix sends a failure alert notification, it calls the Reactio create-incident API and saves the incident ID.
>
> This incident ID is used when Zabbix sends a recovery alert notification and calls the Reactio update-incident-status API.

## Zabbix Media types: Creating Reactio

Administration > Media types, click the `Create media type` button

<img src="http://i.imgur.com/iSOhzpP.png" width="400px" />

<img src="http://i.imgur.com/0OXYfbW.png" width="400px" />

Enter the following values and click the `Add` button

| _Item_              | _Value_                    |
| ------------------- | -------------------------- |
| Name                | Reactio                    |
| Type                | Script                     |
| Script name         | zabbix-reactio/reactio.php |
| Script Parameters 1 | {ALERT.SUBJECT}            |
| Script Parameters 2 | {ALERT.MESSAGE}            |

## Zabbix Users: Creating Reactio

Administration > Users, click the `Create media type` button

<img src="http://i.imgur.com/Bf5bqkc.png" width="400px" />

- Create the Reactio user

<img src="http://i.imgur.com/n8aZiyV.png" width="400px" />

- Click the Media tab and enter the Media information

<img src="http://i.imgur.com/6yAyEe5.png" width="400px" />

<img src="http://i.imgur.com/VOKOpZI.png" width="400px" />

- Click the Permission tab and select Zabbix Super Admin

<img src="http://i.imgur.com/cpZkPUT.png" width="200px" />

- Click the Add button and confirm it appears in the list

<img src="http://i.imgur.com/5ubxAKL.png" width="800px" />

## Zabbix Actions: Creating the Reactio Notification

Configuration > Actions, click the Create button

<img src="http://i.imgur.com/DDQcmrG.png" width="400px" />

- Select the Action tab and enter the Action information

<img src="http://i.imgur.com/6hi0LPf.png" width="400px" />

| _Item_           | _Value_                                                                                                                                                                                                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name             | Reactio Notification                                                                                                                                                                                                                                                                                                                   |
| Default subject  | PROBLEM alert - {TRIGGER.NAME} is {TRIGGER.STATUS}                                                                                                                                                                                                                                                                                     |
| Default message  | HOST: {HOST.NAME}<br/>TRIGGER_NAME: {TRIGGER.NAME}<br/>TRIGGER_STATUS: {TRIGGER.STATUS}<br/><b/>TRIGGER_SEVERITY: {TRIGGER.SEVERITY}<br/>DATETIME: {DATE} / {TIME}<br/>ITEM_ID: {ITEM.ID1}<br/>ITEM_NAME: {ITEM.NAME1}<br/>ITEM_KEY: {ITEM.KEY1}<br/>ITEM_VALUE: {ITEM.VALUE1}<br/>EVENT_ID: {EVENT.ID}<br/>TRIGGER_URL: {TRIGGER.URL} |
| Recovery message | check                                                                                                                                                                                                                                                                                                                                  |
| Recovery subject | RECOVERY alert - {TRIGGER.NAME} is {TRIGGER.STATUS}                                                                                                                                                                                                                                                                                    |
| Recovery message | HOST: {HOST.NAME}<br/>TRIGGER_NAME: {TRIGGER.NAME}<br/>TRIGGER_STATUS: {TRIGGER.STATUS}<br/>TRIGGER_SEVERITY: {TRIGGER.SEVERITY}<br/>DATETIME: {DATE} / {TIME}<br/>ITEM_ID: {ITEM.ID1}<br/>ITEM_NAME: {ITEM.NAME1}<br/>ITEM_KEY: {ITEM.KEY1}<br/>ITEM_VALUE: {ITEM.VALUE1}<br/>EVENT_ID: {EVENT.ID}<br/>TRIGGER_URL: {TRIGGER.URL}     |
| Enabled          | check                                                                                                                                                                                                                                                                                                                                  |

The Reactio API is invoked based on the following items:

- PROBLEM/RECOVERY in the subject
- HOST: {HOST.NAME}
- EVENT_ID: {EVENT.ID}

<span style="color:red">Even when reformatting the message, make sure to keep the items above.</span>

- Select the Operations tab and enter the Operations information

<img src="https://i.imgur.com/r7MXmVg.png" width="300px" />

<img src="https://i.imgur.com/Sx36MPZ.png" width="400px" />

<img src="https://i.imgur.com/bv5hcoM.png" width="400px" />

This completes the Reactio integration setup in Zabbix.

## Results

- The incident was created!
- The status of the created incident was updated!

<div style="text-align:center;">
<img src="https://i.imgur.com/zWJpmAi.png" width="100%">
</div>

## Going Forward

I have only just started operating this.
I plan to consider future updates, such as changing the message depending on the failure severity.

Please also try the Zabbix-Slack integration below.

[zabbix3-slack](https://github.com/kenzo0107/zabbix3-slack)

That's all.
Thank you for your attention.
