---
layout: post
title: Measuring PHP Code Metrics with Jenkins + SonarQube!
date: 2016-05-21
category: Infrastructure
lang: en
translation_id: jenkins-sonarqube-php-code-metrics
permalink: en/2016/05/21/jenkins-sonarqube-php-code-metrics/
tags:
  - PHP
  - Jenkins
  - SonarQube
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521003213.png
---

## Previously

In the previous article, I covered installing SonarQube on a server separate from Jenkins and getting to the point where it was accessible.

{% linkPreview http://kenzo0107.hatenablog.com/entry/2016/05/19/192058 _blank %}

This time, I'll walk through analyzing source code from Jenkins and displaying the metrics information in SonarQube.

Any language will do, but here I'll use PHP.

## Overview

Here is an overview.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521003213.png" width="100%">
</div>

## Preparation on the SonarQube Side

Create a project and issue a project key.

### 1. Access the Login Page

http://<sonarqube IP>:9000/sessions/new

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160520/20160520233944.png" width="100%">
</div>

By default, log in with the following admin:admin account.

| Item | Value |
| ---- | ----- |
| ID   | admin |
| PW   | admin |

### 2. Create a Project

- Click Administration in the header menu to go to the Administration page
- Click Projects > Management

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160520/20160520234632.png" width="100%">
</div>

- Click the Create button

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160520/20160520235020.png" width="100%">
</div>

- Enter the Name and Key

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521000020.png" width="100%">
</div>

- You can see that the project has been added.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521001309.png" width="100%">
</div>

### 3. Install the PHP Plugin

- On the Administration page, click System > Update Center

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521002115.png" width="100%">
</div>

- Select Available → type "PHP" in the search box → click Install on the PHP Plugin that appears

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521002430.png" width="100%">
</div>

- Restart to install the PHP Plugin into SonarQube

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521002605.png" width="100%">
</div>

- Confirm on the Installed tab that the PHP Plugin is installed

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521002918.png" width="100%">
</div>

### 4. Issue an authentication token

- Click Security > User

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521005252.png" width="100%">
</div>

- Click TOKENS to display the popup

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521005424.png" width="100%">
</div>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521005757.png" width="100%">
</div>

- Enter any string and click create

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521005946.png" width="100%">
</div>

- Copy the token.
  You'll use it when configuring the Jenkins side.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521010037.png" width="100%">
</div>

That completes the preparation on the SonarQube side.

## Preparation on the Jenkins Side

### 1. Install the SonarQube Plugin

Install the SonarQube Plugin from Manage Jenkins > Manage Plugins.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521003400.png" width="100%">
</div>

### 2. Install the SonarQube Scanner

Get the link from the official download page below.

[Analyzing+with+SonarQube+Scanner](http://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner)

```sh
$ cd /var/lib/jenkins
$ wget https://sonarsource.bintray.com/Distribution/sonar-scanner-cli/sonar-scanner-2.6.1.zip
$ unzip sonar-scanner-2.6.1.zip
$ ln -s sonar-scanner-2.6.1 sonar-scanner
```

### 3. Jenkins System Configuration

- Go to Manage Jenkins > Configure System

- Fill in the required fields under JenkinsQube servers

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521004429.png" width="100%">
</div>

- Set the path of the sonar-scanner you installed earlier under SonarQube Scanner

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521004625.png" width="100%">
</div>

Save after entering the above.

### 4. Create a New Job

Create a new job named "sonarqubeTest".

- Configure fetching the PHP project from the git repository

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521010200.png" width="100%">
</div>

- Configure the SonarScanner execution

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521010349.png" width="100%">
</div>

That completes the configuration on the Jenkins side.

## Verifying the SonarQube Results

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521010726.png" width="100%">
</div>

Incidentally, this was an EC-CUBE 1.1 project.

EC-CUBE has a high code duplication rate, which shows just how much waste there is.

That's all.
