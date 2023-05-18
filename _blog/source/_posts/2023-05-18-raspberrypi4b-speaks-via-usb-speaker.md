---
title: Raspberry Pi に USB スピーカーを接続しテキストを音声変換しお話しさせる
date: 2023-05-18
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

## 概要

Raspberry Pi と OpenAI を通じて英会話しよう！という動機から
最初の一歩として USB スピーカーから指定したテキストを読み上げる様にしてみました。

## 環境

[Marstudy Raspberry Pi 4 Model B Starter キット](https://www.amazon.co.jp/gp/product/B09FHGX1QQ/?&_encoding=UTF8&tag=kenzo0107-22&linkCode=ur2&linkId=82485e7160979d4bd9f1971203c46c58&camp=247&creative=1211) で
プリインストールされた Raspbian OS を利用しています。

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

## usb スピーカー接続

[サンワサプライ コンパクト PC スピーカー MS-P08UBK](https://www.amazon.co.jp/gp/product/B071699KYN/?&_encoding=UTF8&tag=kenzo0107-22&linkCode=ur2&linkId=79fbe724887de803e45a5601f5548940&camp=247&creative=1211) を利用します。

自分が購入した 2023-05-10 は ¥857 でした。

### 接続先の USB スピーカーのカード番号・デバイス番号を確認

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

- カード番号 = 1
- デバイス番号 = 0

### 音がスピーカーから聞こえるかテスト

```
// plughw:<カード>,<デバイス>
$ speaker-test -D plughw:1,0 -t wav

// Ctrl+c で中断し終了します
```

## python スクリプトから再生してみる

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

以下実行し mp3 が再生されることが確認できます。

```console
$ python3 play_sound.py
```

## テキストから音声ファイルを作成し読み上げる

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

以下実行しスピーカーから「はい、お元気ですか？」と再生されます。

```
$ python3 speech.py
```

以上
参考になれば幸いです。

次回はマイクから音声認識させる設定を執筆したいと思います。
