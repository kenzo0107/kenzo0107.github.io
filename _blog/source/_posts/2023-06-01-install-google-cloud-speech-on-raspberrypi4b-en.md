---
title: Pitfalls When Installing google-cloud-speech on a Raspberry Pi 4 Model B
date: 2023-06-01
lang: en
translation_id: install-google-cloud-speech-on-raspberrypi4b
permalink: en/2023/06/01/install-google-cloud-speech-on-raspberrypi4b/
category: RaspberryPI
cover: https://i.imgur.com/vtp0VP7.png
---

## Raspberry Pi 4 Model B Environment

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

## Installing google-cloud-speech

```console
$ sudo apt-get install -y libffi-dev libssl-dev
$ pip3 install grpcio google-cloud-speech
```

## If You Hit a "No space left on device" Error

```
Could not install packages due to an EnvironmentError: [Errno 28] デバイスに空き領域がありません
```

You can work around this by temporarily pointing to a tmp directory and then running the installation again.

```
$ mkdir $HOME/tmp
$ export TMPDIR=$HOME/tmp
```

Even so, I still got the following error.

```
$ pip3 install grpcio google-cloud-speech

Command "python setup.py egg_info" failed with error code 1 in /home/pi/tmp/pip-install-qocpvlue/grpcio/
```

Instead of using the default pip, let me run https://bootstrap.pypa.io/get-pip.py with python3 to reinstall pip, and then try again.

```console
$ wget https://bootstrap.pypa.io/get-pip.py
$ sudo python3 get-pip.py
$ pip --version

pip 23.1.2 from /usr/local/lib/python3.7/dist-packages/pip (python 3.7)

$ pip install --upgrade google-cloud-speech
```

That did the trick.

I hope this helps.
