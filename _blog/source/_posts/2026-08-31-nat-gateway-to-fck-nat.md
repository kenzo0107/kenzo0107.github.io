---
title: NAT Gateway を fck-nat に置き換えて月額コストを 1/10 にした話と、tainted な ASG で詰みかけた話
date: 2026-08-31
lang: ja
translation_id: nat-gateway-to-fck-nat
cover: /img/cover/2026-08-31-nat-gateway-to-fck-nat.svg
categories:
- [AWS]
- [Terraform]
tags:
- AWS
- NAT Gateway
- fck-nat
- Terraform
- EC2
- コスト削減
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

社内向けの小規模なデータ分析環境（AppStream 2.0 ベース）で使っていた NAT Gateway を [fck-nat](https://fck-nat.dev/)（NAT インスタンス）に置き換え、NAT のコストを **月約 $45 → 約 $4** に削減しました。
置き換え自体は Terraform モジュールを差し替えるだけなのですが、apply の失敗から ASG が **tainted** になり、固定名リソースの置き換えで名前衝突して詰みかけたので、その復旧の顛末も含めて書きます。

<!-- more -->

## 背景

- プライベートサブネットからのアウトバウンドに NAT Gateway を利用していた
- 接続先 SaaS の IP Access List に**固定の Egress IP** を登録する必要があるため、NAT なし構成にはできない
- 利用者は社員のみの小規模環境で、利用頻度も高くない。それに対して NAT Gateway は**使っていなくても時間課金**（東京リージョンで $0.062/時 ≈ 月約 $45/環境）が発生し続ける

置き換えを判断する前に、NAT Gateway の CloudWatch メトリクスで直近24日間の実測を確認しました。

| 観点 | 実測値 |
| --- | --- |
| 期間合計転送量 | 3.81 GB（月換算 約5GB） |
| 転送量が最大の日 | 1.7 GB |
| ピークスループット（5分平均） | 17.5 Mbps |
| 最大同時接続数 | 85 |

S3 への大容量アクセスは Gateway 型 VPC エンドポイント経由で NAT を通らない設計にしているため、NAT を通るのは API 通信や Windows Update 程度です。
この規模であれば **t4g.nano**（ベースライン帯域 約32Mbps、バースト最大5Gbps）で十分と判断しました。実測ピークはベースライン帯域の55%程度です。

## fck-nat とは

[fck-nat](https://github.com/AndrewGuenther/fck-nat) は NAT インスタンス用の AMI と Terraform/CDK モジュールを提供する OSS です。NAT Gateway との比較はざっくり以下です。

| 観点 | NAT Gateway | fck-nat (t4g.nano) |
| --- | --- | --- |
| 月額（東京） | 約 $45 + $0.062/GB | 約 $4 |
| 可用性 | マネージドで冗長 | ASG による自動置換（数分の断） |
| 帯域 | 最大 100Gbps | インスタンスタイプ依存（t4g.nano で約32Mbps〜5Gbps バースト） |
| 運用 | 不要 | OS を持つ自前管理インスタンス |

障害時に ASG の自動置換で数分の NAT 断が発生しますが、社内利用のため許容としました。利用者が増えたら t4g.small（128Mbps 保証、月約$12）に上げるだけで対応できます。

## Terraform 実装

モジュールは [RaJiska/fck-nat/aws](https://registry.terraform.io/modules/RaJiska/fck-nat/aws/latest) v1.6.1 を使いました。
ポイントは **EIP をモジュール外で確保して渡す**ことです。インスタンスが ASG で置換されても Egress IP が変わらず、接続先 SaaS の IP Access List を触らずに済みます。

```hcl
# EIP はモジュール外で確保。インスタンス置換後も Egress IP を維持する
resource "aws_eip" "nat_instance" {
  domain = "vpc"
}

module "fck_nat" {
  source  = "RaJiska/fck-nat/aws"
  version = "1.6.1"

  name      = "fck-nat"
  vpc_id    = module.vpc.vpc_id
  subnet_id = module.vpc.public_subnets[0]

  instance_type      = "t4g.nano"
  ha_mode            = true                      # ASG による自動置換
  eip_allocation_ids = [aws_eip.nat_instance.id] # 置換後も同じ Egress IP を維持

  update_route_tables = true
  route_tables_ids = {
    for i, rt in module.vpc.private_route_table_ids : "private-${i}" => rt
  }
}
```

既存の NAT Gateway からの移行では、VPC モジュール（terraform-aws-modules/vpc/aws）側を `enable_nat_gateway = false` にしつつ、**NAT Gateway が使っていた EIP を `moved` ブロックでモジュール外リソースに引き継ぎ**ました。これで Egress IP の破棄・再作成を避けられます。

```hcl
# 旧 NAT Gateway 用に module.vpc が作成していた EIP をモジュール外リソースへ引き継ぐ。
# 接続先の IP Access List に登録済みの Egress IP を変えないため、破棄・再作成を避ける。
moved {
  from = module.vpc.aws_eip.nat[0]
  to   = aws_eip.nat_instance
}
```

その他の細かい注意点です。

- private サブネットのルート設定完了を待ってから作られてほしいリソース（今回は AppStream Fleet）には `depends_on = [module.fck_nat]` を明示する（依存グラフ上は表現されないため）
- ルート付け替え時、旧ルート削除と新ルート作成の順序次第で `RouteAlreadyExists` になることがある（再 apply で解消）
- 切り替え時に数分の NAT 断が発生するため、利用者がいない時間帯に apply する

## apply 失敗から tainted ASG で詰みかけた話

ここからが本題（?）です。stg 環境への導入時、apply が ASG 作成の完了待ちの途中で失敗しました。このとき AWS 上には ASG が作成済み・インスタンスも稼働中でしたが、Terraform state には**作成失敗（tainted）**として記録されました。tainted は「リソースが不完全・破損した状態にある」と Terraform が推定したときに付くマークで、次回の plan/apply で置き換え対象になります（[Terraform: Recover infrastructure with tainted objects](https://developer.hashicorp.com/terraform/cli/state/taint)）。

### 罠 1: CI の「Re-run failed jobs」は古い plan を再適用する

GitHub Actions + tfcmt の構成で、失敗した apply ジョブを「Re-run failed jobs」で再実行したところ、**保存済みの古い tfplan（ASG を新規作成する内容）をそのまま再適用**するため、実在する ASG と名前衝突して `AlreadyExists` で失敗しました。
リソースが作られた後に create の plan を再適用してはいけない。復旧は新しい plan を生成する再実行（workflow_dispatch）で行う必要があります。

### 罠 2: tainted な固定名リソースの置き換えは名前衝突する

「state に記録されていないのでは」と推測して import ブロックで取り込む PR を作りました。

```hcl
import {
  to = module.fck_nat.aws_autoscaling_group.main[0]
  id = "fck-nat"
}
```

しかし apply は再び `AlreadyExists` で失敗。ログを確認すると、**tainted リソースの置き換えは create-before-destroy 順（plan 上 `+/-`）で実行される**ため、`name` を固定している ASG では新規作成が既存 ASG と必ず名前衝突することが分かりました（apply ログに Destroy が一度も現れないことを確認）。

### 最終解: 手動削除 → プレーンな新規作成

方針を転換し、以下の手順で復旧しました。

1. AWS 上の ASG を手動削除（`aws autoscaling delete-auto-scaling-group --force-delete`）。fck-nat の ENI・EIP は ASG とは独立したリソースのため影響なし
2. **import ブロックを削除**（対象が実在しない import は plan 自体が失敗するため、手動削除方式に切り替えるなら必須）
3. plan の refresh に tainted な state エントリを破棄させ、プレーンな新規作成として apply → 成功

prd 環境でも IAM インスタンスプロファイルの伝播遅延という一過性エラーで apply が一度失敗しましたが、このときは plan に `is tainted, so must be replaced` と出ており、**「apply 失敗 = state 未記録」とは限らない**（多くの場合 tainted として記録済みで import は不要）ことを学びました。まず plan の出力を確認すべきでした。

なお、fck-nat は NAT の実体（静的 ENI・EIP）が ASG と分離されているため、ASG を壊して作り直しても Egress IP は不変です。復旧作業中も外部側（IP Access List）への影響はゼロでした。影響はインスタンス入れ替えの3〜5分程度の NAT 断のみです。

## まとめ

- 小規模環境の NAT Gateway は fck-nat (t4g.nano) への置き換えで **月約 $45 → 約 $4**（stg/prd 2環境で月約 $82 の削減）
- 置き換え判断は CloudWatch の実測（転送量・スループット・同時接続数）に基づいて行う
- EIP はモジュール外で確保し、既存 NAT Gateway の EIP は `moved` で引き継ぐと Egress IP を変えずに移行できる
- apply が失敗したら「Re-run failed jobs」ではなく新しい plan からやり直す
- tainted な固定名リソースは create-before-destroy で名前衝突するため、import ではなく「手動削除 → refresh で tainted エントリ破棄 → 新規作成」が最短だった

参考になれば幸いです。

## 参考

- [fck-nat 公式ドキュメント](https://fck-nat.dev/)
- [AndrewGuenther/fck-nat](https://github.com/AndrewGuenther/fck-nat)
- [RaJiska/terraform-aws-fck-nat](https://github.com/RaJiska/terraform-aws-fck-nat)
- [AWS: NAT ゲートウェイの料金](https://aws.amazon.com/jp/vpc/pricing/)
- [Terraform: Recover infrastructure with tainted objects](https://developer.hashicorp.com/terraform/cli/state/taint)
