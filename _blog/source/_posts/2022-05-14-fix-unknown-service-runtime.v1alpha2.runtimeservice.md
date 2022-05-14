---
title: kubeadm init で発生したエラー「unknown service runtime.v1alpha2.RuntimeService」対応
date: 2022-05-14
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

`kubeadm init` 時に以下エラーが発生した際の対処についてまとめます。

```
level=fatal msg="getting status of runtime failed: rpc error: code = Unimplemented desc = unknown service runtime.v1alpha2.RuntimeService"
```

## 結論

以下実行することで解決します。

```
sudo rm /etc/containerd/config.toml
sudo systemctl restart containerd
```

以下参考
{% linkPreview https://github.com/containerd/containerd/issues/4581 %}

## 検証環境

- kubeadm 1.22.7-00
- kubelet 1.22.7-00
- kubectl 1.22.7-00

以上
参考になれば幸いです。
