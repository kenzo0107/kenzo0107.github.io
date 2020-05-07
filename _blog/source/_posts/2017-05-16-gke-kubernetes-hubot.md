---
layout: post
title: 無料枠で運用！ GKE + Kubernetes で Hubot 〜独自ネットワーク作成、設定ファイルから起動編〜
date: 2017-05-16
tags:
- GKE
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170604/20170604224801.png
---

前回手元のMacからコンテナクラスタ → Deployment → LB 作成する手順をまとめました。

{% linkPreview http://kenzo0107.hatenablog.com/entry/2017/05/10/012945 _blank %}


但し、8080ポートがフルオープンとなってしまい、誰でもアクセスが可能であるという、
セキュリティ的に非常によろしくない状態でした。

その為、今回は以下実施します。

* 独自ネットワーク(ファイアウォール)作成
* 独自ネットワーク上にクラスタ作成
* 設定ファイルでコンテナ起動・更新

前回の独自ネットワーク設定していないクラスタは削除して問題ないです。お任せします `m(_ _)m`

## 前回同様の Git Repository 用意

```shell
$ git clone https://github.com/kenzo0107/hubot-slack-on-docker
$ cd hubot-slack-on-docker
```

## Network 作成

- `hubot-network` というネットワークを作成します。

```
macOS%$ gcloud compute networks create hubot-network
```

## ファイアウォール作成

- 作成したネットワークに特定 IP からのみ 8080 ポートアクセス許可

```
macOS%$ gcloud compute firewall-rules create hubot-rule --network hubot-network --allow tcp:8080 --source-ranges xxx.xxx.xxx.xxx,yyy.yyy.yyy.yyy.yyy
```

## Container Clusters 作成

- 作成したネットワーク指定しクラスタ作成

```
macOS%$ gcloud container clusters create hubot-cluster-free \
      --machine-type f1-micro \
      --disk-size=30 \
      --num-nodes=3 \
      --network=hubot-network \
      --cluster-ipv4-cidr=10.0.0.0/14
```

- <span style="color: #ff0000">cluster-ipv4-cidr オプション必須！</span>
指定しクラスタ内の Pod のIPアドレスの範囲指定しています。
※サブネットマスク(10.0.0.0/14 の "/14" 部分)指定は9〜19で指定する必要があります。

例) --cluster-ipv4-cidr=10.0.0.0/8 指定した場合のエラー

```
ERROR: (gcloud.container.clusters.create) ResponseError: code=400, message=cluster.cluster_ipv4_cidr CIDR block size must be no bigger than /9 and no smaller than /19, found /8.
```

## ノード数を 1 に変更

```
macOS%$ gcloud container clusters resize hubot-cluster-free --size=1
```

## Deployment 作成

```
macOS%$ kubectl create -f gke-deployment.yml
```

### Deployment, Replicaset, Pod 一覧表示

- ラベル付けした `app: hubot` を条件指定

```
macOS%$ kubectl get deployments,replicasets,pods --selector app=hubot
```

### フォーマットを yaml 形式で出力

```
macOS%$ kubectl get deployment deployment-hubot -o yaml
```

## サービス公開する為、LoadBalancer 付加

```
macOS%$ kubectl create -f gke-lb.yml
```

## サービス一覧表示

```
macOS%$ kubectl get svc
NAME           CLUSTER-IP     EXTERNAL-IP     PORT(S)          AGE
kubernetes     10.3.240.1     <none>          443/TCP          20m
loadbalancer   10.3.241.129   zz.zzz.zzz.zzz   8080:31628/TCP   4m
```

※EXTERNAL-IP : `zz.zzz.zzz.zzz` はグローバルIP


## いざ、テスト !

```
macOS%$ curl \
-X POST \
-H "Content-Type: application/json" \
-d \
'{
 "webhookEvent":"jira:issue_updated",
 "comment":{
   "author":{
     "name":"himuko"
    },
    "body":"[~kenzo.tanaka] 東京03 秋山 ケンコバ 劇団ひとり"
 },
 "issue": {
   "key":"key",
   "fields":{
     "summary":"summary"
    }
  }
}' \
http://zz.zzz.zzz.zzz:8080/hubot/jira-comment-dm
```

- できた！
[f:id:kenzo0107:20170516220548p:plain]


## 更新（ローリングアップデート）

ReplicationController を利用することで無停止で更新します。

実際に以下の様にして更新しているのが確認できます。

* 既存の Running 中のコンテナの個数分、更新したイメージからビルドしたコンテナを起動
* 更新版コンテナがRunning状態になったら既存コンテナを削除

```
// ローカルで更新した Docker Container を コミット
macOS%$ docker commit 12f77feb09b4 gcr.io/hubot-167007/hubot:latest
// Google Container Registory にプッシュ
macOS%$ gcloud docker -- push gcr.io/hubot-167007/hubot:latest

// Pod 表示
macOS%$ kubectl get pods
NAME                                                      READY     STATUS    RESTARTS   AGE
deployment-hubot-cfe7528ee0b5059b14a30b942597e5ef-z8nws   1/1       Running   1          1d

// push したImageを元にローリングアップデート
macOS%$ kubectl rolling-update deployment-hubot-cfe7528ee0b5059b14a30b942597e5ef-z8nws --image=gcr.io/hubot-167007/hubot:latest
```

## 後片付け

- Deployment 削除

```
macOS%$ kubectl delete -f gke-deployment.yml
```

- LoadBalancer 削除

```
macOS%$ kubectl delete -f gke-lb.yml
```

## 総評

ネットワークのファイアウォール設定してコンテナ起動したが動かなかった所、かなり詰まりました (; ~_~)
Stackoverflow にたまたま同様のイシューをあげている方がおり参考にさせて頂きました。
助かった汗

これから Nginx + Rails 等、よくありそうなケースで GKE + Kubernetes を試して運用してみたいと思います。
まとまったらまた追記します！

## 参考
[Unable to launch a GKE (Google Container Engine) cluster with a custom network](http://stackoverflow.com/questions/38057066/unable-to-launch-a-gke-google-container-engine-cluster-with-a-custom-network)
