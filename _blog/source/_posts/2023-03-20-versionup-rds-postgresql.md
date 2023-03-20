---
title: RDS PostgreSQL バージョンアップ
date: 2023-03-20
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## 概要

RDS PostgreSQL のバージョンアップ時に以下エラーが発生しました。

```
│ Error: updating RDS DB Instance (stg-media-postgresql-10): operation error RDS: ModifyDBInstance, https response error StatusCode: 400, RequestID: 15badd67-ea50-4189-9542-deb2df162e05, api error InvalidParameterCombination: RDS does not support creating a DB instance with the following combination: DBInstanceClass=db.t2.micro, Engine=postgres, EngineVersion=14.6, LicenseModel=postgresql-license. For supported combinations of instance class and database engine version, see the documentation.
```

db.t2.micro の場合、 postgresql 14.6 の作成をサポートしていない、
とのこと。

これは terraform で
db.t2.micro を db.t3.micro へ
postgresql を 10.23 を 14.6 へと
同時に変更しようとしても発生します。

## DB インスタンスクラス毎のサポートする DB エンジンバージョンを確認

[DB インスタンスクラスでサポートされている DB エンジン](https://docs.aws.amazon.com/ja_jp/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.html#Concepts.DBInstanceClass.Support)

db.t2 は PostgreSQL は 13 より前がサポート対象でした。

## 10.23 から 14.6 へのバージョンアップは可能か

![](https://i.imgur.com/MCMwjkj.png)

[Choosing a major version upgrade for PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_UpgradeDBInstance.PostgreSQL.html#USER_UpgradeDBInstance.PostgreSQL.MajorVersion)

10.23 は 14.6 へのバージョンアップが可能であることが確認できた。

## reg\* データがないか等の確認

[メジャーバージョンのアップグレードを実施する方法](https://docs.aws.amazon.com/ja_jp/AmazonRDS/latest/UserGuide/USER_UpgradeDBInstance.PostgreSQL.html#USER_UpgradeDBInstance.PostgreSQL.MajorVersion.Process)

上記手順に従って実施します。

> 準備済みのトランザクション - アップグレードを実行する前に、すべての準備済みのトランザクションをコミットまたはロールバックします。
>
> 次のクエリを使用して、開いている準備済みのトランザクションがインスタンスにないことを確認します。

```
SELECT count(*) FROM pg_catalog.pg_prepared_xacts;
```

> Reg* データ型 - アップグレードの実施前に reg* データ型の使用をすべて削除します。regtype と regclass を除き、reg\* データ型をアップグレードすることはできません。このデータ型は、Amazon RDS でのアップグレードで使用されているため、pg_upgrade ユーティリティで維持することはできません。

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

対象 DB では上記特段検出されず問題ないことを確認できました。

## 最終的な対応内容

1. DB インスタンスクラスを変更 db.t2 → db.t3
2. DB エンジンバージョン変更 10.23 → 14.6

1 と 2 を同時実行はできず、冒頭のエラー文が表示されます。
terraform でも AWS コンソール上でも同様のエラー文です。

1 を実行後、2 を実行する必要がありました。

## 全体的な手順

1. 検証環境でメンテナンスのリハーサル
2. 本番環境でメンテナンス

全体的には上記手順で進めました。
リハーサルで全体のメンテ時間と作業内容の再確認をしておくと
本番でテンパらずにいけるかなと。

以上
参考になれば幸いです。
