---
layout: post
title: net-tools vs. iproute2 Cheat Sheet
date: 2015-05-11
lang: en
translation_id: net-tools-vs-iproute2
permalink: en/2015/05/11/net-tools-vs-iproute2/
cover: /img/cover/2015-05-11-net-tools-vs-iproute2.svg
---

RHEL7/CentOS7 plan to deprecate net-tools.

The reasons the ip command is recommended are as follows.

With net-tools:
- You can't handle network traffic control.
- You can't implement complex routing such as maintaining multiple routing tables.
- ifconfig outputs information from /proc, whereas the ip command uses the netlink API, which is a few milliseconds faster.

http://linuxjm.osdn.jp/html/LDP_man-pages/man7/netlink.7.html

So I'd like to gradually get used to the ip command.


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
