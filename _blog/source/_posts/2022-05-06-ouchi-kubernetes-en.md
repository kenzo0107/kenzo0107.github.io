---
title: Building a Home Kubernetes Cluster
date: 2022-05-06
lang: en
translation_id: ouchi-kubernetes
permalink: en/2022/05/06/ouchi-kubernetes/
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

I built a Kubernetes cluster on Raspberry Pi.

![](https://i.imgur.com/RgpOXr3.jpg)

Thanks to my company's "tech support program," the Raspberry Pi became an eligible item, and I was able to spend money on it without reservation.
Riding on that good fortune, I took on the challenge of finally raising a k8s cluster at home—an experience that is the very pinnacle of engineering joy.

Normally I work with Fargate on AWS in most cases, so there are no occasions to use Kubernetes. I was curious about it and wanted to broaden my learning.

## Goals

The goal is to install an OS on a bare-metal environment like the Raspberry Pi, build the Kubernetes-related packages, and understand the overall flow required for the setup.

I'll go through the following:

1. Installing the Raspberry Pi OS
2. Building the Kubernetes cluster
3. Setting up MetalLB

There were a lot of things to learn and plenty of pitfalls, so I'd like to write them down below.

## List of items I purchased

In late April 2022, the Raspberry Pi was more commonly sold as part of a starter kit rather than as a standalone unit.
A starter kit is somewhat more expensive than the standalone unit, but for that part I made full use of the support program from my [company](https://medpeer.co.jp/recruit/) ♪

{% affiliate "Raspberry PI 4B 4GB スターターキット" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B07YLY143F&Format=_SL160_&ID=AsinImage&MarketPlace=JP&ServiceVersion=20070822&WS=1&tag=kenzo0107-22&language=ja_JP" "https://www.amazon.co.jp/CanaKit-Raspberry-%E3%82%B9%E3%82%BF%E3%83%BC%E3%82%BF%E3%83%BC%E3%82%AD%E3%83%83%E3%83%88-%E3%82%AF%E3%83%AA%E3%82%A2%E3%82%B1%E3%83%BC%E3%82%B9%E4%BB%98%E3%81%8D-PI4-STR32EWF-C4-CLR/dp/B07YLY143F?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&crid=1O7RHSIN45Y49&keywords=Pi4+B+4GB+%E3%82%B9%E3%82%BF%E3%83%BC%E3%82%BF%E3%83%BC+%E3%82%AD%E3%83%83%E3%83%88+7%E7%82%B9%E3%82%BB%E3%83%83%E3%83%88+V4+%E3%82%AA%E3%83%B3%E3%83%A9%E3%82%A4%E3%83%B3%E6%95%99%E6%9D%90&qid=1651933444&sprefix=raspberry+pi+4b+%E3%82%B9%E3%82%BF%E3%83%BC%E3%82%BF%E3%83%BC%E3%82%AD%E3%83%83%E3%83%88%2Caps%2C476&sr=8-27&linkCode=li2&tag=kenzo0107-22&linkId=f8b93f80255639d3b5cc614c2ec24ce2&language=ja_JP&ref_=as_li_ss_il" "https://hb.afl.rakuten.co.jp/ichiba/23166659.8ed3e37c.2316665a.b61e268d/_RTLink33687?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fmcpjapan%2Fv_35027214434455%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

{% affiliate "LAN ケーブル CAT6 フラット ホワイト 5本 0.15m" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B08143HR4H&Format=_SL160_&ID=AsinImage&MarketPlace=JP&ServiceVersion=20070822&WS=1&tag=kenzo0107-22&language=ja_JP" "https://www.amazon.co.jp/gp/product/B08143HR4H?ie=UTF8&psc=1&linkCode=li2&tag=kenzo0107-22&linkId=c770488d0f88935f656f83a671841bca&language=ja_JP&ref_=as_li_ss_il" "https://hb.afl.rakuten.co.jp/ichiba/2760f4f3.6a3c6189.2760f4f4.89ee5ab7/_RTLink33687?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fshop-gimigimi%2F4946718646184%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

{% affiliate "エレコム スイッチングハブ ギガビット 5ポート" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B017SFTMFS&Format=_SL160_&ID=AsinImage&MarketPlace=JP&ServiceVersion=20070822&WS=1&tag=kenzo0107-22&language=ja_JP" "https://www.amazon.co.jp/gp/product/B017SFTMFS?ie=UTF8&psc=1&linkCode=li2&tag=kenzo0107-22&linkId=17398f672442f8b5d32953da671abce1&language=ja_JP&ref_=as_li_ss_il" "https://hb.afl.rakuten.co.jp/ichiba/2760f8ce.30eb2ea8.2760f8cf.f9e60d37/_RTLink33687?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fthinkrich%2Fzzr00464%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

{% affiliate "GeeekPi Raspberry Pi4クラスターケース冷却ファンとRaspberryPi4ヒートシンク付きRaspberryPi4ケースアクリルケース" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B07TJZ2HDG&Format=_SL160_&ID=AsinImage&MarketPlace=JP&ServiceVersion=20070822&WS=1&tag=kenzo0107-22&language=ja_JP" "https://www.amazon.co.jp/gp/product/B07TJZ2HDG?ie=UTF8&psc=1&linkCode=li2&tag=kenzo0107-22&linkId=ffd6f2b502cb234e395ba1195bdb821c&language=ja_JP&ref_=as_li_ss_il" "https://hb.afl.rakuten.co.jp/ichiba/2760fa3a.b36cda69.2760fa3b.5565ad0e/_RTLink33687?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Falmeria%2F39044535755%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

## Writing the OS with Raspberry Pi Imager

![](https://i.imgur.com/Ibrwfyu.png)

I selected Raspberry Pi OS Lite (32-bit) Bullseye, which was the latest as of 2022-04-26.
This time a GUI was not needed for the requirements, and I wanted to use as lightweight an image as possible.

![](https://i.imgur.com/Crtub61.png)

Configuring the hostname and Wi-Fi settings here makes things easier later.

Write the image to the SD card, insert it into the Raspberry Pi, and boot it up.

## Enabling cgroups

To use Docker, enable cgroups.

```
$ sudo nano /boot/cmdline.txt

cgroup_enable=cpuset cgroup_enable=memory cgroup_memory=1
```

`nano` and `vi` were already installed, but if you want to use `vim`, see [this article](https://kenzo0107.github.io/2022/05/08/2022-05-09-install_vim_on_raspberrypi_os/).

The following was helpful for understanding cgroups.

{% linkPreview https://valinux.hatenablog.com/entry/20210114 %}

## Disabling swap

```console
$ sudo swapoff --all
$ sudo systemctl stop dphys-swapfile
$ sudo systemctl disable dphys-swapfile
```

The reason for disabling swap is mentioned in the official documentation.

https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/_print/#始める前に

> Swap must be off. For the kubelet to work properly, swap must always be disabled.

## Fixing the IP address

Reserving a fixed IP on the router makes things easier, since it won't change on reboot.

For the approach of fixing the IP on the Raspberry Pi side by editing `/etc/dhcpcd.conf` instead of on the router, the following is helpful.
[How to assign a static IP address to a Raspberry Pi](https://www.fabshop.jp/raspberry-pi-static-ip/)

Reboot once here to apply everything.

```console
$ sudo reboot
```

## Installing Docker

I installed it following [Installing a CRI](https://kubernetes.io/ja/docs/setup/production-environment/container-runtimes/).

```console
// Fetch the public key needed when updating the package repository information. Without it, a GPG error occurs.
$ curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

// Register the stable Docker repository for armhf debian
$ echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list

// Update the repository
$ sudo apt-get update

// Install Docker
$ sudo apt-get -y install docker-ce docker-ce-cli containerd.io
$ sudo systemctl enable docker

// Add the pi user to the docker group so it can operate docker
$ sudo usermod pi -aG docker
```

### Confirming that the Cgroup Driver is set to use systemd

```console
$ sudo docker info | grep Cgroup

 Cgroup Driver: systemd
 Cgroup Version: 2
```

The [official docs](https://kubernetes.io/ja/docs/setup/production-environment/container-runtimes/#cgroup%E3%83%89%E3%83%A9%E3%82%A4%E3%83%90%E3%83%BC) recommend using systemd, as below.

> Changing the settings so that your container runtime and kubelet use systemd as the cgroup driver stabilized the system. Note the native.cgroupdriver=systemd option in the Docker configuration below.

## Installing kubeadm

I ran the following steps along with the [official docs](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/install-kubeadm/).

### Letting iptables see bridged traffic

[See the official documentation](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#iptables%E3%81%8C%E3%83%96%E3%83%AA%E3%83%83%E3%82%B8%E3%82%92%E9%80%9A%E9%81%8E%E3%81%99%E3%82%8B%E3%83%88%E3%83%A9%E3%83%95%E3%82%A3%E3%83%83%E3%82%AF%E3%82%92%E5%87%A6%E7%90%86%E3%81%A7%E3%81%8D%E3%82%8B%E3%82%88%E3%81%86%E3%81%AB%E3%81%99%E3%82%8B)

Check whether `br_netfilter` is loaded.

```console
$ lsmod | grep br_netfilter

br_netfilter           32768  0
bridge                180224  1 br_netfilter
ipv6                  520192  28 br_netfilter,bridge
```

If nothing is displayed, `br_netfilter` is not loaded, so run the following to load it explicitly.

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

### Ensuring iptables does not use the nftables backend

[Official docs](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#iptables%E3%81%8Cnftables%E3%83%90%E3%83%83%E3%82%AF%E3%82%A8%E3%83%B3%E3%83%89%E3%82%92%E4%BD%BF%E7%94%A8%E3%81%97%E3%81%AA%E3%81%84%E3%82%88%E3%81%86%E3%81%AB%E3%81%99%E3%82%8B)

> The nftables backend is not compatible with the current kubeadm packages (because it duplicates firewall rules and breaks kube-proxy).

As the official explanation says, because using nftables for iptables can prevent Kubernetes from working correctly, I switch iptables to the legacy version.

```console
// Make sure the legacy binaries are installed
$ sudo apt-get install -y iptables arptables ebtables

// Switch to the legacy versions.
$ sudo update-alternatives --set iptables /usr/sbin/iptables-legacy
$ sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy
$ sudo update-alternatives --set arptables /usr/sbin/arptables-legacy
$ sudo update-alternatives --set ebtables /usr/sbin/ebtables-legacy
```

Reference: [Introduction to nftables](https://knowledge.sakura.ad.jp/22636/)

### Installing kubeadm, kubelet, and kubectl

Finally, it's time to install kubeadm.

[Official docs](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#kubeadm-kubelet-kubectl%E3%81%AE%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)

With version 1.23.6, the latest as of 2022/04/30, I hit an error where the kubelet failed to start, so
I chose the 1.22 series for the version.

```console
$ sudo apt-get update && sudo apt-get install -y apt-transport-https curl
$ curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
$ cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF
$ sudo apt-get update

// Install the 1.22 series
$ sudo apt-get install -y kubelet=1.22.7-00 kubeadm=1.22.7-00 kubectl=1.22.7-00

// Pin the versions
$ sudo apt-mark hold kubelet kubeadm kubectl
```

## Building the Kubernetes cluster

[Official docs](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/)

```console
// Specify 10.244.0.0/16 in order to set up flannel during cluster initialization
// see: https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
$ sudo kubeadm init --pod-network-cidr=10.244.0.0/16

...
// Copy the last line
kubeadm join <master node ip>:6443 --token yyyy \
        --discovery-token-ca-cert-hash sha256:xxxxxxxx

// The cluster startup settings that are output during the above creation
$ mkdir -p $HOME/.kube
$ sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
$ sudo chown $(id -u):$(id -g) $HOME/.kube/config

// Set up flannel
$ kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

// You can watch it start up ♪
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

[flannel](https://github.com/flannel-io/flannel#readme) is useful for building networking such as inter-container connectivity, and it pairs well with k8s.

## Registering worker nodes

Run the command that was output when the cluster was created on the master node.
Run the following on the worker nodes.

```console
$ sudo kubeadm join <master node ip>:6443 --token xxx \
        --discovery-token-ca-cert-hash sha256:yyy

...
This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
```

Note that the token is time-limited.

You can check the token's expiration on the master node.

```console
master$ kubeadm token list

TOKEN                     TTL         EXPIRES                USAGES                   DESCRIPTION                                                EXTRA GROUPS
xxx   23h         2022-04-28T13:12:39Z   authentication,signing   <none>                                                     system:bootstrappers:kubeadm:default-node-token
```

### When the token has expired

Reissue it on the master node.
This reissues the token and also outputs the command for running `kubeadm join` on the worker nodes.

```console
master$ kubeadm token create --print-join-command
```

### Checking whether the worker nodes are registered in the cluster

```console
master$ kubectl get nodes

NAME       STATUS     ROLES                  AGE   VERSION
pikube01   Ready      control-plane,master   32h   v1.22.7
pikube02   Ready      <none>                 32m   v1.22.7
pikube03   NotReady   <none>                 18s   v1.22.7
```

### Adding labels

```console
master$ kubectl label node pikube02  node-role.kubernetes.io/worker=
master$ kubectl label node pikube03  node-role.kubernetes.io/worker=
```

Listing the nodes again, you can see that ROLES has been labeled.

```console
$ kubectl get nodes

NAME       STATUS   ROLES                  AGE    VERSION
pikube01   Ready    control-plane,master   32h    v1.22.7
pikube02   Ready    worker                 39m    v1.22.7
pikube03   Ready    worker                 7m8s   v1.22.7
```

## Operating the cluster with kubectl from a local machine

```console
// Copy the output
master$ kubectl config view --raw

macOS$ vi ~/.kube/config
// Paste the copied content above and save

macOS$ kubectl get nodes
```

## Installing MetalLB

References:

- [A step-by-step explanation of how to use MetalLB and how it works](https://blog.framinal.life/entry/2020/04/16/022042)
- [MetalLB > Installation](https://metallb.universe.tf/installation/)
- [Step by Step slow guide — Kubernetes Cluster on Raspberry Pi 4B — Part 3](https://levelup.gitconnected.com/step-by-step-slow-guide-kubernetes-cluster-on-raspberry-pi-4b-part-3-899fc270600e)

```console
// Enable IPv4 packet forwarding on all interfaces
$ sudo sysctl net.ipv4.conf.all.forwarding=1
$ sudo iptables -P FORWARD ACCEPT
```

Proceed according to the configuration in [MetalLB > Installation](https://metallb.universe.tf/installation/).

```console
$ kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.12.1/manifests/namespace.yaml
$ kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.12.1/manifests/metallb.yaml

// Confirm that the metallb-related pods are running
$ kubectl get -n metallb-system pods

NAME                          READY   STATUS    RESTARTS   AGE
controller-66445f859d-qg8cz   1/1     Running   0          30s
speaker-bzzzc                 1/1     Running   0          30s
speaker-vbhdf                 1/1     Running   0          30s
speaker-vslj8                 1/1     Running   0          30s
```

For addresses, `192.168.11.200-192.168.11.220` specifies a range that can be obtained via DHCP.

```console
// Start metallb in layer2 mode
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

Deploy nginx with `type: LoadBalancer` and confirm that metallb has assigned an IP.

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

Confirm that the assigned IP is `192.168.11.200` and that it can be accessed from the outside.

```console
$ kubectl get svc

NAME            TYPE           CLUSTER-IP     EXTERNAL-IP      PORT(S)        AGE
kubernetes      ClusterIP      10.96.0.1      <none>           443/TCP        148m
nginx-service   LoadBalancer   10.109.50.62   192.168.11.200   80:31270/TCP   57m
```

```console
$ curl 192.168.11.200

// "Welcome to nginx!" is displayed
```

### When you cannot access it from machines other than the Raspberry Pi

In my own environment,
I could access the `EXTERNAL-IP` from the macOS machine where I configured the Raspberry Pi right after nginx started,
but a few minutes later, I ran into an issue where it became inaccessible.

I solved it by referring to the following.

Reference: [LoadBalancer using Metallb on bare metal RPI cluster not working after installation](https://stackoverflow.com/questions/60796696/loadbalancer-using-metallb-on-bare-metal-rpi-cluster-not-working-after-installat)

MetalLB layer2 mode does not receive broadcast packets unless promiscuous mode is enabled.
Therefore, by enabling reception of broadcast packets as below,
I was able to confirm connectivity from macOS --> MetalLB.

```console
$ sudo ifconfig wlan0 promisc
```

promisc stands for "promiscuous," meaning "indiscriminate," i.e., putting the interface into a mode that reads all traffic.

Since this setting disappears on server reboot, it's a good idea to set it up in crontab.

```console
$ sudo crontab -e

// Add the following to the last line
@reboot sudo ifconfig wlan0 promisc
```

## Wrap-up

The pitfalls were as follows:

- kubeadm and kubelet didn't work on the latest 1.23 series
  - Resolved by downgrading by one minor version
- I couldn't connect to the External IP emitted by MetalLB
  - Resolved by enabling promiscuous mode

Going forward, I'll actually build services while focusing on the following ♪

- CI/CD
- Monitoring

That's all.
I hope this is helpful.

## References

https://qiita.com/reireias/items/0d87de18f43f27a8ed9b
