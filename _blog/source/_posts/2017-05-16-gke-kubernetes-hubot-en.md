---
layout: post
title: "Run Hubot for Free! GKE + Kubernetes - Creating a Custom Network and Launching from Config Files"
date: 2017-05-16
category: Infrastructure
lang: en
translation_id: gke-kubernetes-hubot
permalink: en/2017/05/16/gke-kubernetes-hubot/
tags:
  - GKE
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170604/20170604224801.png
---

Last time I walked through the steps for creating a container cluster → Deployment → LB from my local Mac.

{% linkPreview http://kenzo0107.hatenablog.com/entry/2017/05/10/012945 _blank %}

However, port 8080 ended up fully open, meaning anyone could access it — a very poor situation from a security standpoint.

So this time I'll do the following:

- Create a custom network (firewall)
- Create a cluster on the custom network
- Launch and update containers via config files

Feel free to delete the previous cluster that had no custom network configured — that's totally fine. I'll leave it up to you `m(_ _)m`

## Prepare the Same Git Repository as Last Time

```shell
$ git clone https://github.com/kenzo0107/hubot-slack-on-docker
$ cd hubot-slack-on-docker
```

## Create a Network

- Create a network named `hubot-network`.

```
macOS%$ gcloud compute networks create hubot-network
```

## Create a Firewall

- Allow access to port 8080 only from specific IPs on the created network

```
macOS%$ gcloud compute firewall-rules create hubot-rule --network hubot-network --allow tcp:8080 --source-ranges xxx.xxx.xxx.xxx,yyy.yyy.yyy.yyy.yyy
```

## Create Container Clusters

- Specify the created network and create the cluster

```
macOS%$ gcloud container clusters create hubot-cluster-free \
      --machine-type f1-micro \
      --disk-size=30 \
      --num-nodes=3 \
      --network=hubot-network \
      --cluster-ipv4-cidr=10.0.0.0/14
```

- <span style="color: #ff0000">The cluster-ipv4-cidr option is required!</span>
  Specifying it sets the IP address range for Pods inside the cluster.
  ※The subnet mask (the "/14" part of 10.0.0.0/14) must be specified between 9 and 19.

e.g.) The error when specifying --cluster-ipv4-cidr=10.0.0.0/8

```
ERROR: (gcloud.container.clusters.create) ResponseError: code=400, message=cluster.cluster_ipv4_cidr CIDR block size must be no bigger than /9 and no smaller than /19, found /8.
```

## Change the Number of Nodes to 1

```
macOS%$ gcloud container clusters resize hubot-cluster-free --size=1
```

## Create a Deployment

```
macOS%$ kubectl create -f gke-deployment.yml
```

### List Deployments, Replicasets, and Pods

- Filter by the label `app: hubot`

```
macOS%$ kubectl get deployments,replicasets,pods --selector app=hubot
```

### Output in YAML Format

```
macOS%$ kubectl get deployment deployment-hubot -o yaml
```

## Add a LoadBalancer to Expose the Service

```
macOS%$ kubectl create -f gke-lb.yml
```

## List Services

```
macOS%$ kubectl get svc
NAME           CLUSTER-IP     EXTERNAL-IP     PORT(S)          AGE
kubernetes     10.3.240.1     <none>          443/TCP          20m
loadbalancer   10.3.241.129   zz.zzz.zzz.zzz   8080:31628/TCP   4m
```

※EXTERNAL-IP: `zz.zzz.zzz.zzz` is the global IP

## Now, Let's Test!

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

- It worked!
  [f:id:kenzo0107:20170516220548p:plain]

## Updating (Rolling Update)

By using a ReplicationController, you can update with zero downtime.

You can actually observe it updating as follows:

- For each currently Running container, start a container built from the updated image
- Once the updated containers reach the Running state, delete the existing containers

```
// Commit the Docker Container updated locally
macOS%$ docker commit 12f77feb09b4 gcr.io/hubot-167007/hubot:latest
// Push to Google Container Registry
macOS%$ gcloud docker -- push gcr.io/hubot-167007/hubot:latest

// Show Pods
macOS%$ kubectl get pods
NAME                                                      READY     STATUS    RESTARTS   AGE
deployment-hubot-cfe7528ee0b5059b14a30b942597e5ef-z8nws   1/1       Running   1          1d

// Rolling update based on the pushed Image
macOS%$ kubectl rolling-update deployment-hubot-cfe7528ee0b5059b14a30b942597e5ef-z8nws --image=gcr.io/hubot-167007/hubot:latest
```

## Cleanup

- Delete the Deployment

```
macOS%$ kubectl delete -f gke-deployment.yml
```

- Delete the LoadBalancer

```
macOS%$ kubectl delete -f gke-lb.yml
```

## Overall Review

I configured the network firewall and launched the container, but it wouldn't run — and I got pretty stuck on that part (; ~\_~)
I happened to find someone who had raised a similar issue on Stack Overflow, and I used it as a reference.
That was a lifesaver, phew.

Going forward, I'd like to try out and operate GKE + Kubernetes with common cases like Nginx + Rails.
I'll add more once I've put it together!

## References

[Unable to launch a GKE (Google Container Engine) cluster with a custom network](http://stackoverflow.com/questions/38057066/unable-to-launch-a-gke-google-container-engine-cluster-with-a-custom-network)
