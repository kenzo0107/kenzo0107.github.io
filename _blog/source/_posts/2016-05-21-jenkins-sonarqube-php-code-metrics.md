---
layout: post
title: Jenkins + SonarQube で PHPコードメトリクス計測！
date: 2016-05-21
tags:
- PHP
- Jenkins
- SonarQube
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521003213.png
---

## 前回

Jenkinsとは別のサーバ上に
SonarQube をインストールし
アクセスできるまでをまとめました。

{% linkPreview http://kenzo0107.hatenablog.com/entry/2016/05/19/192058 _blank %}


今回は Jenkins からソースを解析し
SonarQubeでのメトリクス情報を表示までの実行方法をまとめます。

言語は どれでも良いですが、 今回は PHP とします。

## Overview

以下概要になります。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521003213.png" width="100%">
</div>

## SonarQube側事前準備

プロジェクトを作成しプロジェクトキーを発行します。

### 1. ログインページへアクセス
http://<sonarqube IP>:9000/sessions/new

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160520/20160520233944.png" width="100%">
</div>

デフォルトでは以下 admin:admin アカウントでログイン

| Item | Value |
| ---- | ----- |
| ID   | admin |
| PW   | admin |

### 2. プロジェクト作成

- ヘッダーメニュー Administration クリックし Administration ページへ遷移
- Projects > Management クリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160520/20160520234632.png" width="100%">
</div>

- Create ボタンクリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160520/20160520235020.png" width="100%">
</div>

- Name, Key 入力し

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521000020.png" width="100%">
</div>

- プロジェクトが追加されたことがわかります。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521001309.png" width="100%">
</div>

### 3. PHP Plugin インストール

- Administration ページ System > Update Center クリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521002115.png" width="100%">
</div>

- Available 選択 → 検索窓で「PHP」と入力 → 表示された PHP Plugin でInstallクリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521002430.png" width="100%">
</div>

- Restart でSonarQubeに PHP Plugin インストール

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521002605.png" width="100%">
</div>

- Installed タブで PHP Plugin がインストールされていることを確認

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521002918.png" width="100%">
</div>

### 4. authentication token 発行

- Security > User クリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521005252.png" width="100%">
</div>

- TOKENS クリックしポップアップ表示

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521005424.png" width="100%">
</div>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521005757.png" width="100%">
</div>

- 任意の文字列を入力しcreate

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521005946.png" width="100%">
</div>

- tokenコピー
Jenkins側の設定時に利用します。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521010037.png" width="100%">
</div>

以上でSonarQube側の事前準備は終了です。



## Jenkins 側準備

### 1. SonarQube Plugin インストール

Jenkinsの管理 > Pluginの管理
にて SonarQube Plugin インストール

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521003400.png" width="100%">
</div>

### 2. SonarQube Scanner インストール

以下オフィシャルダウンロードページからリンク取得

[Analyzing+with+SonarQube+Scanner](http://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner)

```sh
$ cd /var/lib/jenkins
$ wget https://sonarsource.bintray.com/Distribution/sonar-scanner-cli/sonar-scanner-2.6.1.zip
$ unzip sonar-scanner-2.6.1.zip
$ ln -s sonar-scanner-2.6.1 sonar-scanner
```

### 3. Jenkinsシステム設定

- Jenkinsの管理 > システムの設定 へアクセス

- JenkinsQube servers に必要項目入力

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521004429.png" width="100%">
</div>

- SonarQube Scanner に先ほどインストールした sonar-scannerパスを設定

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521004625.png" width="100%">
</div>

上記入力後保存

### 4. ジョブ新規作成

「sonarqubeTest」という名前のジョブを新規作成します。

- git リポジトリよりPHPプロジェクト取得設定

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521010200.png" width="100%">
</div>

- SonarScanner 実行設定

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521010349.png" width="100%">
</div>

以上でJenkins側の設定完了です。


## SonarQube 反映確認

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160521/20160521010726.png" width="100%">
</div>


ちなみにこちら EC-CUBE 1.1のプロジェクトでした。

EC-CUBEのコード重複率が多く
無駄が如何に多いかがわかります。

以上です。
