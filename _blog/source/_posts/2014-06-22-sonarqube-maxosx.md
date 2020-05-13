---
layout: post
title: Mac OS X に SonarQube 導入 - UnityのC#コーディング規約チェック
date: 2014-06-22
tags:
- SonarQube
- Unity
---

[f:id:kenzo0107:20140620233131p:plain]

## 環境

* Mac OS X 10.9.3 (Marvericks)
* SonarQube 4.3.1
* SonarRunner 2.4

## 概要

* C#のコーディング規約チェック管理ツールを導入します。

## 導入手順

### ①SonarQube, SonarRunnerをダウンロード

以下SonarQube公式サイトより
SonarQube, SonarRunnerをダウンロードして下さい。
※フォルダはどこに配置しても構いません。

[http://www.sonarqube.org/downloads/](http://www.sonarqube.org/downloads/)

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140620/20140620232146.png" width="100%">
</div>


<span style="color: #e2241a">※2014.06.20現在、SonarQube4.2, MySQL5.6 では起動しないことを確認しています。</span>
Homebrewでのインストールはバージョンが古いアプリケーションをDLする可能性があり、
動作保証が取れない場合があります。


### ②MySQL MacOSにインストール

以下ブログが非常にわかりやすかったです。

[http://blog.hyec.jp/2014/02/mac-os-x-mavericksmysql.html](http://blog.hyec.jp/2014/02/mac-os-x-mavericksmysql.html)

念の為、懸念箇所はここ！

```sh
...
Installing MySQL, administrator password required ...
Password:（ログインユーザのパスワードを入力）
...
```

上記で入力したパスワードを元にパスワードファイルが作成されます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140621/20140621002204.png" width="100%">
</div>

※ちなみに「seaside99」(九十九里浜)と入力しました。

ファイルを開くと「seaside99」でなく文字化け？という文字列が並んでいますが、
<span style="color: #e2241a">これがrootアカウントのパスワードです</span>。
[f:id:kenzo0107:20140621002405p:plain]


MySQLインストールが完了できたでしょうか？
以下実行し、MySQLを起動しましょう。

```sh
sudo /usr/local/mysql/support-files/mysql.server start
```

### ③SonarQube用のDatabase作成

- 1. 以下実行し、MySQLにログイン

```sh
/usr/local/mysql/bin/mysql -u root -p(MYSQL_PASSWORD記載のパスワード)
```

- 2. 「sonar」データベース作成
以下実行でデータベース「sonar」作成

```sh
CREATE DATABASE sonar;
```

以下実行し、Databaseに「sonar」が追加されていることを確認する。

```sh
SHOW databases;
```

実行結果

```sh
mysql> SHOW databases;
 +--------------------+
 | Database           |
 +--------------------+
 | information_schema |
 | mysql              |
 | performance_schema |
 | sonar              |
 | test               |
 +--------------------+
 5 rows in set (0.00 sec)
```

- 3. 「sonar」ユーザを作成し、全権限を委譲
・ID:sonar PW:sonar のユーザ作成

```sh
CREATE USER 'sonar'@'localhost' IDENTIFIED BY 'sonar';
```

・sonarユーザに全権限付与

```sh
GRANT ALL PRIVILEGES ON sonar.* TO 'sonar'@'localhost';
```

・権限反映

```sh
FLUSH PRIVILEGES;
```

・設定完了したので終わり

```sh
mysql> exit;
Bye
```


### ④sonar.properties編集

```sh
vim (SonarQubeのパス)/conf/sonar.properties
```

※「4.2」ディレクトリはバージョンなのでバージョンアップ時は変更してください。

以下Sonarが参照するMySQLのDB設定の為、「sonar.jdbc.url」のコメントアウトを外して有効化してください。

```sh
# Comment the embedded database and uncomment the following line to use MySQL
<span style="color: #e2241a">sonar.jdbc.url=jdbc:mysql://localhost:3306/sonar?useUnicode=true&characterEncoding=utf8&rewriteBatchedStatements=true</span>
```


### ⑤sonar-runner.properties編集

```sh
vi （Sonar-Runnerのパス）/conf/sonar-runner.properties
```

以下SonarRunnerが参照するDB設定、アカウント情報についてコメントアウトを外し有効化してください。

```sh
#Configure here general information about the environment, such as SonarQube DB details for example
#No information about specific project should appear here

#----- MySQL
sonar.jdbc.url=jdbc:mysql://localhost:3306/sonar?useUnicode=true&characterEncoding=utf8

#----- Global database settings
sonar.jdbc.username=sonar
sonar.jdbc.password=sonar

#----- Default source code encoding
sonar.sourceEncoding=UTF-8

#----- Security (when 'sonar.forceAuthentication' is set to 'true')
sonar.login=admin
sonar.password=admin
```


上記設定完了後、
SonarQubeを起動します。

```sh
$ (SonarQubeパス)/bin/macosx-universal-64/sonar.sh console
Running SonarQube...
wrapper  | --> Wrapper Started as Console
wrapper  | Launching a JVM...
jvm 1    | Wrapper (Version 3.2.3) http://wrapper.tanukisoftware.org
jvm 1    |   Copyright 1999-2006 Tanuki Software, Inc.  All Rights Reserved.
jvm 1    |
jvm 1    | 2014.06.25 11:00:48 INFO  Web server is started
```

以上で MySQL, SonarQube が起動している状態になりました。


### ⑥SonarQubeでのプラグイン設定

- 1. 以下URLにアクセス
[http://localhost:9000]

以下のようなページが表示されます。
右上のLoginリンク押下します。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622005937.png" width="100%">
</div>

- 2. Loginします
Login : admin
Password : admin

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622005509.png" width="100%">
</div>

- 3. 規約チェックするプラグインを設定する
Settingリンク押下します。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622010808.png" width="100%">
</div>

設定ページが表示されます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622011717.png" width="100%">
</div>

Pluginをインストールします。
・C#
・ReSharper
・StyleCop
・Japanese Pack

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622013057.png" width="100%">
</div>

各リンクを押下し、installボタン押下

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622013057.png" width="100%">
</div>

上記全Pluginをインストールすると以下のように表示されます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622014025.png" width="100%">
</div>

<span style="color: #e2241a">この状態では、まだインストールが完了していません。</span>
一度、SonarQubeを再起動させる必要があります。

「sonar.sh console」を実行したターミナルで
一度Ctr+CでSonarQubeをストップさせると以下結果が出力されます。

```sh
wrapper  | INT trapped.  Shutting down.
jvm 1    | 2014.06.22 01:48:15 INFO  Web server is stopped
wrapper  | <-- Wrapper Stopped
```


再度「sonar.sh console」を実行させ
SonarQubeにアクセス

[http://localhost:9000](http://localhost:9000)

<b>アップデートセンター＞Installed Plugins</b>
先ほどのPluginがインストール済みであることが確認できます。
※日本語化されてます。
[f:id:kenzo0107:20140622015442p:plain]


### ⑦コーディング規約チェックをしたいプロジェクト決定
例として、以下にUnityプロジェクトを配置しているとします。
~/Desktop/UnityProject/

同階層に「sonar-project.properties」作成します。

```sh
$ vim sonar-project.properties
```

内容は以下を入力してください。
※sonar.sources=（Unityのcsファイル格納パスを指定してください）

```sh
# Project identification
sonar.projectKey=Unity:DemoApp
sonar.projectVersion=1.0
sonar.projectName=AppliName

# Info required for Sonar
sonar.sources=~/Desktop/UnityProject/Assets/Scripts

# Comma-separated paths to directories with sources (required)
sonar.language=cs

#----- Default source code encoding
sonar.sourceEncoding=UTF-8
```

### ⑧SonarRunner実行
例として、以下にSonarRunnerを配置しているとします。
~/Desktop/sonar-runner-dist-2.4/

sonar-project.properties作成した同階層で
sonar-runnerを実行

```sh
~/Desktop/sonar-runner-dist-2.4/bin/sonar-runner
```

ターミナルに以下が表示されると成功

```sh
INFO  - 37/37 source files analyzed
02:37:00.544 INFO  - Sensor org.sonar.plugins.csharp.squid.CSharpSquidSensor@625cb0bb done: 1476 ms
02:37:01.246 INFO  - Execute decorators...
02:37:05.536 INFO  - Store results in database
02:37:05.839 INFO  - ANALYSIS SUCCESSFUL, you can browse http://localhost:9000/dashboard/index/Unity:DemoApp
02:37:05.945 INFO  - Executing post-job class org.sonar.plugins.core.issue.notification.SendIssueNotificationsPostJob
02:37:05.974 INFO  - Executing post-job class org.sonar.plugins.core.batch.IndexProjectPostJob
02:37:06.539 INFO  - Executing post-job class org.sonar.plugins.dbcleaner.ProjectPurgePostJob
02:37:06.552 INFO  - -> Keep one snapshot per day between 2014-05-25 and 2014-06-21
02:37:06.553 INFO  - -> Keep one snapshot per week between 2013-06-23 and 2014-05-25
02:37:06.554 INFO  - -> Keep one snapshot per month between 2009-06-28 and 2013-06-23
02:37:06.554 INFO  - -> Delete data prior to: 2009-06-28
02:37:06.560 INFO  - -> Clean AppliName [id=371]
INFO: ------------------------------------------------------------------------
INFO: EXECUTION SUCCESS
INFO: ------------------------------------------------------------------------
Total time: 24.508s
Final Memory: 6M/87M
INFO: ------------------------------------------------------------------------
```


SonarQubeにアクセスするとProjects項目に
sonar-project.propertiesで指定した
sonar.projectNameリンクが表示されているので
リンク押下

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622024118.png" width="100%">
</div>

コーディング規約のチェックが表示されます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622024427.png" width="100%">
</div>

まずここまで出来たらあとは規約のカスタマイズになります。
本件は以上までとします。


カスタマイズはメニューの
品質プロファイル＞ Sonar Way
と進み、設定変更してみましょう。





## 補足

元々UnityのC#コーディング規約チェック実施する為に導入を試みましたが、
C#だけでなくJava, PHP, Python等かなり守備範囲が広いです。

他ブログではWindowsが多く、推奨環境としてはWindowsですが
MacOS Xで利用したい場合を本記事はまとめました。

Jenkins用Plugin [Sonar Plugin]も用意されており
定期チェックや他Jobと組み合わせてキックが可能です。
