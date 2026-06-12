---
layout: post
title: 'Sakura VPS iptables Configuration ~ The day a warning arrived "We have detected traffic from your server that appears to be a UDP Flood DoS directed at external hosts." ~'
date: 2015-06-24
lang: en
translation_id: sakua-vps-iptables
permalink: en/2015/06/24/sakua-vps-iptables/
cover: /img/cover/2015-06-24-sakua-vps-iptables.svg
---

# iptables (FireWall) Setting

I received the following warning from Sakura's rental server service.

```
ご利用中のサーバから、外部へ向けてUDP FloodによるDoSと思わしきトラフィックを確認いたしました。

また、お客様のサーバを含めた複数のサーバにおいて同時に同じトラフィック波形のパケットを多数送信している事から、同じBot Netに属していると推測いたします。

お心当たりがない場合、サーバを第三者に不正利用されている可能性がございます。


現在、被害拡大防止の為の緊急措置として、当該サーバに対し通信停止措置を実施しております。予め、ご了承下さいますよう、お願いいたします。
```

To summarize:

* It looks like the server is being used as a stepping stone to attack external hosts, so unless I take countermeasures, they will shut it down.

That was the gist of it.

As a countermeasure, I reinstalled the OS and then configured iptables as follows.


---

## Configuration Steps

Run the following with root privileges.

```
su -
```


#### Allow established connections

```
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
```


#### Allow the local loopback address

```
iptables -A INPUT -i lo -j ACCEPT
```

#### Allow ICMP

```
iptables -A INPUT -p icmp -j ACCEPT
```


#### Deny private IP addresses

```
iptables -A INPUT -s 10.0.0.0/8 -j DROP
iptables -A INPUT -d 10.0.0.0/8 -j DROP
iptables -A INPUT -s 172.16.0.0/12 -j DROP
iptables -A INPUT -d 172.16.0.0/12 -j DROP
iptables -A INPUT -s 192.168.0.0/16 -j DROP
iptables -A INPUT -d 192.168.0.0/16 -j DROP
```

#### Deny broadcast addresses

```
iptables -A INPUT -d 0.0.0.0/8 -j DROP
iptables -A INPUT -d 255.255.255.255 -j DROP
```

#### Protect against fragment packet attacks

```
iptables -A INPUT -f -j DROP
```

#### Block stealth scans

```
iptables -A INPUT -p tcp -m state --state NEW ! --syn -j DROP
```

#### Protect against IDENT port probes

```
iptables -A INPUT -p tcp --dport 113 -j REJECT --reject-with tcp-reset
```

#### Protect against PING Flood

```
iptables -A INPUT -p icmp --icmp-type echo-request -m hashlimit --hashlimit 1/s --hashlimit-burst 5 --hashlimit-mode srcip --hashlimit-name input_icmp  --hashlimit-htable-expire 300000 -j DROP
```


## Allow the following common ports

* If you don't need them, you don't have to configure them.
* If you have changed the port, allow that port instead.

#### Allow SSH port (22)

```
iptables -A INPUT -p tcp -m tcp --dport 22 -j ACCEPT
```

#### Allow HTTP port (80)

```
iptables -A INPUT -p tcp -m tcp --dport 80 -j ACCEPT
```

### Set the default policy

```
iptables -P INPUT   DROP
iptables -P OUTPUT  ACCEPT
iptables -P FORWARD DROP
```

## Verify the configuration

```
iptables -L --line-numbers -n
```

## Save and apply the configuration

```
service iptables save
service iptables restart
```

## Summary

Since applying these settings, I haven't run into any particular problems.

A friend's Sakura VPS was hit by the same kind of attack, and when I shared these settings, the attacks stopped for them too.

So I believe they have a certain amount of effect.


##Command summary


```
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -p icmp -j ACCEPT
iptables -A INPUT -s 10.0.0.0/8 -j DROP
iptables -A INPUT -d 10.0.0.0/8 -j DROP
iptables -A INPUT -s 172.16.0.0/12 -j DROP
iptables -A INPUT -d 172.16.0.0/12 -j DROP
iptables -A INPUT -s 192.168.0.0/16 -j DROP
iptables -A INPUT -d 192.168.0.0/16 -j DROP
iptables -A INPUT -d 0.0.0.0/8 -j DROP
iptables -A INPUT -d 255.255.255.255 -j DROP
iptables -A INPUT -f -j DROP
iptables -A INPUT -p tcp -m state --state NEW ! --syn -j DROP
iptables -A INPUT -p tcp --dport 113 -j REJECT --reject-with tcp-reset
iptables -A INPUT -p icmp --icmp-type echo-request -m hashlimit --hashlimit 1/s --hashlimit-burst 5 --hashlimit-mode srcip --hashlimit-name input_icmp  --hashlimit-htable-expire 300000 -j DROP
```

```
iptables -A INPUT -p tcp -m tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp -m tcp --dport 80 -j ACCEPT

iptables -P INPUT   DROP
iptables -P OUTPUT  ACCEPT
iptables -P FORWARD DROP
```

```
service iptables save
service iptables restart
```
