---
layout: post
title: "Running Hubot on GKE + Kubernetes Within the Free Tier — Running from the CLI"
date: 2017-05-10
lang: en
translation_id: gke-kubernetes-hubot-cli
permalink: en/2017/05/10/gke-kubernetes-hubot-cli/
tags:
  - GKE
cover: http://i.imgur.com/Vvmetu1.png
---

## Overview

- We'll build a Slack-integrated Hubot on GKE using the free tier.
- As a bonus, we'll also add JIRA integration.

## Installing and Initializing the Google Cloud SDK

Download the SDK by referring to the [Quickstart for macOS](https://cloud.google.com/sdk/docs/quickstart-mac-os-x).

- Check whether you're on Mac OS X (x86_64) or (x86) with the following command:

```zsh
macOS%$ uname -m

x86_64
```

## Installing kubectl

```zsh
macOS%$ gcloud components update kubectl
```

## gcloud Default Configuration

Below, we configure the project, region, and zone we created.
This means you won't have to specify the region and so on each time you run a gcloud command from now on.

- Created project ID: `hubot-167007`
- We set the region to a US region so we can use the free tier with us-west.

```
macOS%$ gcloud auth login
macOS%$ gcloud config set project hubot-167007
macOS%$ gcloud config set compute/region us-west1
macOS%$ gcloud config set compute/zone us-west1-b
```

Please refer to the [Google Cloud Platform Free Tier](https://cloud.google.com/free/).

## Creating the Cluster

- To use the free tier, we set f1-micro with 30GB.
- However, 3 nodes are required at creation time.
- After creation completes, we resize down to 1 node.

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

- Looking at the console, you can confirm that it's being created.

![Imgur](http://i.imgur.com/O3LQy9q.png)

- You can verify it with the following command:

```
macOS% $ kubectl get nodes
NAME                                                STATUS    AGE       VERSION
gke-hubot-cluster-free-default-pool-a3b110d2-9k6s   Ready     59s       v1.5.7
gke-hubot-cluster-free-default-pool-a3b110d2-lqxg   Ready     1m        v1.5.7
gke-hubot-cluster-free-default-pool-a3b110d2-xqs8   Ready     1m        v1.5.7
```

- Resize down to 1 node

```
macOS%$ gcloud container clusters resize hubot-cluster-free --size=1

Pool [default-pool] for [hubot-cluster-free] will be resized to 1.

Do you want to continue (Y/n)?  y

Resizing hubot-cluster-free...done.
Updated [https://container.googleapis.com/v1/projects/hubot-167007/zones/us-west1-b/clusters/hubot-cluster-free].
```

![Imgur](http://i.imgur.com/KTGg91y.png)

If we can resize it, I wish they'd just let us create it with 1 node from the start (>\_<)

Doing it from the console still doesn't work, after all (T_T)

![Imgur](http://i.imgur.com/TpNz2yj.png)

## Obtaining Credentials

- Obtain the container cluster's credentials so you can use kubectl to create containers on the container cluster.

```
macOS%$ gcloud container clusters get-credentials hubot-cluster-free

Fetching cluster endpoint and auth data.
kubeconfig entry generated for hubot-cluster-free.
```

- Display container cluster information

```
macOS%$ gcloud container clusters describe hubot-cluster-free
```

## Starting Docker Locally

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

## Verifying Hubot Works

If Hubot shows up in Slack and replies with `Hi` when you say `hello` to it, you've succeeded.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170510/20170510012328.png" width="100%">
</div>

## Committing an Image from the CONTAINER ID

```
macOS%$ docker commit 12f77feb09b4 gcr.io/hubot-167007/hubot:latest

macOS%$ docker images
REPOSITORY                       TAG                 IMAGE ID            CREATED             SIZE
gcr.io/hubot-167007/hubot        latest              2f7336b3a3ce        3 seconds ago       484 MB
```

## Pushing to the GKE Registry

Reference: [Pushing to Container Registry](https://cloud.google.com/container-registry/docs/pushing?hl=ja&_ga=1.49491107.421538973.1494071894)

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

- If the `latest` tag collides, the tag of the previous image gets taken away. It's a waste of storage, so delete it.

![Imgur](http://i.imgur.com/YlADlds.png)

## Creating the Deployment

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

- Check the deployments status

```
macOS%$ kubectl get deployments
NAME        DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
pod-hubot   1         1         1            0           10s
```

- Check the Pod status

```
macOS%$ kubectl get pods

NAME                         READY     STATUS             RESTARTS   AGE
pod-hubot-1713414922-b2dkq   0/1       ImagePullBackOff   0          23s
```

- Log in to the Pod

```
$ kubectl exec -it pod-hubot-1713414922-b2dkq /bin/bash
```

- Check the service status

```
macOS%$ kubectl get service


NAME         CLUSTER-IP    EXTERNAL-IP   PORT(S)   AGE
kubernetes   10.23.240.1   <none>        443/TCP   22m
```

`EXTERNAL-IP: <none>` ... this means there's no IP open to the outside.
A Private IP has been assigned, but there's no Public IP, so it can't be accessed from external networks.

## Exposing the Container

- Attach a load balancer to the Service to expose it.

* Note: adding a load balancer makes the billing jump by an order of magnitude.
(Around 2,000 yen/month. Just to be safe, I found out via the budget alert I had set up.)

```
macOS%$ kubectl expose deployment pod-hubot --type="LoadBalancer"
service "pod-hubot" exposed
```

- Check the Service

It shows `EXTERNAL-IP: <pending>`, which tells us it's still being created.

```
macOS%$ kubectl get service

NAME         CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
kubernetes   10.23.240.1     <none>        443/TCP          25m
pod-hubot    10.23.244.214   <pending>     8080:30453/TCP   8s
```

- Check the Service again

We can see it has been successfully assigned.

```
macOS%$ kubectl get service
NAME         CLUSTER-IP      EXTERNAL-IP     PORT(S)          AGE
kubernetes   10.23.240.1     <none>          443/TCP          27m
pod-hubot    10.23.244.214   104.xxx.x.xxx   8080:30453/TCP   1m
```

## Testing

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

## Cleanup

Run the following if you want to clean things up.

- Delete the service

```
macOS%$ kubectl delete service pod-hubot
service "pod-hubot" deleted
```

- Delete the pod

```
macOS%$ kubectl delete pod pod-hubot-729436916-htw3r
service "pod-hubot" deleted
```

- Delete the deployments

```
macOS%$ kubectl delete deployments pod-hubot
```

- Delete the container clusters
  If you delete the container cluster, the deployments, service, and pod associated with it are also deleted.

```
macOS%$ gcloud container clusters delete hubot-cluster-free
```

That's all.

## Overall Impressions

GKE has a lot of concepts, and there's plenty to learn all at once — deployment, pod, service, kubernetes, and so on — but it's fun to learn while actually running things.

I was able to set up almost everything on my Mac at hand!
Since it can all be done locally, `macOS%$` wasn't really necessary...

The service we created this time leaves port 8080 wide open to the outside.

[Next time](http://kenzo0107.hatenablog.com/entry/2017/05/16/222815), I'll cover restricting the source of access for port access and updating containers.

[http://kenzo0107.hatenablog.com/entry/2017/05/16/222815:embed:cite]
