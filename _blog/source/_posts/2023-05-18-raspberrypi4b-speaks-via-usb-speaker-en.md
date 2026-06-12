---
title: Connecting a USB Speaker to a Raspberry Pi to Convert Text to Speech and Have It Talk
date: 2023-05-18
lang: en
translation_id: raspberrypi4b-speaks-via-usb-speaker
permalink: en/2023/05/18/raspberrypi4b-speaks-via-usb-speaker/
category: RaspberryPI
cover: https://i.imgur.com/ZH5dJw5.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## Overview

Motivated by the idea of "Let's have English conversations through a Raspberry Pi and OpenAI!",
as a first step I made it read out specified text through a USB speaker.

## Environment

I'm using the Raspbian OS that came preinstalled with the [Marstudy Raspberry Pi 4 Model B Starter Kit](https://www.amazon.co.jp/gp/product/B09FHGX1QQ/?&_encoding=UTF8&tag=kenzo0107-22&linkCode=ur2&linkId=82485e7160979d4bd9f1971203c46c58&camp=247&creative=1211).

```
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
```

## Connecting the USB Speaker

I'm using the [Sanwa Supply Compact PC Speaker MS-P08UBK](https://www.amazon.co.jp/gp/product/B071699KYN/?&_encoding=UTF8&tag=kenzo0107-22&linkCode=ur2&linkId=79fbe724887de803e45a5601f5548940&camp=247&creative=1211).

When I bought it on 2023-05-10, it was ¥857.

### Check the card number and device number of the connected USB speaker

```console
$ aplay -l
**** ハードウェアデバイス PLAYBACK のリスト ****
カード 1: Headphones [bcm2835 Headphones], デバイス 0: bcm2835 Headphones [bcm2835 Headphones]
  サブデバイス: 8/8
  サブデバイス #0: subdevice #0
  サブデバイス #1: subdevice #1
  サブデバイス #2: subdevice #2
  サブデバイス #3: subdevice #3
  サブデバイス #4: subdevice #4
  サブデバイス #5: subdevice #5
  サブデバイス #6: subdevice #6
  サブデバイス #7: subdevice #7
```

- Card number = 1
- Device number = 0

### Test whether sound can be heard from the speaker

```
// plughw:<card>,<device>
$ speaker-test -D plughw:1,0 -t wav

// Stop and exit with Ctrl+c
```

## Playing sound from a Python script

```console
$ pip3 install pygame
```

```console
$ curl https://www.soundjay.com/buttons/button-3.mp3 -o button.mp3
```

- play_sound.py

```python
import pygame


def play_sound_file(file_path):
    pygame.mixer.init()
    pygame.mixer.music.load(file_path)
    pygame.mixer.music.play()

    while pygame.mixer.music.get_busy() == True:
        continue

if __name__ == "__main__":
    play_sound_file('button.mp3')
```

Running the following confirms that the mp3 is played.

```console
$ python3 play_sound.py
```

## Generating an audio file from text and reading it aloud

- speech.py

```console
$ pip3 install gTTS
$ pip3 install pydub
```

```python
from gtts import gTTS
from pydub import AudioSegment
from pydub.playback import play
import sys


def speechja(stext):
    tts = gTTS(stext, lang="ja")
    tts.save("/tmp/out.mp3")

    sound = AudioSegment.from_mp3("/tmp/out.mp3")
    play(sound)


if __name__ == "__main__":
    msg = "はい、お元気ですか？"
    speechja(msg)
```

Running the following plays "はい、お元気ですか？" from the speaker.

```
$ python3 speech.py
```

That's all.
I hope this is helpful.

Next time I'd like to write about the setup for speech recognition from a microphone.
