---
title: RaspberryPI に Go をインストールする
date: 2022-05-15
category: RaspberryPI
---

RPi に Go をインストールする手順です。
2022.05.15 時点最新 1.18.2 をインストールします。

```console
wget https://golang.org/dl/go1.18.2.linux-armv6l.tar.gz
sudo tar -C /usr/local -xzf go1.18.2.linux-armv6l.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export PATH=$HOME/go/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

// バージョン確認
go version
```

※ Raspberry PI OS Bullseye 2022.04.04 リリースで検証しました。
