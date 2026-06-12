---
title: 'Fixing the "unknown service runtime.v1alpha2.RuntimeService" error on kubeadm init'
date: 2022-05-14
category: Infrastructure
lang: en
translation_id: fix-unknown-service-runtime.v1alpha2.runtimeservice
permalink: en/2022/05/14/fix-unknown-service-runtime.v1alpha2.runtimeservice/
cover: /img/cover/2022-05-14-fix-unknown-service-runtime.v1alpha2.runtimeservice.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

This post summarizes how to deal with the following error that occurred during `kubeadm init`.

```
level=fatal msg="getting status of runtime failed: rpc error: code = Unimplemented desc = unknown service runtime.v1alpha2.RuntimeService"
```

## Conclusion

<!-- more -->

You can resolve it by running the following.

```
sudo rm /etc/containerd/config.toml
sudo systemctl restart containerd
```

See the following for reference.
{% linkPreview https://github.com/containerd/containerd/issues/4581 %}

## Test Environment

- kubeadm 1.22.7-00
- kubelet 1.22.7-00
- kubectl 1.22.7-00

That's all.
I hope this is helpful.
