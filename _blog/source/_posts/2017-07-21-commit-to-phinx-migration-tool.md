---
layout: post
title: I used Phinx, DB migration Tool on Docker!
date: 2017-07-21
tags:
- GKE
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170721/20170721210050.png
---

## Overview

This is Sandbox for DB Migration Tool `Phinx`.

## Preparation

```sh
$ git clone https://github.com/kenzo0107/phinx-mysql
$ cd phinx-mysql
```

### Create and Run Containers of Phinx, DB (MySQL).

```sh
$ make build
```


```sh
$ docker-compose ps

         Name                       Command             State     Ports
-------------------------------------------------------------------------
phinxmysql_db-migrate_1   phinx --help                  Exit 0
phinxmysql_db_1           docker-entrypoint.sh mysqld   Up       3306/tcp
```

The Container `db-migrate` is used as for one-off container, so its state is `Exit 0`.

## Initialize Phinx Project

Phinx creates a default file called `phinx.yml`.

```sh
$ make init
```

In default setting, phinx select `development` environment.


## 1. Create Table

### Create phinx definition file

```sh
$ make create DB=hogehoge CLASS=CreateTableUsers
$ make create DB=mogemoge CLASS=CreateTableMembers
...
...
created db/migrations/hogehoge/20170724065658_create_table_users.php
created db/migrations/mogemoge/20170724065738_create_table_members.php
```

### Edit phinx definition file

- db/migrations/hogehoge/20170724065658_create_table_users.php

[Writing Migrations](http://docs.phinx.org/en/latest/migrations.html)

```php
<?php

use Phinx\Migration\AbstractMigration;
use Phinx\Db\Adapter\MysqlAdapter;

class CreateTableUsers extends AbstractMigration
{
    public function up()
    {
        // Automatically generated id is excluded, and primary key is set as user_id
        $t = $this->table('users', ['id' => 'user_id']);

        $t->addColumn('last_name',       'string',     ['limit' => 10,  'comment' => '姓'])
          ->addColumn('first_name',      'string',     ['limit' => 10,  'comment' => '名'])
          ->addColumn('last_kana_name',  'string',     ['null' => true, 'limit' => 10,  'comment' => '姓（カナ）'])
          ->addColumn('first_kana_name', 'string',     ['null' => true, 'limit' => 10,  'comment' => '名（カナ）'])
          ->addColumn('username',        'string',     ['limit' => 20,  'comment' => 'ユーザ名'])
          ->addColumn('password',        'string',     ['limit' => 40,  'comment' => 'パスワード'])
          ->addColumn('email',           'string',     ['limit' => 100, 'comment' => 'Email'])
          ->addColumn('postcode',        'string',     ['limit' => 10,  'comment' => '郵便番号'])
          ->addColumn('birthday',        'date',       ['comment' => '誕生日'])
          ->addColumn('gender',          'integer',    ['limit' => MysqlAdapter::INT_TINY, 'comment' => '性別(1:男 2:女 3:その他)'])
          ->addColumn('card_number',     'string',     ['null' => true, 'limit' => 20,  'comment' =>'クレジットカードNo'])
          ->addColumn('description',     'text',       ['null' => true, 'limit' => MysqlAdapter::TEXT_LONG, 'comment' =>'説明'])
          ->addColumn('created',         'timestamp',  ['default' => 'CURRENT_TIMESTAMP'])
          ->addColumn('updated',         'datetime',   ['null' => true])
          ->addIndex(['username', 'email'],     ['unique' => true])
          ->create();
    }

    public function down()
    {
        $this->dropTable('users');
    }
}
```

- db/migrations/mogemoge/20170724065738_create_table_members.php

```php
<?php

use Phinx\Migration\AbstractMigration;

class CreateTableMembers extends AbstractMigration
{
    public function up()
    {
        $t = $this->table('members');
        $t->addColumn('member_code', 'string',    ['limit' => 20,  'comment' => '会員コード'])
          ->addColumn('created',     'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
          ->addColumn('updated',     'datetime',  ['null' => true])
          ->addIndex(['member_code'], ['unique' => true])
          ->create();
    }

    public function down()
    {
        $this->dropTable('members');
    }
}
```

## 2. Add Column

### Create phinx definition file

```sh
$ make create CLASS=AddTableUsersColumnsCity
...
...
created db/migrations/hogehoge/20170724065838_add_table_users_columns_city.php
```

### Edit phinx definition file

- db/migrations/hogehoge/20170724065838_add_table_users_columns_city.php

Add the column `city` after the column `email`.

```php
<?php

use Phinx\Migration\AbstractMigration;

class AddTableUsersColumnsCity extends AbstractMigration
{
    public function up()
    {
        $t = $this->table('users');
        $t->addColumn('city', 'string', ['limit' => 10, 'comment' => '都市', 'after' => 'postcode'])
          ->update();
    }

    public function down()
    {
        $t = $this->table('users');
        $t->removeColumn('city')
          ->save();
    }
}
```

### Migration

```sh
$ make migrate
```

- Result

```sh
mysql> use hogehoge
mysql> show full columns from users;
+-----------------+--------------+-----------------+------+-----+-------------------+----------------+---------------------------------+---------------------------------+
| Field           | Type         | Collation       | Null | Key | Default           | Extra| Privileges                      | Comment                         |
+-----------------+--------------+-----------------+------+-----+-------------------+----------------+---------------------------------+---------------------------------+
| user_id         | int(11)      | NULL            | NO   | PRI | NULL              | auto_increment| select,insert,update,references |                                 |
| last_name       | varchar(10)  | utf8_general_ci | NO   |     | NULL              || select,insert,update,references | 姓                              |
| first_name      | varchar(10)  | utf8_general_ci | NO   |     | NULL              || select,insert,update,references | 名                              |
| last_kana_name  | varchar(10)  | utf8_general_ci | YES  |     | NULL              || select,insert,update,references | 姓（カナ）                      |
| first_kana_name | varchar(10)  | utf8_general_ci | YES  |     | NULL              || select,insert,update,references | 名（カナ）                      |
| username        | varchar(20)  | utf8_general_ci | NO   | MUL | NULL              || select,insert,update,references | ユーザ名                        |
| password        | varchar(40)  | utf8_general_ci | NO   |     | NULL              || select,insert,update,references | パスワード                      |
| email           | varchar(100) | utf8_general_ci | NO   |     | NULL              || select,insert,update,references | Email                           |
| city            | varchar(255) | utf8_general_ci | NO   |     | NULL              || select,insert,update,references |                                 |
| postcode        | varchar(10)  | utf8_general_ci | NO   |     | NULL              || select,insert,update,references | 郵便番号                        |
| birthday        | date         | NULL            | NO   |     | NULL              || select,insert,update,references | 誕生日                          |
| gender          | tinyint(4)   | NULL            | NO   |     | NULL              || select,insert,update,references | 性別(1:男 2:女 3:その他)        |
| card_number     | varchar(20)  | utf8_general_ci | YES  |     | NULL              || select,insert,update,references | クレジットカードNo              |
| description     | longtext     | utf8_general_ci | YES  |     | NULL              || select,insert,update,references | 説明                            |
| created         | timestamp    | NULL            | NO   |     | CURRENT_TIMESTAMP || select,insert,update,references |                                 |
| updated         | datetime     | NULL            | YES  |     | NULL              || select,insert,update,references |                                 |
+-----------------+--------------+-----------------+------+-----+-------------------+----------------+---------------------------------+---------------------------------+


mysql> use mogemoge
mysql> show full columns from members;
+-------------+-------------+-----------------+------+-----+-------------------+----------------+---------------------------------+-----------------+
| Field       | Type        | Collation       | Null | Key | Default           | Extra          | Privileges                      | Comment         |
+-------------+-------------+-----------------+------+-----+-------------------+----------------+---------------------------------+-----------------+
| id          | int(11)     | NULL            | NO   | PRI | NULL              | auto_increment | select,insert,update,references |                 |
| member_code | varchar(20) | utf8_general_ci | NO   | UNI | NULL              |                | select,insert,update,references | 会員コード      |
| created     | timestamp   | NULL            | NO   |     | CURRENT_TIMESTAMP |                | select,insert,update,references |                 |
| updated     | datetime    | NULL            | YES  |     | NULL              |                | select,insert,update,references |                 |
+-------------+-------------+-----------------+------+-----+-------------------+----------------+---------------------------------+-----------------+
```

### Rollback

```sh
$ make rollback
```

## 3. Create sample seeds for Multi Databases;

### Create phinx definition file

```sh
$ make seed_create DB=hogehoge CLASS=UserSeeder
$ make seed_create DB=mogemoge CLASS=MembersSeeder
...
...
created ./db/seeds/hogehoge/UsersSeeder.php
created ./db/seeds/mogemoge/MembersSeeder.php
```

### Edit phinx definition file

- ./db/seeds/hogehoge/UsersSeeder.php

```php
<?php

use Phinx\Seed\AbstractSeed;

class UsersSeeder extends AbstractSeed
{
    public function run()
    {
        $t = $this->table('users');
        $t->truncate();

        $genders = [1,2,3];

        $faker = Faker\Factory::create('ja_JP');
        $d = [];
        for ($i = 0; $i < 10; $i++) {
            $d[] = [
                'last_name'        => $faker->lastName(10),
                'first_name'       => $faker->firstName(10),
                'last_kana_name'   => $faker->lastKanaName(10),
                'first_kana_name'  => $faker->firstKanaName(10),
                'username'         => $faker->userName(20),
                'password'         => sha1($faker->password),
                'email'            => $faker->email,
                'postcode'         => $faker->postcode,
                'city'             => $faker->city,
                'birthday'         => $faker->date($format='Y-m-d',$max='now'),
                'gender'           => $faker->randomElement($genders),
                'card_number'      => $faker->creditCardNumber,
                'description'      => $faker->text(200),
                'created'          => date('Y-m-d H:i:s'),
                'updated'          => date('Y-m-d H:i:s'),
            ];
        }

        $this->insert('users', $d);
    }
}
```

- ./db/seeds/hogehoge/MembersSeeder.php

```php
<?php

use Phinx\Seed\AbstractSeed;

class MembersSeeder extends AbstractSeed
{
    public function run()
    {
        $t = $this->table('members');
        $t->truncate();

        $faker = Faker\Factory::create('ja_JP');
        $d = [];
        for ($i = 0; $i < 10; $i++) {
            $d[] = [
                'member_code'  => $faker->regexify('[0-9]{20}'),
                'created'   => date('Y-m-d H:i:s'),
                'updated'   => date('Y-m-d H:i:s'),
            ];
        }

        $this->insert('members', $d);
    }
}
```

### Run seed

```sh
$ make seed
```

- Result

```sh
mysql> use hogehoge;
mysql> select * from users;
+---------+-----------+------------+-----------------+-----------------+-------------+------------------------------------------+------------------------------+----------+--------------+------------+--------+------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------+---------------------+
| user_id | last_name | first_name | last_kana_name  | first_kana_name | username    | password                                 | email          | postcode | city         | birthday   | gender | card_number      | description                                                                                                                    | created             | updated           |
+---------+-----------+------------+-----------------+-----------------+-------------+------------------------------------------+------------------------------+----------+--------------+------------+--------+------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------+---------------------+
|       1 | 佐々木    | 零         | ヤマダ          | カナ            | akira97     | e270038c94f231da7bca25dead3e386ba3984491 | hirokawa.rika@hotmail.co.jp  | 1867251  | 佐々木市     | 1987-09-25 |      1 | 4024007116991463 | Dolor reiciendis fuga fugiat id molestiae eos. Dolores sint rem repudiandae perspiciatis. Ducimus aut mollitia aut asperiores laboriosam.                                                 | 2017-07-25 12:22:50 | 2017-07-25 12:22:50 |
|       2 | 宮沢      | 千代       | ノムラ          | ヨウイチ        | nagisa.taro | 695a90d1b84cf004357aad3eb37697b51afbf5cc | tanabe.hiroshi@kudo.org      | 8639535  | 江古田市     | 1977-06-01 |      3 | 344103919563863  | Doloribus et recusandae quam accusantium pariatur nobis reiciendis quo. Eos quae et commodi quos accusamus ex. Ullam repellendus maiores vero sit sit et.                                 | 2017-07-25 12:22:50 | 2017-07-25 12:22:50 |
|       3 | 斉藤      | 充         | ミヤケ          | オサム          | kana.suzuki | f309f34d08b4d0d686863fa38ed3d3af5e0b2104 | kana.kudo@mail.goo.ne.jp     | 2763622  | 青田市       | 1997-01-30 |      1 | 4716886227252    | Veritatis voluptatem pariatur libero aut quia. Facere nemo quos enim amet ut ipsum sequi. Nobis natus et aspernatur aut. Natus pariatur deserunt voluptatum deserunt.                     | 2017-07-25 12:22:50 | 2017-07-25 12:22:50 |
|       4 | 吉田      | 太郎       | ウノ            | ツバサ          | naoko.uno   | 45d04bda7ac79244c90a33ff68798b979138054a | taro.nagisa@hirokawa.com     | 6099661  | 江古田市     | 2006-03-19 |      2 | 5372535333698250 | Nostrum velit nostrum eos magni. Reiciendis quos enim adipisci quisquam sed voluptas. Necessitatibus sint qui dolorem animi impedit consectetur commodi.                                  | 2017-07-25 12:22:50 | 2017-07-25 12:22:50 |
|       5 | 野村      | 亮介       | サトウ          | ミノル          | rika.tanabe | dd3d50714c0775bfee453f7d9a9815ce26ba57db | wkudo@hotmail.co.jp          | 6966314  | 渡辺市       | 1985-12-21 |      1 | 4929108488987091 | Id atque molestiae expedita omnis libero natus et. Repellendus ut tenetur molestias voluptas. Perspiciatis nisi et illum aut aut vel repudiandae.                                         | 2017-07-25 12:22:50 | 2017-07-25 12:22:50 |
|       6 | 木村      | 裕美子     | タナカ          | ヒロキ          | hiroshi53   | 033bfd0493b72efd0ff60bc15c7eeb3b2e054501 | ztanabe@tanabe.biz          | 3155238  | 山田市       | 1996-01-02 |      3 | 5476616628100007 | Assumenda consectetur ea sed et omnis alias fugiat quo. Porro nihil similique sint laudantium asperiores blanditiis. Error dolores vitae quia explicabo facilis deleniti distinctio.      | 2017-07-25 12:22:50 | 2017-07-25 12:22:50 |
|       7 | 吉本      | 陽一       | キムラ          | ヒデキ          | akira27     | 51de6afc65f535ae58f927d698f07e60e04c7746 | rika59@suzuki.com          | 6457702  | 田辺市       | 2010-04-12 |      2 | 5388155063289311 | Nesciunt qui beatae ut officia qui error autem. Temporibus alias earum ullam incidunt quo recusandae enim qui. Sed atque veritatis sed ad ullam qui. Repellendus est nostrum et pariatur. | 2017-07-25 12:22:50 | 2017-07-25 12:22:50 |
|       8 | 渡辺      | 翔太       | ササダ          | クミコ          | uno.momoko  | fa2d16d5f2acffd5aeeaab6791fe64c9f70a9b2f | stanabe@uno.com          | 5849600  | 伊藤市       | 2012-06-09 |      1 | 5274550197820022 | Odio quasi sunt tempora. Molestias aut qui sed quos beatae eum accusantium. Non dolores quam veniam et ab quidem nostrum repellendus. Qui ducimus et optio et.                            | 2017-07-25 12:22:50 | 2017-07-25 12:22:50 |
|       9 | 坂本      | 翔太       | ナカツガワ      | ナオキ          | akira.kudo  | 4af41e536bf19fa3cb0527304adad0de76260e82 | suzuki.momoko@mail.goo.ne.jp | 8609563  | 宮沢市       | 2005-10-23 |      3 | 5231530310398512 | Qui id neque molestiae facere aut et consequatur. Delectus ea voluptatibus provident atque assumenda maxime eum. At quidem sint accusamus. Eaque sed voluptate quo sint non non.          | 2017-07-25 12:22:50 | 2017-07-25 12:22:50 |
|      10 | 野村      | 翼         | ヒロカワ        | ナオコ          | taro.kudo   | f8a63d0010c99d6403e0c1f458005b934ec03f8c | kana.tanabe@mail.goo.ne.jp   | 5804069  | 桐山市       | 1988-12-25 |      2 | 5140671281503530 | Dolorem consequatur nulla alias perspiciatis ut. Tenetur modi cumque incidunt dolor.                                                                                                      | 2017-07-25 12:22:50 | 2017-07-25 12:22:50 |
+---------+-----------+------------+-----------------+-----------------+-------------+------------------------------------------+------------------------------+----------+--------------+------------+--------+------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------+---------------------+



mysql> use mogemoge;
mysql> select * from members;

+----+----------------------+---------------------+---------------------+
| id | member_code          | created             | updated             |
+----+----------------------+---------------------+---------------------+
|  1 | 86190539096622228312 | 2017-07-25 12:22:51 | 2017-07-25 12:22:51 |
|  2 | 77322186584623078448 | 2017-07-25 12:22:51 | 2017-07-25 12:22:51 |
|  3 | 17169562241415794809 | 2017-07-25 12:22:51 | 2017-07-25 12:22:51 |
|  4 | 86738824931379981947 | 2017-07-25 12:22:51 | 2017-07-25 12:22:51 |
|  5 | 23125815173540252188 | 2017-07-25 12:22:51 | 2017-07-25 12:22:51 |
|  6 | 81839177491562485300 | 2017-07-25 12:22:51 | 2017-07-25 12:22:51 |
|  7 | 82938165381845652192 | 2017-07-25 12:22:51 | 2017-07-25 12:22:51 |
|  8 | 87208503292784158954 | 2017-07-25 12:22:51 | 2017-07-25 12:22:51 |
|  9 | 80172779107984112104 | 2017-07-25 12:22:51 | 2017-07-25 12:22:51 |
| 10 | 22825755425594828330 | 2017-07-25 12:22:51 | 2017-07-25 12:22:51 |
+----+----------------------+---------------------+---------------------+
```

## Reference

- [fzaninotto/Faker](https://github.com/fzaninotto/Faker)
