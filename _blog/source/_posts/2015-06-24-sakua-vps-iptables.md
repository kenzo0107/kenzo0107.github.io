---
layout: post
title: さくらVPS iptables設定 ~ある日警告文が届いた「ご利用中のサーバから、外部へ向けてUDP FloodによるDoSと思わしきトラフィックを確認いたしました。」~
date: 2015-06-24
---

# iptables (FireWall) Setting

さくらレンタルサーバから以下のような警告文が届きました。

```
ご利用中のサーバから、外部へ向けてUDP FloodによるDoSと思わしきトラフィックを確認いたしました。

また、お客様のサーバを含めた複数のサーバにおいて同時に同じトラフィック波形のパケットを多数送信している事から、同じBot Netに属していると推測いたします。

お心当たりがない場合、サーバを第三者に不正利用されている可能性がございます。


現在、被害拡大防止の為の緊急措置として、当該サーバに対し通信停止措置を実施しております。予め、ご了承下さいますよう、お願いいたします。
```

要約すると

* サーバを踏み台にして外部に攻撃しているみたい、だから対策しないと止めるよ？

とのこと。

対策としてOS再インストールした後、以下iptablesの設定をしました。


---

## 設定手順

以下root権限で実行

```
su -
```


#### 接続済み通信許可

```
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
```


#### ローカルループバックアドレス許可

```
iptables -A INPUT -i lo -j ACCEPT
```

#### ICMP許可

```
iptables -A INPUT -p icmp -j ACCEPT
```


#### プライベートIPアドレス拒否

```
iptables -A INPUT -s 10.0.0.0/8 -j DROP
iptables -A INPUT -d 10.0.0.0/8 -j DROP
iptables -A INPUT -s 172.16.0.0/12 -j DROP
iptables -A INPUT -d 172.16.0.0/12 -j DROP
iptables -A INPUT -s 192.168.0.0/16 -j DROP
iptables -A INPUT -d 192.168.0.0/16 -j DROP
```

#### ブロードキャストアドレス拒否

```
iptables -A INPUT -d 0.0.0.0/8 -j DROP
iptables -A INPUT -d 255.255.255.255 -j DROP
```

#### フラグメントパケット攻撃対策

```
iptables -A INPUT -f -j DROP
```

#### ステルススキャン禁止

```
iptables -A INPUT -p tcp -m state --state NEW ! --syn -j DROP
```

#### IDENT port probe対策

```
iptables -A INPUT -p tcp --dport 113 -j REJECT --reject-with tcp-reset
```

#### PING Flood 対策

```
iptables -A INPUT -p icmp --icmp-type echo-request -m hashlimit --hashlimit 1/s --hashlimit-burst 5 --hashlimit-mode srcip --hashlimit-name input_icmp  --hashlimit-htable-expire 300000 -j DROP
```


## 以下一般的なポート許可

* 不要な場合は設定しないで良いです。
* ポートを変えている場合はそのポートで許可してください。

#### SSH  ポート許可 (22)

```
iptables -A INPUT -p tcp -m tcp --dport 22 -j ACCEPT
```

#### HTTP ポート許可 (80)

```
iptables -A INPUT -p tcp -m tcp --dport 80 -j ACCEPT
```

### デフォルトポリシーの設定

```
iptables -P INPUT   DROP
iptables -P OUTPUT  ACCEPT
iptables -P FORWARD DROP
```

## 設定確認

```
iptables -L --line-numbers -n
```

## 設定保存 反映

```
service iptables save
service iptables restart
```

## まとめ

現状この設定をしてからは特に被害にはあっていないです。

友人のさくらVPSでも同様の攻撃を受けたので教えてあげたら被害はなくなったとのことで

一定の効果はあるかと存じます。


##コマンドまとめ


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
