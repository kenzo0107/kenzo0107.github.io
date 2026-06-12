---
title: Upgrading RDS PostgreSQL
date: 2023-03-20
lang: en
translation_id: versionup-rds-postgresql
permalink: en/2023/03/20/versionup-rds-postgresql/
cover: https://i.imgur.com/MCMwjkj.png
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

Here is a summary of the things I got stuck on while upgrading RDS PostgreSQL.

<!-- more -->

## Overview

The following error occurred when upgrading RDS PostgreSQL.

```
│ Error: updating RDS DB Instance (stg-media-postgresql-10): operation error RDS: ModifyDBInstance, https response error StatusCode: 400, RequestID: 15badd67-ea50-4189-9542-deb2df162e05, api error InvalidParameterCombination: RDS does not support creating a DB instance with the following combination: DBInstanceClass=db.t2.micro, Engine=postgres, EngineVersion=14.6, LicenseModel=postgresql-license. For supported combinations of instance class and database engine version, see the documentation.
```

It says that db.t2.micro does not support creating postgresql 14.6.

This also happens if you try to change, with terraform, db.t2.micro to db.t3.micro and postgresql from 10.23 to 14.6 at the same time.

## Checking which DB engine versions each DB instance class supports

[DB engine support for DB instance classes](https://docs.aws.amazon.com/ja_jp/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.html#Concepts.DBInstanceClass.Support)

For db.t2, PostgreSQL versions prior to 13 were supported.

## Is an upgrade from 10.23 to 14.6 possible?

![](https://i.imgur.com/MCMwjkj.png)

[Choosing a major version upgrade for PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_UpgradeDBInstance.PostgreSQL.html#USER_UpgradeDBInstance.PostgreSQL.MajorVersion)

I was able to confirm that 10.23 can be upgraded to 14.6.

## Checking for reg\* data and so on

[How to perform a major version upgrade](https://docs.aws.amazon.com/ja_jp/AmazonRDS/latest/UserGuide/USER_UpgradeDBInstance.PostgreSQL.html#USER_UpgradeDBInstance.PostgreSQL.MajorVersion.Process)

I followed the procedure above.

> Prepared transactions - Before performing the upgrade, commit or roll back all prepared transactions.
>
> Use the following query to verify that there are no open prepared transactions on the instance.

```
SELECT count(*) FROM pg_catalog.pg_prepared_xacts;
```

> Reg* data types - Before performing the upgrade, remove all uses of reg* data types. Except for regtype and regclass, you cannot upgrade reg\* data types. These data types cannot be preserved by the pg_upgrade utility because they are used in upgrades on Amazon RDS.

```
SELECT count(*) FROM pg_catalog.pg_class c, pg_catalog.pg_namespace n, pg_catalog.pg_attribute a
  WHERE c.oid = a.attrelid
      AND NOT a.attisdropped
      AND a.atttypid IN ('pg_catalog.regproc'::pg_catalog.regtype,
                         'pg_catalog.regprocedure'::pg_catalog.regtype,
                         'pg_catalog.regoper'::pg_catalog.regtype,
                         'pg_catalog.regoperator'::pg_catalog.regtype,
                         'pg_catalog.regconfig'::pg_catalog.regtype,
                         'pg_catalog.regdictionary'::pg_catalog.regtype)
      AND c.relnamespace = n.oid
      AND n.nspname NOT IN ('pg_catalog', 'information_schema');
```

For the target DB, none of the above were detected, and I was able to confirm there were no issues.

## The final approach

1. Change the DB instance class: db.t2 → db.t3
2. Change the DB engine version: 10.23 → 14.6

You cannot run 1 and 2 at the same time; the error shown at the beginning appears.
The error is the same whether you use terraform or the AWS console.

I had to run 1 first, and then run 2.

## The overall procedure

1. Rehearse the maintenance in the verification environment
2. Perform the maintenance in the production environment

Overall, I proceeded with the procedure above.
By rehearsing to re-confirm the total maintenance time and the work involved, I think you can go into production without panicking.

That's all.
I hope this is helpful.
