---
layout: post
title: curl で FTPS (File Transfer Protocol over SSL/TLS) 接続確認
date: 2018-04-18
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180418/20180418082402.png
tags:
- FTPS
---

以下コマンドで FTPS 接続確認ができます。

```
curl -u <user> --ftp-ssl -k ftp://<ftp domain>/
```

## 概要

備忘録記事です。

社外向けに FTPS で接続許可をする必要があり設定しました。

単純に作成・更新した user, password で認証をパスできるか、
の確認だけができれば良いので、その確認方法を模索している時に
程よいコマンドがありました。

その接続確認を FileZilla, Cyberduck でしましたが
どうもうまくいかず。。

改めて、 `lftp` とか色々 ftp だけでもコマンドは多々あるんだなと実感しました。
