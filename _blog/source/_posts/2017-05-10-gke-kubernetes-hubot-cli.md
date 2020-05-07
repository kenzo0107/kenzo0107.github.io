---
layout: post
title: 無料枠で運用！ GKE + Kubernetes で Hubot 〜CLIから実行編〜
date: 2017-05-10
tags:
- GKE
thumbnail: http://i.imgur.com/Vvmetu1.png
---

## 概要
- 無料枠を使って Slack 連携する Hubot を GKE で構築します。
- おまけで JIRA 連携も

## Google Cloud SDK のインストール方法と初期化

[Mac OS X 用クイックスタート](https://cloud.google.com/sdk/docs/quickstart-mac-os-x) を参照して SDK をダウンロードします。

- Mac OS X (x86_64), (x86) かは以下コマンドで確認

```zsh
macOS%$ uname -m

x86_64
```

## kubectl のインストール

```zsh
macOS%$ gcloud components update kubectl
```

## gcloud デフォルト設定

以下は作成したプロジェクト、リージョン、ゾーンを設定してます。
今後 gcloud コマンド実行時に region 指定等しなくて良くなります。

- 作成したプロジェクトID : `hubot-167007`
- us-west 利用で無料枠を使う為に US リージョンに設定してます。

```
macOS%$ gcloud auth login
macOS%$ gcloud config set project hubot-167007
macOS%$ gcloud config set compute/region us-west1
macOS%$ gcloud config set compute/zone us-west1-b
```


[Google Cloud Platform の無料階層](https://cloud.google.com/free/) 参照してください。

## クラスタ作成

- 無料枠を利用するべく f1-micro で 30GB 設定
- でも作成時は 3 ノード必須
- 作成完了後、リサイズで 1 ノードに

```
macOS%$ gcloud container clusters create hubot-cluster-free \
      --machine-type f1-micro \
      --disk-size=30 \
      --num-nodes=3

Creating cluster hubot-cluster-free...done.
Created [https://container.googleapis.com/v1/projects/hubot-167007/zones/us-west1-b/clusters/hubot-cluster-free].
kubeconfig entry generated for hubot-cluster-free.
NAME                ZONE        MASTER_VERSION  MASTER_IP       MACHINE_TYPE  NODE_VERSION  NUM_NODES  STATUS
hubot-cluster-free  us-west1-b  1.5.7           35.xxx.xxx.xxx  f1-micro      1.5.7         3          RUNNING
```

- コンソールを見ると作成中であることが確認できます。

![Imgur](http://i.imgur.com/O3LQy9q.png)

- 以下コマンドで確認可

```
macOS% $ kubectl get nodes
NAME                                                STATUS    AGE       VERSION
gke-hubot-cluster-free-default-pool-a3b110d2-9k6s   Ready     59s       v1.5.7
gke-hubot-cluster-free-default-pool-a3b110d2-lqxg   Ready     1m        v1.5.7
gke-hubot-cluster-free-default-pool-a3b110d2-xqs8   Ready     1m        v1.5.7
```

- 1 ノードにリサイズ

```
macOS%$ gcloud container clusters resize hubot-cluster-free --size=1

Pool [default-pool] for [hubot-cluster-free] will be resized to 1.

Do you want to continue (Y/n)?  y

Resizing hubot-cluster-free...done.
Updated [https://container.googleapis.com/v1/projects/hubot-167007/zones/us-west1-b/clusters/hubot-cluster-free].
```

![Imgur](http://i.imgur.com/KTGg91y.png)

リサイズできるなら初めから 1 ノードで作らせて欲しい (>_<)

コンソール上だとやっぱりダメ (T_T)

![Imgur](http://i.imgur.com/TpNz2yj.png)

## 認証情報 取得

- コンテナクラスタの認証情報を取得し、kubectlを利用してコンテナ クラスタ上にコンテナを作成できるようになります。

```
macOS%$ gcloud container clusters get-credentials hubot-cluster-free

Fetching cluster endpoint and auth data.
kubeconfig entry generated for hubot-cluster-free.
```

- コンテナクラスタ情報表示

```
macOS%$ gcloud container clusters describe hubot-cluster-free
```

## ローカルの Docker 起動

[https://github.com/kenzo0107/hubot-slack-on-docker:embed:cite]


```
macOS%$ git clone https://github.com/kenzo0107/hubot-slack-on-docker
macOS%$ cd hubot-slack-on-docker
macOS%$ docker-compose up -d
```

```
macOS%$ docker ps

CONTAINER ID        IMAGE                      COMMAND                  CREATED             STATUS              PORTS                              NAMES
12f77feb09b4        hubotslackondocker_hubot   "/bin/sh -c 'bash ..."   24 minutes ago      Up 24 minutes       6379/tcp, 0.0.0.0:8080->8080/tcp   hubotslackondocker_hubot_1
```

## Hubot 動作確認

Slack上に Hubot が登場していて `hello` と呼びかけると `Hi` と返してくれたら成功です。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170510/20170510012328.png" width="100%">
</div>

## CONTAINER ID から イメージをcommit

```
macOS%$ docker commit 12f77feb09b4 gcr.io/hubot-167007/hubot:latest

macOS%$ docker images
REPOSITORY                       TAG                 IMAGE ID            CREATED             SIZE
gcr.io/hubot-167007/hubot        latest              2f7336b3a3ce        3 seconds ago       484 MB
```



## gke registory に push

参考: [Container Registry への push](https://cloud.google.com/container-registry/docs/pushing?hl=ja&_ga=1.49491107.421538973.1494071894)

```
macOS%$ gcloud docker -- push gcr.io/hubot-167007/hubot:latest

The push refers to a repository [gcr.io/hubot-167007/hubot]
0569b419082b: Pushed
a7637cfcdfba: Pushed
9f0bdbb7b1fa: Pushed
f1d85eafc75a: Pushed
c2c2b58591f2: Pushed
51c94eacef50: Pushed
69e7fcf7ba41: Pushed
293d09ca6a9d: Pushed
247e72dfcaf5: Pushed
8c2bc9bf1f19: Pushed
40907ce0d959: Pushed
bfba578a7fbe: Pushed
561cbcaac156: Pushed
293a1e72e88b: Pushed
ae09eb3da3dc: Pushed
c06c14d7f919: Pushed
e14577d2cac5: Layer already exists
e8829d5bbd2c: Layer already exists
674ce3c5d814: Layer already exists
308b39a73046: Layer already exists
638903ee8579: Layer already exists

latest: digest: sha256:0c3b29d18b64c1f8ecc1a1bf67462c84d5915a4a708fe87df714d09198eb5fa1 size: 4704
```

- latest が被ると過去のイメージのタグが奪われます。容量の無駄になるので削除しましょう。

![Imgur](http://i.imgur.com/YlADlds.png)

## Deployments 作成

```
macOS%$ kubectl run pod-hubot \
      --image=gcr.io/hubot-167007/hubot:latest \
      --env="HUBOT_SLACK_TOKEN=xoxb-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx" \
      --env="HUBOT_SLACK_TEAM=xxxxxx.slack.com" \
      --env="HUBOT_SLACK_BOTNAME=hubot" \
      --env="HUBOT_JIRA_URL=https://<jira_server_domain_or_ip>" \
      --port=8080 \
      --restart='Always'

deployment "pod-hubot" created
```

- deployments 状態確認

```
macOS%$ kubectl get deployments
NAME        DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
pod-hubot   1         1         1            0           10s
```

- Pod 状態確認

```
macOS%$ kubectl get pods

NAME                         READY     STATUS             RESTARTS   AGE
pod-hubot-1713414922-b2dkq   0/1       ImagePullBackOff   0          23s
```

- Pod にログイン

```
$ kubectl exec -it pod-hubot-1713414922-b2dkq /bin/bash
```

- service の状態確認

```
macOS%$ kubectl get service


NAME         CLUSTER-IP    EXTERNAL-IP   PORT(S)   AGE
kubernetes   10.23.240.1   <none>        443/TCP   22m
```

`EXTERNAL-IP: <none>` ... 外部へ開いているIPがない。という状態
Private IP は付与されたが Public IP がない、外部のネットワークからアクセスできない状態です。

## コンテナ公開

- Service にロードバランサ付与し公開

※ ロードバランサを追加すると課金の桁が跳ね上がります。。
（2000円/月くらい。念の為、設定した予算アラートでわかりました。）

```
macOS%$ kubectl expose deployment pod-hubot --type="LoadBalancer"
service "pod-hubot" exposed
```

- Service 確認

`EXTERNAL-IP: <pending>` となっており、作成途中であることがわかります。

```
macOS%$ kubectl get service

NAME         CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
kubernetes   10.23.240.1     <none>        443/TCP          25m
pod-hubot    10.23.244.214   <pending>     8080:30453/TCP   8s
```

- 再度 Service 確認

無事付与されているのがわかりました。

```
macOS%$ kubectl get service
NAME         CLUSTER-IP      EXTERNAL-IP     PORT(S)          AGE
kubernetes   10.23.240.1     <none>          443/TCP          27m
pod-hubot    10.23.244.214   104.xxx.x.xxx   8080:30453/TCP   1m
```

## テスト

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
http://104.xxx.x.xxx:8080/hubot/jira-comment-dm
```

![Imgur](http://i.imgur.com/8FOYcyI.png)


## 後始末

掃除しときたい場合に以下実行してください。

- service 削除

```
macOS%$ kubectl delete service pod-hubot
service "pod-hubot" deleted
```

- pod 削除

```
macOS%$ kubectl delete pod pod-hubot-729436916-htw3r
service "pod-hubot" deleted
```

- deployments 削除

```
macOS%$ kubectl delete deployments pod-hubot
```

- container clusters 削除
container cluster を削除すれば紐付く deployments, service, pod も削除されます。

```
macOS%$ gcloud container clusters delete hubot-cluster-free
```

以上です。

## 総評

GKEは概念が多く、一概に deployment, pod, service, kubernetes 等覚えることが多いですが
動かしつつ学ぶのは楽しいです。

ほぼ手元の Mac で設定できました！
手元で済むから `macOS%$` は不要だった。。

今回作成した service だと外部に 8080 ポート全開です。

[次回](http://kenzo0107.hatenablog.com/entry/2017/05/16/222815)はアクセス元を制限したポートアクセスやコンテナのアップデートについてまとめます。

[http://kenzo0107.hatenablog.com/entry/2017/05/16/222815:embed:cite]
