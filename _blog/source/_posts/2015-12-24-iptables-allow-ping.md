---
layout: post
title: pingを通すiptableの設定
date: 2015-12-24
tags:
- ping
- iptable
---

## 環境

- CentOS 5.8

## 実現したいこと

`Server A` が `Server B` からのみ ping を通す

```
+----------+  Ping Request   +----------+
|          | <-------------- |          |
| Server A |                 | Server B |
|          | --------------> |          |
+----------+  Ping Response  +----------+
```

## 特定IPからの ping を通す許可設定

以下設定を `Server A` で実施する。
```
[Server A]# iptables -A INPUT -p icmp --icmp-type 8 -s <Server B の IP Address> -j ACCEPT
[Server A]# iptables -A OUTPUT -p icmp --icmp-type 0 -s <Server B の IP Address> -j ACCEPT
[Server A]# service iptables restart
```
> - `--icmp-type 8` は `Echo request (エコー要求)` を許可
> - `--icmp-type 0` は `Echo Reply (エコー応答)` を許可

## Server Bから ping実行

```
[Server B]# ping <Server A の IP Address>

PING (<Server A の IP Address>): 56 data bytes
64 bytes from (<Server A の IP Address>): icmp_seq=0 ttl=58 time=4.411 ms
64 bytes from (<Server A の IP Address>): icmp_seq=1 ttl=58 time=4.079 ms
64 bytes from (<Server A の IP Address>): icmp_seq=2 ttl=58 time=4.027 ms
^C
--- (<Server A の IP Address>) ping statistics ---
3 packets transmitted, 3 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 4.027/4.172/4.411/0.170 ms
```


## icmp-type List

以下[asahi-net Appendix C. ICMPタイプ](http://www.asahi-net.or.jp/~aa4t-nngk/ipttut/output/icmptypes.html)より参照

| TYPE  | CODE | 意味                                                                                                   | 問合せ | エラー | 参照先        |
| ----- | ---- | ------------------------------------------------------------------------------------------------------ | ------ | ------ | ------------- |
| 0     | 0    | Echo Reply (エコー応答)                                                                                | x      |        | RFC792        |
| 3     | 0    | Network Unreachable (ネットワーク到達不能)                                                             |        | x      | RFC792        |
| 3     | 1    | Host Unreachable (ホスト到達不能)                                                                      |        | x      | RFC792        |
| 3     | 2    | Protocol Unreachable (プロトコル到達不能)                                                              |        | x      | RFC792        |
| 3     | 3    | Port Unreachable (ポート到達不能)                                                                      |        | x      | RFC792        |
| 3     | 4    | Fragmentation needed but no frag. bit set (フラグメント必要だがフラグメント禁止ビットあり)             |        | x      | RFC792        |
| 3     | 5    | Source routing failed (ソースルーティング失敗)                                                         |        | x      | RFC792        |
| 3     | 6    | Destination network unknown (宛先ネットワーク発見できず)                                               |        | x      | RFC792        |
| 3     | 7    | Destination host unknown (宛先ホスト発見できず)                                                        |        | x      | RFC792        |
| 3     | 8    | Source host isolated (送信元ホストへのルートなし) (廃)                                                 |        | x      | RFC792        |
| 3     | 9    | Destination network administratively prohibited (宛先ネットワークは設定によりアクセス禁止)             |        | x      | RFC792        |
| 3     | 10   | Destination host administratively prohibited (宛先ホストは設定によりアクセス禁止)                      |        | x      | RFC792        |
| 3     | 11   | Network unreachable for TOS (TOS種別によりネットワーク到達不能)                                        |        | x      | RFC792        |
| 3     | 12   | Host unreachable for TOS (TOS種別によりホスト到達不能)                                                 |        | x      | RFC792        |
| 3     | 13   | Communication administratively prohibited by filtering (フィルタリング設定により通信禁止)              |        | x      | RFC1812       |
| 3     | 14   | Host precedence violation (ホスト優先順位侵害)                                                         |        | x      | RFC1812       |
| 3     | 15   | Precedence cutoff in effect (優先順位により遮断発動)                                                   |        | x      | RFC1812       |
| 4     | 0    | Source quench (輻輳発生による発信抑制)                                                                 |        |        | RFC792        |
| 5     | 0    | Redirect for network (指定ネットワークへのリダイレクト要求)                                            |        |        | RFC792        |
| 5     | 1    | Redirect for host (指定ホストへのリダイレクト要求)                                                     |        |        |
| 5     | 2    | Redirect for TOS and network (TOSとネットワークのリダイレクト要求)                                     |        |        | RFC792        |
| 5     | 3    | Redirect for TOS and host (TOSとホストのリダイレクト要求)                                              |        |        | RFC792        |
| 8     | 0    | Echo request(エコー要求)                                                                               | x      |        | RFC792        |
| 9     | 0    | Router advertisement - Normal router advertisement (ルータ広告 - 通常通知)                             |        |        | RFC1256       |
| 9     | 16   | Router advertisement - Does not route common traffic (ルータ広告 - 通常トラフィックはルーティング不可) |        |        | RFC2002       |
| 10    | 0    | Route selection (ルート選択)                                                                           |        |        | RFC1256       |
| 11    | 0    | TTL equals 0 during transit (搬送中にTTLが0に)                                                         |        | x      | RFC792        |
| 11    | 1    | TTL equals 0 during reassembly (再構成時の欠損フラグメント待機中に時間超過)                            |        | x      | RFC792        |
| 12    | 0    | IP header bad (catchall error) (IPヘッダ異常) (あらゆるエラーに共通)                                   |        | x      | RFC792        |
| 12    | 1    | Required options missing (必要なオプションが欠如)                                                      |        | x      | RFC1108       |
| 12    | 2    | IP Header bad length (IPヘッダ長の異常)                                                                |        | x      | RFC792        |
| 13    | 0    | Timestamp request (obsolete) (タイムスタンプ要求) (廃)                                                 | x      |        | RFC792        |
| 14    |      | Timestamp reply (obsolete) (タイムスタンプ応答) (廃)                                                   | x      |        | RFC792        |
| 15    | 0    | Information request (obsolete) (情報要求) (廃)                                                         | x      |        | RFC792        |
| 16    | 0    | Information reply (obsolete) (情報応答) (廃)                                                           | x      |        | RFC792        |
| 17    | 0    | Address mask request (ネットマスク通知要求)                                                            | x      |        | RFC950        |
| 18    | 0    | Address mask reply (ネットマスク通知応答)                                                              | x      |        | RFC950        |
| 20-29 |      | Reserved for robustness experiment (信頼性試験のための予約域)                                          |        |        | Zaw-Sing Su   |
| 30    | 0    | Traceroute                                                                                             | x      |        | RFC1393       |
| 31    | 0    | Datagram Conversion Error (データグラム変換エラー)                                                     |        | x      | RFC1475       |
| 32    | 0    | Mobile Host Redirect (移動体ホストのリダイレクト)                                                      |        |        | David Johnson |
| 33    | 0    | IPv6 Where-Are-You (IPv6位置確認要求)                                                                  | x      |        | Bill Simpson  |
| 34    | 0    | IPv6 I-Am-Here (IPv6位置確認応答)                                                                      | x      |        | Bill Simpson  |
| 35    | 0    | Mobile Registration Request (移動体登録要求)                                                           | x      |        | Bill Simpson  |
| 36    | 0    | Mobile Registration Reply (移動体登録応答)                                                             | x      |        | Bill Simpson  |
| 39    | 0    | SKIP                                                                                                   |        |        | Tom Markson   |
| 40    | 0    | Photuris                                                                                               |        |        | RFC2521       |
