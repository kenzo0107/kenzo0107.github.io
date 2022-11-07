---
title: おうち k8s 構築
date: 2022-05-06
category: RaspberryPI
cover: https://i.imgur.com/RgpOXr3.jpg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

<!-- more -->

Raspberry PI で Kubernetes クラスタを構築しました。

会社の「テックサポート制度」により、 Raspberry PI がサポート対象となり、遺憾無くお金を使わせてもらうことができる様になりました。
その甲斐あって、兼ねてより家で k8s cluster を飼う、というエンジニア冥利に尽きる所作を味わいたくチャレンジさせていただきました。

普段は AWS で Fargate を利用するケースが多く、 kubernetes を利用するシーンがなく、興味もあり、学びを広げたい意図があります。

## 目的

Raspberry PI のようなベアメタル環境で OS をインストールし k8s 関連パッケージを構築し、構築に必要な大まかな流れを理解する、
です。

以下を実施していきます。

1. Raspberry PI OS インストール
2. kubernetes cluster 構築
3. Metal LB 構築

非常に学びとハマりポイントが多かったので、以下に記していきたいと思います。

## 購入したものリスト

2022 年 4 月下旬、Raspberry PI 単体でなく、スターターキットでの取り扱いが多かったです。
スターターキットは単体に比べやや高くなりますが、その辺は[会社](https://medpeer.co.jp/recruit/)のサポート制度の力を存分にお借りしました ♪

{% affiliate "Raspberry PI 4B 4GB スターターキット" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B07YLY143F&Format=_SL160_&ID=AsinImage&MarketPlace=JP&ServiceVersion=20070822&WS=1&tag=kenzo0107-22&language=ja_JP" "https://www.amazon.co.jp/CanaKit-Raspberry-%E3%82%B9%E3%82%BF%E3%83%BC%E3%82%BF%E3%83%BC%E3%82%AD%E3%83%83%E3%83%88-%E3%82%AF%E3%83%AA%E3%82%A2%E3%82%B1%E3%83%BC%E3%82%B9%E4%BB%98%E3%81%8D-PI4-STR32EWF-C4-CLR/dp/B07YLY143F?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&crid=1O7RHSIN45Y49&keywords=Pi4+B+4GB+%E3%82%B9%E3%82%BF%E3%83%BC%E3%82%BF%E3%83%BC+%E3%82%AD%E3%83%83%E3%83%88+7%E7%82%B9%E3%82%BB%E3%83%83%E3%83%88+V4+%E3%82%AA%E3%83%B3%E3%83%A9%E3%82%A4%E3%83%B3%E6%95%99%E6%9D%90&qid=1651933444&sprefix=raspberry+pi+4b+%E3%82%B9%E3%82%BF%E3%83%BC%E3%82%BF%E3%83%BC%E3%82%AD%E3%83%83%E3%83%88%2Caps%2C476&sr=8-27&linkCode=li2&tag=kenzo0107-22&linkId=f8b93f80255639d3b5cc614c2ec24ce2&language=ja_JP&ref_=as_li_ss_il" "https://hb.afl.rakuten.co.jp/ichiba/23166659.8ed3e37c.2316665a.b61e268d/_RTLink33687?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fmcpjapan%2Fv_35027214434455%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

{% affiliate "LAN ケーブル CAT6 フラット ホワイト 5本 0.15m" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B08143HR4H&Format=_SL160_&ID=AsinImage&MarketPlace=JP&ServiceVersion=20070822&WS=1&tag=kenzo0107-22&language=ja_JP" "https://www.amazon.co.jp/gp/product/B08143HR4H?ie=UTF8&psc=1&linkCode=li2&tag=kenzo0107-22&linkId=c770488d0f88935f656f83a671841bca&language=ja_JP&ref_=as_li_ss_il" "https://hb.afl.rakuten.co.jp/ichiba/2760f4f3.6a3c6189.2760f4f4.89ee5ab7/_RTLink33687?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fshop-gimigimi%2F4946718646184%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

{% affiliate "エレコム スイッチングハブ ギガビット 5ポート" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B017SFTMFS&Format=_SL160_&ID=AsinImage&MarketPlace=JP&ServiceVersion=20070822&WS=1&tag=kenzo0107-22&language=ja_JP" "https://www.amazon.co.jp/gp/product/B017SFTMFS?ie=UTF8&psc=1&linkCode=li2&tag=kenzo0107-22&linkId=17398f672442f8b5d32953da671abce1&language=ja_JP&ref_=as_li_ss_il" "https://hb.afl.rakuten.co.jp/ichiba/2760f8ce.30eb2ea8.2760f8cf.f9e60d37/_RTLink33687?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fthinkrich%2Fzzr00464%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

{% affiliate "GeeekPi Raspberry Pi4クラスターケース冷却ファンとRaspberryPi4ヒートシンク付きRaspberryPi4ケースアクリルケース" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B07TJZ2HDG&Format=_SL160_&ID=AsinImage&MarketPlace=JP&ServiceVersion=20070822&WS=1&tag=kenzo0107-22&language=ja_JP" "https://www.amazon.co.jp/gp/product/B07TJZ2HDG?ie=UTF8&psc=1&linkCode=li2&tag=kenzo0107-22&linkId=ffd6f2b502cb234e395ba1195bdb821c&language=ja_JP&ref_=as_li_ss_il" "https://hb.afl.rakuten.co.jp/ichiba/2760fa3a.b36cda69.2760fa3b.5565ad0e/_RTLink33687?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Falmeria%2F39044535755%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

## Raspberry Pi Imager で OS 書き込み

![](https://i.imgur.com/Ibrwfyu.png)

2022-04-26 時点で最新の Raspberry PI OS Lite (32-bit) Bullseye を選択しました。
今回の要件に GUI は不要で極力軽めのイメージを利用したかった為です。

![](https://i.imgur.com/Crtub61.png)

設定でホスト名や Wifi の設定をしておくと後が楽です。

SD カードにイメージを書き込みし、 Raspberry PI に差し込み、起動します。

## cgroup の有効化

Docker を利用すべく、 cgroup を有効化します。

```
$ sudo nano /boot/cmdline.txt

cgroup_enable=cpuset cgroup_enable=memory cgroup_memory=1
```

`nano` or `vi` が入ってたのですが、 `vim` 使いたい場合は[こちら](https://kenzo0107.github.io/2022/05/08/2022-05-09-install_vim_on_raspberrypi_os/) 参考

cgroup への理解は以下参考になりました。

{% linkPreview https://valinux.hatenablog.com/entry/20210114 %}

## swap 無効化

```console
$ sudo swapoff --all
$ sudo systemctl stop dphys-swapfile
$ sudo systemctl disable dphys-swapfile
```

swap を無効化する理由は公式ドキュメントで言及されています。

https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/_print/#始める前に

> Swap がオフであること。kubelet が正常に動作するためには swap は必ずオフでなければなりません。

## IP 固定

ルーターで IP 固定しておくと再起動時に変更なく楽です。

ルーターでなく、 Raspberry PI 側で `/etc/dhcpcd.conf` を編集し固定する方法は以下参考になります。
[Raspberry Pi の IP アドレスを固定にするには？](https://www.fabshop.jp/raspberry-pi-static-ip/)

ここで一旦 reboot し諸々を反映しておきます。

```console
$ sudo reboot
```

## Docker インストール

[CRI のインストール](https://kubernetes.io/ja/docs/setup/production-environment/container-runtimes/) を参考にインストールしました。

```console
// パッケージのリポジトリ情報更新時に必要な公開鍵を取得。ないと GPG error が発生
$ curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

// armhf debian 用の docker 安定版のリポジトリを登録
$ echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list

// リポジトリ更新
$ sudo apt-get update

// docker インストール
$ sudo apt-get -y install docker-ce docker-ce-cli containerd.io
$ sudo systemctl enable docker

// pi ユーザを docker グループに追加し docker を操作できる様にする
$ sudo usermod pi -aG docker
```

### Cgroup Driver が systemd を使用するように設定されていることを確認

```console
$ sudo docker info | grep Cgroup

 Cgroup Driver: systemd
 Cgroup Version: 2
```

以下[公式](https://kubernetes.io/ja/docs/setup/production-environment/container-runtimes/#cgroup%E3%83%89%E3%83%A9%E3%82%A4%E3%83%90%E3%83%BC)で systemd を使用を推奨しています。

> コンテナランタイムと kubelet が cgroup ドライバーとして systemd を使用するように設定を変更することでシステムは安定します。 以下の Docker 設定の native.cgroupdriver=systemd オプションに注意してください。

## kubeadm インストール

[公式](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/install-kubeadm/)に沿って以下実行していきます。

### iptables がブリッジを通過するトラフィックを処理できるようにする

[公式ドキュメント参考](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#iptables%E3%81%8C%E3%83%96%E3%83%AA%E3%83%83%E3%82%B8%E3%82%92%E9%80%9A%E9%81%8E%E3%81%99%E3%82%8B%E3%83%88%E3%83%A9%E3%83%95%E3%82%A3%E3%83%83%E3%82%AF%E3%82%92%E5%87%A6%E7%90%86%E3%81%A7%E3%81%8D%E3%82%8B%E3%82%88%E3%81%86%E3%81%AB%E3%81%99%E3%82%8B)

`br_netfilter` がロードされているか確認する

```console
$ lsmod | grep br_netfilter

br_netfilter           32768  0
bridge                180224  1 br_netfilter
ipv6                  520192  28 br_netfilter,bridge
```

何も表示されない場合、 `br_netfilter` がロードされていない為、以下実行し明示的にロードしておきます。

```console
$ modprobe br_netfilter
```

```console
$ cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
$ sudo sysctl --system
```

### iptables が nftables バックエンドを使用しないようにする

[公式](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#iptables%E3%81%8Cnftables%E3%83%90%E3%83%83%E3%82%AF%E3%82%A8%E3%83%B3%E3%83%89%E3%82%92%E4%BD%BF%E7%94%A8%E3%81%97%E3%81%AA%E3%81%84%E3%82%88%E3%81%86%E3%81%AB%E3%81%99%E3%82%8B)

> nftables バックエンドは現在の kubeadm パッケージと互換性がありません。(ファイアウォールルールが重複し、kube-proxy を破壊するためです。)

公式の説明にある通り、 iptables が nftables を使うことで kubernetes が正常に動作しないことがある為、 iptables をレガシーバージョンに切り替えます。

```console
// レガシーバイナリがインストールされていることを確認してください
$ sudo apt-get install -y iptables arptables ebtables

// レガシーバージョンに切り替えてください。
$ sudo update-alternatives --set iptables /usr/sbin/iptables-legacy
$ sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy
$ sudo update-alternatives --set arptables /usr/sbin/arptables-legacy
$ sudo update-alternatives --set ebtables /usr/sbin/ebtables-legacy
```

参考: [nftables 入門](https://knowledge.sakura.ad.jp/22636/)

### kubeadm、kubelet、kubectl のインストール

いよいよ kubeadm インストールです。

[公式](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#kubeadm-kubelet-kubectl%E3%81%AE%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)

2022/04/30 時点の最新バージョン 1.23.6 では kubelet が起動失敗するエラーが発生した為、
バージョンは 1.22 系を選択します。

```console
$ sudo apt-get update && sudo apt-get install -y apt-transport-https curl
$ curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
$ cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF
$ sudo apt-get update

// 1.22 系をインストール
$ sudo apt-get install -y kubelet=1.22.7-00 kubeadm=1.22.7-00 kubectl=1.22.7-00

// バージョン固定
$ sudo apt-mark hold kubelet kubeadm kubectl
```

## Kubernetes クラスター構築

[公式](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/)

```console
// flannel をクラスター初期化処理を実装すべく 10.244.0.0/16 を指定している
// see: https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
$ sudo kubeadm init --pod-network-cidr=10.244.0.0/16

...
// 最後の1行をコピーしておく
kubeadm join <master node ip>:6443 --token yyyy \
        --discovery-token-ca-cert-hash sha256:xxxxxxxx

// 上記作成時に出力されるクラスター開始時の設定
$ mkdir -p $HOME/.kube
$ sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
$ sudo chown $(id -u):$(id -g) $HOME/.kube/config

// flannel 構築
$ kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

// 起動してく様子がわかる♪
$ kubectl get pod --all-namespaces

NAMESPACE     NAME                               READY   STATUS     RESTARTS   AGE
kube-system   coredns-78fcd69978-sv52p           0/1     Pending    0          111s
kube-system   coredns-78fcd69978-t5glm           0/1     Pending    0          111s
kube-system   etcd-pikube01                      1/1     Running    0          2m
kube-system   kube-apiserver-pikube01            1/1     Running    0          2m4s
kube-system   kube-controller-manager-pikube01   1/1     Running    0          2m
kube-system   kube-flannel-ds-w2bqt              0/1     Init:0/2   0          9s
kube-system   kube-proxy-kpm8w                   1/1     Running    0          111s
kube-system   kube-scheduler-pikube01            1/1     Running    0          2m
```

[flannel](https://github.com/flannel-io/flannel#readme) はコンテナの相互疎通等ネットワーク構築に有用で k8s との相性がよいです。

## worker ノード登録

master node でクラスター作成時に出力されたコマンドを実行します。
以下 worker node で実施します。

```console
$ sudo kubeadm join <master node ip>:6443 --token xxx \
        --discovery-token-ca-cert-hash sha256:yyy

...
This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
```

token は期限付きなのでご注意ください。

token の期限は master node で確認できます。

```console
master$ kubeadm token list

TOKEN                     TTL         EXPIRES                USAGES                   DESCRIPTION                                                EXTRA GROUPS
xxx   23h         2022-04-28T13:12:39Z   authentication,signing   <none>                                                     system:bootstrappers:kubeadm:default-node-token
```

### token の期限が切れたら

master node で再発行してください。
トークンを再発行し、且つ、worker node で `kubeadm join` する為のコマンドを出力してくれます。

```console
master$ kubeadm token create --print-join-command
```

### クラスタで worker node が登録されてるか確認する

```console
master$ kubectl get nodes

NAME       STATUS     ROLES                  AGE   VERSION
pikube01   Ready      control-plane,master   32h   v1.22.7
pikube02   Ready      <none>                 32m   v1.22.7
pikube03   NotReady   <none>                 18s   v1.22.7
```

### label 付けする

```console
master$ kubectl label node pikube02  node-role.kubernetes.io/worker=
master$ kubectl label node pikube03  node-role.kubernetes.io/worker=
```

再度 node 一覧を表示すると ROLES にラベル付けされているのが確認できます。

```console
$ kubectl get nodes

NAME       STATUS   ROLES                  AGE    VERSION
pikube01   Ready    control-plane,master   32h    v1.22.7
pikube02   Ready    worker                 39m    v1.22.7
pikube03   Ready    worker                 7m8s   v1.22.7
```

## ローカルのマシンで kubectl で操作できる様にする

```console
// 出力結果をコピーする
master$ kubectl config view --raw

macOS$ vi ~/.kube/config
// 上記コピーを貼り付け保存

macOS$ kubectl get nodes
```

## Metal LB インストール

参考:

- [【手順あり】MetalLB の使い方から動きまで解説します](https://blog.framinal.life/entry/2020/04/16/022042)
- [MetalLB > Installation](https://metallb.universe.tf/installation/)
- [Step by Step slow guide — Kubernetes Cluster on Raspberry Pi 4B — Part 3](https://levelup.gitconnected.com/step-by-step-slow-guide-kubernetes-cluster-on-raspberry-pi-4b-part-3-899fc270600e)

```console
// 全インターフェースで IPv4 パケットの転送が有効化する
$ sudo sysctl net.ipv4.conf.all.forwarding=1
$ sudo iptables -P FORWARD ACCEPT
```

[MetalLB > Installation](https://metallb.universe.tf/installation/) にある設定通りに進めます。

```console
$ kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.12.1/manifests/namespace.yaml
$ kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.12.1/manifests/metallb.yaml

// metallb 関連の pod の起動確認
$ kubectl get -n metallb-system pods

NAME                          READY   STATUS    RESTARTS   AGE
controller-66445f859d-qg8cz   1/1     Running   0          30s
speaker-bzzzc                 1/1     Running   0          30s
speaker-vbhdf                 1/1     Running   0          30s
speaker-vslj8                 1/1     Running   0          30s
```

addresses: `192.168.11.200-192.168.11.220` は DHCP で取得可能なレンジを指定します。

```console
// metallb を layer2 モードで起動
$ cat <EOF> metallb-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  namespace: metallb-system
  name: config
data:
  config: |
    address-pools:
      - name: default
        protocol: layer2
        addresses:
          - 192.168.11.200-192.168.11.220
EOF

$ kubectl apply -f metallb-config.yaml
```

nginx を `type: LoadBalancer` でデプロイし、 metallb が IP を割り当てていることを確認します。

```console
$ cat <EOF> nginx.deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 1
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
    - port: 80
      targetPort: 80
  type: LoadBalancer
EOF

$ kubectl apply -f nginx.deployment.yml
```

割り当てられた IP が `192.168.11.200` となっており、外部からアクセスできることを確認します。

```console
$ kubectl get svc

NAME            TYPE           CLUSTER-IP     EXTERNAL-IP      PORT(S)        AGE
kubernetes      ClusterIP      10.96.0.1      <none>           443/TCP        148m
nginx-service   LoadBalancer   10.109.50.62   192.168.11.200   80:31270/TCP   57m
```

```console
$ curl 192.168.11.200

// Welcome to nginx! が表示される
```

### Raspberry PI 以外のマシンからアクセスできない場合

自身の環境で
Raspberry PI の設定をしている MacOS から `EXTERNAL-IP` に nginx 起動直後はアクセスできましたが、
数分後、アクセスできなくなる事象が発生しました。

以下参考に解決しました。

参考: [LoadBalancer using Metallb on bare metal RPI cluster not working after installation](https://stackoverflow.com/questions/60796696/loadbalancer-using-metallb-on-bare-metal-rpi-cluster-not-working-after-installat)

MetalLB layer2 モードは、プロミスキャスモードが有効でない限り、ブロードキャストパケットを受信しません。
そのため、以下ブロードキャストパケットを受信できる様にすることで
macOS --> metalLB の疎通が確認できました。

```console
$ sudo ifconfig wlan0 promisc
```

promisc: "promiscuous" で「見境のない」という意味で全ての通信を読み込むモードにする、という意味です。

サーバ再起動で消えてしまう設定なので crontab に設定しておくと良い。

```console
$ sudo crontab -e

// 以下最終行に追記
@reboot sudo ifconfig wlan0 promisc
```

## 総評

ハマりポイントは以下でした。

- kubeadm, kubelet が最新 1.23 系で動作せず
  - マイナーバージョン単位でダウングレードし対応
- MetalLB の吐き出す External IP に接続できなかった
  - プロミスキャスモードを有効化することで対応

今後は以下に焦点を当てつつ、実際にサービスを作っていきます ♪

- CI/CD
- 監視

以上
参考になれば幸いです。

## 参考

https://qiita.com/reireias/items/0d87de18f43f27a8ed9b
