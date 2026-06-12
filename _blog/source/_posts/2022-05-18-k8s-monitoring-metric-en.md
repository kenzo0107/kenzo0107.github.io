---
title: Displaying k8s Resources on a Display
date: 2022-05-18
lang: en
translation_id: k8s-monitoring-metric
permalink: en/2022/05/18/k8s-monitoring-metric/
category: RaspberryPI
cover: https://i.imgur.com/ROKM81Z.jpg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

This is a continuation of building a home k8s cluster.
{% linkPreview https://kenzo0107.github.io/2022/05/05/2022-05-06-ouchi-kubernetes/#more %}

I'll grab the CPU and memory of each node in the k8s cluster and show them on a display.

<!-- more -->

## Procedure

### Adding the metrics-server Pod

```console
// 2022.05.14 時点最新 commit abacf42babf4b4f623e992ff65761cd3902d0994 を参照しています。
$ wget https://github.com/kubernetes-sigs/metrics-server/releases/download/metrics-server-helm-chart-3.8.2/components.yaml -O metrics-server-components.yaml

$ vim metrics-server-components.yaml

// 以下編集
     spec:
       containers:
       - args:
         ...
         - --kubelet-insecure-tls # 追加

$ kubectl apply -f metrics-server-components.yaml

// metrics-server 関連 pod 起動確認
$ kubectl get pod metrics-server -n kube-system

...
// 以下のように表示されれば OK
metrics-server-8bb87844c-jvfnz     1/1     Running   0          31s

// k8s cluster 各ノードの CPU/Memory 表示
$ kubectl top node

NAME       CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
pikube01   466m         11%    1309Mi          35%      # master node
pikube02   171m         4%     1615Mi          43%
pikube03   576m         14%    1525Mi          40%
```

### Building and Running sampler

I'll carry out the following work on the RPi master node (pikube01).

You'll need to install Go on the RPi. See below for reference.

{% linkPreview https://kenzo0107.github.io/2022/05/14/2022-05-15-install-golang-on-raspberrypios/ %}

```console
// see: https://github.com/greghesp/assistant-relay/issues/49
$ sudo apt-get install libasound2-dev

$ git clone https://github.com/sqshq/sampler
$ cd sampler
$ GOOS=linux GOARCH=arm GOARM=7 go build
$ sudo mv sampler /usr/bin

$ cd $HOME
$ cat <<'EOF'> sampler-config.yml
gauges:
  - title: pikube01 CPU
    position: [[0, 0], [40, 6]]
    rate-ms: 30000
    color: 10
    percent-only: true
    cur:
        sample: cat /tmp/kube-node | grep pikube01 | awk '{print $3}' | tr -d "%"
    max:
        sample: echo 100
    min:
        sample: echo 0
  - title: pikube02 CPU
    position: [[0, 7], [40, 6]]
    rate-ms: 30000
    color: 13
    percent-only: true
    cur:
        sample: cat /tmp/kube-node | grep pikube02 | awk '{print $3}' | tr -d "%"
    max:
        sample: echo 100
    min:
        sample: echo 0
  - title: pikube03 CPU
    position: [[0, 13], [40, 6]]
    rate-ms: 30000
    color: 14
    percent-only: true
    cur:
        sample: cat /tmp/kube-node | grep pikube03 | awk '{print $3}' | tr -d "%"
    max:
        sample: echo 100
    min:
        sample: echo 0
  - title: pikube01 Mem
    position: [[40, 0], [40, 6]]
    rate-ms: 30000
    color: 10
    cur:
        sample: cat /tmp/kube-node | grep pikube01 | awk '{print $4}' | tr -d "Mi"
    max:
        sample: echo 4096
    min:
        sample: echo 0
  - title: pikube02 Mem
    position: [[40, 7], [40, 6]]
    rate-ms: 30000
    color: 13
    cur:
        sample: cat /tmp/kube-node | grep pikube02 | awk '{print $4}' | tr -d "Mi"
    max:
        sample: echo 4096
    min:
        sample: echo 0
  - title: pikube03 Mem
    position: [[40, 13], [40, 6]]
    rate-ms: 30000
    color: 14
    cur:
        sample: cat /tmp/kube-node | grep pikube03 | awk '{print $4}' | tr -d "Mi"
    max:
        sample: echo 4096
    min:
        sample: echo 0
textboxes:
  - title: Status
    position: [[0, 19], [80, 23]]
    rate-ms: 30000
    sample: >-
      kubectl top node > /tmp/kube-node;
      kubectl get all --all-namespaces > /tmp/kube-all;
      echo "Pod:$(cat /tmp/kube-all | grep pod/ | grep 'Running' | wc -l)"
      "Service:$(cat /tmp/kube-all | grep service/ | wc -l)"
      "Daemonset:$(cat /tmp/kube-all | grep daemonset.apps/ | wc -l)"
      "Deployment:$(cat /tmp/kube-all | grep deployment.apps/ | wc -l)"
      "Replicaset:$(cat /tmp/kube-all | grep replicaset.apps/ | wc -l)";
      echo "";
      echo "Service";
      kubectl get svc --no-headers | grep -v ClusterIP | awk '{print $1, $4, $5}' | column -t;
EOF
```

## Now Let's Launch sampler

Connect a keyboard directly to the master node and launch sampler from the console.

```
sampler -c sampler-config.yml
```

![](https://i.imgur.com/UzQ3WhN.png)

Looks cool!

![](https://i.imgur.com/2gWMfNJ.jpeg)

## A Few Gotchas

{% affiliate "Quimat 3.5インチタッチスクリーン HDMIモニタTFT LCDディスプレイ" "https://m.media-amazon.com/images/I/71F5aoqrTEL._AC_SX679_.jpg" "https://amzn.to/3lb8Kn4" "https://hb.afl.rakuten.co.jp/ichiba/27b40802.6c89c106.27b40803.63b26776/_RTLink33687?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fsakura-sakuraco%2Fsakura-sakuraco-45468%2F&link_type=picttext&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJwaWN0dGV4dCIsInNpemUiOiIyNDB4MjQwIiwibmFtIjoxLCJuYW1wIjoicmlnaHQiLCJjb20iOjEsImNvbXAiOiJkb3duIiwicHJpY2UiOjEsImJvciI6MSwiY29sIjoxLCJiYnRuIjoxLCJwcm9kIjowLCJhbXAiOmZhbHNlfQ%3D%3D" %}

I used a "QUIMAT 3.5 inch touchscreen HDMI monitor TFT LCD display" for the display, but
adjusting the resolution over the HDMI connection was difficult and gave me a hard time.

After editing `/boot/config.txt` and rebooting, the RPi wouldn't boot anymore...

SSH stopped working too, and even connecting a keyboard to the RPi didn't let me operate it. I had to force a shutdown (yanking out the power), read the SD card on a different machine, and revert `/boot/config.txt` to its original state to recover.

For the RPi4B's /boot/config.txt, I ultimately made the following edits, referring to the [official documentation](https://www.raspberrypi.com/documentation/computers/config_txt.html).

```
// 以下追加
# コンソールフレームバッファの幅
framebuffer_width=480
# コンソールフレームバッファの高さ
framebuffer_height=320

# 480x320 の解像度の設定がない為、カスタムCVTモードを定義する
# hdmi_cvt=<width> <height> <framerate> <aspect> <margins> <interlace> <rb>
hdmi_cvt=480 320 60 6 0 0 0

# HDMI が接続されていない状態で RPi を起動するとコンポジットに切り替わるのを防ぐ
# ディスプレイを HDMI に接続すると表示される様にする
hdmi_force_hotplug=1

# DMT (Display Monitor Timings、通常モニターで使用される規格) に設定
# 今回利用するディスプレイに対応
hdmi_group=2
# hdmi_group=2 にない hdmi_mode でカスタムモードを利用したい場合に設定する
hdmi_mode=87

# 通常の HDMI モード
hdmi_drive=2

# 以下コメントアウト: この設定があると解像度が変わってしまい、文字サイズが小さくなってしまう
#dtoverlay=vc4-kms-v3d
#max_framebuffers=2
```

That's all.
I hope you find this helpful.

## References

https://qiita.com/reireias/items/0d87de18f43f27a8ed9b
