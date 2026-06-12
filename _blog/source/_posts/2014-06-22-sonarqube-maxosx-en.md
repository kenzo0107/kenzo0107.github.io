---
layout: post
title: Installing SonarQube on Mac OS X - Checking C# Coding Conventions for Unity
date: 2014-06-22
lang: en
translation_id: sonarqube-maxosx
permalink: en/2014/06/22/sonarqube-maxosx/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140620/20140620232146.png
tags:
- SonarQube
- Unity
---

[f:id:kenzo0107:20140620233131p:plain]

## Environment

* Mac OS X 10.9.3 (Marvericks)
* SonarQube 4.3.1
* SonarRunner 2.4

## Overview

* We will install a management tool for checking C# coding conventions.

## Installation Steps

### (1) Download SonarQube and SonarRunner

Please download SonarQube and SonarRunner from the official SonarQube site below.
* You can place the folders anywhere you like.

[http://www.sonarqube.org/downloads/](http://www.sonarqube.org/downloads/)

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140620/20140620232146.png" width="100%">
</div>


<span style="color: #e2241a">* As of 2014.06.20, I have confirmed that SonarQube 4.2 with MySQL 5.6 does not start.</span>
Installing via Homebrew may download an older version of the application,
and there are cases where proper operation cannot be guaranteed.


### (2) Install MySQL on macOS

The following blog was very easy to understand.

[http://blog.hyec.jp/2014/02/mac-os-x-mavericksmysql.html](http://blog.hyec.jp/2014/02/mac-os-x-mavericksmysql.html)

Just to be safe, here is the point to watch out for!

```sh
...
Installing MySQL, administrator password required ...
Password:（ログインユーザのパスワードを入力）
...
```

A password file is created based on the password you entered above.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140621/20140621002204.png" width="100%">
</div>

* By the way, I entered "seaside99" (Kujukuri Beach).

When you open the file, you will see a garbled-looking string instead of "seaside99",
<span style="color: #e2241a">but this is the password for the root account</span>.
[f:id:kenzo0107:20140621002405p:plain]


Were you able to complete the MySQL installation?
Run the following to start MySQL.

```sh
sudo /usr/local/mysql/support-files/mysql.server start
```

### (3) Create a Database for SonarQube

- 1. Run the following to log in to MySQL

```sh
/usr/local/mysql/bin/mysql -u root -p(MYSQL_PASSWORD記載のパスワード)
```

- 2. Create the "sonar" database
Run the following to create the database "sonar"

```sh
CREATE DATABASE sonar;
```

Run the following to confirm that "sonar" has been added to the databases.

```sh
SHOW databases;
```

Execution result

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

- 3. Create the "sonar" user and grant all privileges
- Create a user with ID: sonar, PW: sonar

```sh
CREATE USER 'sonar'@'localhost' IDENTIFIED BY 'sonar';
```

- Grant all privileges to the sonar user

```sh
GRANT ALL PRIVILEGES ON sonar.* TO 'sonar'@'localhost';
```

- Apply the privileges

```sh
FLUSH PRIVILEGES;
```

- The configuration is complete, so we are done

```sh
mysql> exit;
Bye
```


### (4) Edit sonar.properties

```sh
vim (SonarQubeのパス)/conf/sonar.properties
```

* The "4.2" directory is the version, so change it when you upgrade.

Since the following is the MySQL DB setting that Sonar references, uncomment "sonar.jdbc.url" to enable it.

```sh
# Comment the embedded database and uncomment the following line to use MySQL
<span style="color: #e2241a">sonar.jdbc.url=jdbc:mysql://localhost:3306/sonar?useUnicode=true&characterEncoding=utf8&rewriteBatchedStatements=true</span>
```


### (5) Edit sonar-runner.properties

```sh
vi （Sonar-Runnerのパス）/conf/sonar-runner.properties
```

For the following DB settings and account information that SonarRunner references, uncomment them to enable.

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


After completing the above configuration,
start SonarQube.

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

Now MySQL and SonarQube are both up and running.


### (6) Configure Plugins in SonarQube

- 1. Access the following URL
[http://localhost:9000]

A page like the one below will be displayed.
Click the Login link in the upper right.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622005937.png" width="100%">
</div>

- 2. Log in
Login : admin
Password : admin

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622005509.png" width="100%">
</div>

- 3. Configure the plugins for checking conventions
Click the Setting link.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622010808.png" width="100%">
</div>

The settings page will be displayed.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622011717.png" width="100%">
</div>

Install the plugins.
- C#
- ReSharper
- StyleCop
- Japanese Pack

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622013057.png" width="100%">
</div>

Click each link and then click the install button

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622013057.png" width="100%">
</div>

Once you have installed all of the above plugins, the screen will look like this.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622014025.png" width="100%">
</div>

<span style="color: #e2241a">At this state, the installation is not yet complete.</span>
You need to restart SonarQube once.

In the terminal where you ran "sonar.sh console",
press Ctrl+C once to stop SonarQube, and the following result will be output.

```sh
wrapper  | INT trapped.  Shutting down.
jvm 1    | 2014.06.22 01:48:15 INFO  Web server is stopped
wrapper  | <-- Wrapper Stopped
```


Run "sonar.sh console" again
and access SonarQube

[http://localhost:9000](http://localhost:9000)

<b>Update Center > Installed Plugins</b>
You can confirm that the plugins from earlier have been installed.
* They are localized in Japanese.
[f:id:kenzo0107:20140622015442p:plain]


### (7) Decide on the Project to Check for Coding Conventions
As an example, let's say a Unity project is located as follows.
~/Desktop/UnityProject/

Create "sonar-project.properties" in the same directory level.

```sh
$ vim sonar-project.properties
```

Enter the following content.
* sonar.sources = (specify the path where the Unity .cs files are stored)

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

### (8) Run SonarRunner
As an example, let's say SonarRunner is located as follows.
~/Desktop/sonar-runner-dist-2.4/

In the same directory where you created sonar-project.properties,
run sonar-runner

```sh
~/Desktop/sonar-runner-dist-2.4/bin/sonar-runner
```

If the following is displayed in the terminal, it succeeded

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


When you access SonarQube, the Projects section will show
a link with the sonar.projectName specified in sonar-project.properties,
so click that link

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622024118.png" width="100%">
</div>

The coding convention check will be displayed.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140622/20140622024427.png" width="100%">
</div>

Once you have gotten this far, the rest is about customizing the conventions.
That concludes this article.


For customization, go to the menu
Quality Profiles > Sonar Way
and try changing the settings.




## Supplementary Notes

I originally tried to install this in order to check C# coding conventions for Unity,
but it has a very broad coverage, supporting not only C# but also Java, PHP, Python, and more.

Other blogs mostly cover Windows, and the recommended environment is Windows,
but this article summarizes how to use it on Mac OS X.

A Jenkins plugin [Sonar Plugin] is also available,
allowing periodic checks and triggering in combination with other jobs.
