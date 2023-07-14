---
title: Raspberry Pi 4 Model B に google-cloud-speech インストール時にハマったこと
date: 2023-06-01
category: RaspberryPI
cover: https://i.imgur.com/vtp0VP7.png
---

## Raspberry Pi 4 Model B の環境

```console
$ cat /etc/os-release

PRETTY_NAME="Raspbian GNU/Linux 10 (buster)"
NAME="Raspbian GNU/Linux"
VERSION_ID="10"
VERSION="10 (buster)"
VERSION_CODENAME=buster
ID=raspbian
ID_LIKE=debian
HOME_URL="http://www.raspbian.org/"
SUPPORT_URL="http://www.raspbian.org/RaspbianForums"
BUG_REPORT_URL="http://www.raspbian.org/RaspbianBugs"

$ cat /proc/version

Linux version 5.10.103-v8+ (dom@buildbot) (aarch64-linux-gnu-gcc-8 (Ubuntu/Linaro 8.4.0-3ubuntu1) 8.4.0, GNU ld (GNU Binutils for Ubuntu) 2.34) #1529 SMP PREEMPT Tue Mar 8 12:26:46 GMT 2022

$ uname -a

Linux pi4b-talk 5.10.103-v8+ #1529 SMP PREEMPT Tue Mar 8 12:26:46 GMT 2022 aarch64 GNU/Linux
```

## google-cloud-speech インストール

```console
$ sudo apt-get install -y libffi-dev libssl-dev
$ pip3 install grpcio google-cloud-speech
```

## 「デバイスに空き領域がありません」エラーが発生した場合

```
Could not install packages due to an EnvironmentError: [Errno 28] デバイスに空き領域がありません
```

一時的に tmp ディレクトリを指定してからインストールを再度実行することで回避できます。

```
$ mkdir $HOME/tmp
$ export TMPDIR=$HOME/tmp
```

それでも以下エラーが出ました。

```
$ pip3 install grpcio google-cloud-speech

Command "python setup.py egg_info" failed with error code 1 in /home/pi/tmp/pip-install-qocpvlue/grpcio/
```

デフォルトの pip でなく
python3 で https://bootstrap.pypa.io/get-pip.py 実行し
pip をインストールし直し、再チャレンジしてみます。

```console
$ wget https://bootstrap.pypa.io/get-pip.py
$ sudo python3 get-pip.py
$ pip --version

pip 23.1.2 from /usr/local/lib/python3.7/dist-packages/pip (python 3.7)

$ pip install --upgrade google-cloud-speech
```

以上で成功しました。

参考になれば幸いです。
