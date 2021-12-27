---
layout: post
title: AnsibleでSentry導入！起動確認まで10分以内♪
date: 2015-05-10
---

## Sentryとは

Sentryはアプリからイベントログを送信し集計するツールです。
エラーログの管理にも利用できます。

そのエラーが解決したかしていないか、どの程度の頻度で発生するか、などグラフ化してくれます。

他言語対応していたり
非エンジニアのプロジェクトメンバーにも
エラーログを意識させることができるので
その辺りも有用です。

## 概要

以前、 [MacOSX+Vagrant (CentOS7)にSenrtyをインストールして動作確認するまで](https://kenzo0107.github.io/2015/04/10/2015-04-11-install-sentry-on-centos7/)
という記事を書きましたが
今回はそれをAnsibleでまとめました。

## 環境

- MacOSX 10.10.3 Yosemite
- Virtual Box 4.3.26
- Vagrant 1.7.2
- ansible 1.9.1
- CentOS7

## 手順

GithubのREADMEを参照してください。
手順通りで10分で起動確認できます。

https://github.com/kenzo0107/vagrant-ansible-sentry-centos7
