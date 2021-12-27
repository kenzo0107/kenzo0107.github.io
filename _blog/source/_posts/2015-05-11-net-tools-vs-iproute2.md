---
layout: post
title: net-tools vs. iproute2 対応表
date: 2015-05-11
---

RHEL7/CentOS7ではnet-toolsを廃止予定としています。

ipコマンド推奨の理由は以下。

net-toolsでは、
- ネットワークトラフィック制御対応できない。
- ルーティングテーブルを複数保持するような複雑なルーティングを実現できない。
- ifconfigでは/procからの情報を出力しており、ipコマンドのnetlinkAPIを利用した方が数ミリsec速い。

http://linuxjm.osdn.jp/html/LDP_man-pages/man7/netlink.7.html

なので、徐々にipコマンドに慣れていきたい。


* net-tools vs. iproute2

|*net-tools |*iproute2 |
| ifconfig |	ip l (ip link) |
| ifconfig -a | ip a show (ip addr show) |
| ifconfig eth0 up | ip link set eth0 up |
| netstat |	ss |
| netstat -i | ip -s link |
| netstat -l	 | ss -l |
| netstat -r | ip r (ip route) |
| route [add or del] | ip route [add or del] |
| route -n | ip route show |
| arp -n | ip n (ip neighbor) |
