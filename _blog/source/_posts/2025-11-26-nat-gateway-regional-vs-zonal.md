---
title: NAT Gateway リージョナル vs ゾーナル - コストとIPアドレス管理
date: 2025-11-26
category: AWS
---

Claude Code + AWS Document MCP で調査した内容をまとめます。

## 概要

AWS NAT Gatewayには従来の**ゾーナル（Zonal）**モードに加えて、新しく[**リージョナル（Regional）**モード](https://docs.aws.amazon.com/ja_jp/vpc/latest/userguide/nat-gateways-regional.html)が提供されました。<br/>
本記事では、AWS公式ドキュメントに基づいて両者の特徴、コスト比較、およびIPアドレス管理についてまとめます。

<!-- more -->

## ⚠️ 重要な注意事項

2025.11.26現在、 [terraform-provider-aws](https://github.com/hashicorp/terraform-provider-aws) はリージョナル NAT Gateway をサポートしていません。
issue: https://github.com/hashicorp/terraform-provider-aws/issues/45151

## リージョナル NAT Gateway のコスト優位性

基本的な料金体系はリージョナル、ゾーナルと同じ料金構造です。

- **時間単位料金**: NAT Gatewayが利用可能な時間ごと
- **データ処理料金**: 処理されるデータ量（GB単位）

### コスト削減のメカニズム

リージョナル NAT Gateway の方が、クロスAZ転送がない分、コスト削減できる可能性が高いです。

- ゾーナル設定の問題
```
AZ-1a: Private Subnet → NAT Gateway (AZ-1b) → Internet
      ↑
   クロスAZデータ転送料金が発生
```

- リージョナル設定の利点
```
AZ-1a: Private Subnet → Regional NAT Gateway (自動的にAZ-1aに展開)
AZ-1b: Private Subnet → Regional NAT Gateway (自動的にAZ-1bに展開)
      ↑
   各AZで処理され、クロスAZ転送を削減
```

#### 運用コストの削減

**ゾーナル設定：**
- パブリックサブネットの作成・管理が必要
- 各AZ毎のルートテーブル設定
- 手動でのAZ拡張作業

**リージョナル設定：**
- パブリックサブネット不要
- 単一のルートテーブル設定
- 自動的なAZ拡張・縮小

⚠️ [vpc module](https://registry.terraform.io/modules/terraform-aws-modules/vpc) を利用している場合、パブリックサブネットを作成しない設定にすると Intenet Gateway が作成されません。<br/>
CloudFront VPC Origin を利用する場合、 Internet Gateway が必要なので注意が必要です。

### コスト削減が期待できるケース

1. **マルチAZ展開が頻繁**な環境
2. **クロスAZ通信が多い**現在の設定
3. **複数のゾーナルNAT Gateway**を運用している場合
4. **運用の自動化**によるオペレーショナルコスト削減を重視する場合

## IPアドレス管理：固定IPの実現方法

外部サービス連携する際、外部サービス側でIP許可する為にこちらの出口IPを固定したい、という要件が時にあります。<br/>
リージョナル NAT Gateway でIPを固定する方法が2つあるので注意が必要です。

![](https://i.imgur.com/9uwU4WU.png)

- 自動: IPが自動で割り当てられ、スケールする毎に変更する可能性があります。
- マニュアル:  Elastic IP を固定で指定します。

### 既存IPアドレスの継承方法

AWS公式ドキュメントでは、既存のゾーナルNAT GatewayからIPアドレスを継承する方法も提供されています：

```
既存IPアドレスを再利用する手順:
1. 既存のゾーナルNAT Gatewayを削除してIPアドレスを解放
2. 解放されたIPアドレスを使用してリージョナルNAT Gatewayを作成
3. ルートテーブルをリージョナルNAT Gatewayに更新

注意: この方法では一時的にトラフィック断絶が発生するため、
      メンテナンスウィンドウでの実施を推奨
```

## パフォーマンスと可用性の向上

### 自動高可用性

**従来のゾーナル：**
- 各AZで手動設定が必要
- 新AZ展開時に手動でNAT Gateway追加

**リージョナル：**
- ワークロードを検知して自動的にAZに展開
- 最大60分で新しいAZに展開完了
- 使用していないAZからは自動撤退

### スケーラビリティの向上

| 項目 | ゾーナルNAT Gateway | リージョナルNAT Gateway |
|------|-------------------|----------------------|
| IPアドレス上限 | 8個/Gateway | 32個/AZ |
| 同時接続数 | 55,000/IP | 55,000/IP × 32 |
| AZ拡張 | 手動設定必要 | 自動展開 |
| 管理複雑性 | 高い | 低い |

今後、リージョナル NAT Gateway の優位性が高まっていきそうです♪

## 移行時の考慮事項

### 接続のリセット

**重要な注意点：**
> AWS公式ドキュメントより：
> これにより既存の接続がリセットされます。メンテナンスウィンドウ内でこれらの手順を完了することをお勧めします。

### 移行戦略

#### 戦略A: 新しいIPアドレスでの移行
```
1. 新しいリージョナルNAT Gateway作成
2. ルートテーブル更新
3. 古いゾーナルNAT Gateway削除

メリット: シンプル
デメリット: IPアドレス変更
```

#### 戦略B: 既存IPアドレス保持移行
```
1. 既存ゾーナルNAT Gateway削除（IP解放）
2. 解放されたIPでリージョナルNAT Gateway作成
3. ルートテーブル更新

メリット: IPアドレス保持
デメリット: 一時的な通信断絶
```

## 監視と運用

### CloudWatchメトリクス

リージョナルNAT Gatewayでは従来のメトリクスに加えて：
- AZ別のトラフィック分析
- 自動拡張イベントの監視
- ポート枯渇の早期検知

## 推奨事項とベストプラクティス

### リージョナルNAT Gatewayが推奨されるケース

✅ **推奨**
- マルチAZ環境での新規構築
- 複数のゾーナルNAT Gatewayを運用中
- 運用自動化を重視
- クロスAZ通信が多い環境

❌ **非推奨**
- プライベートNAT Gateway機能が必要
- 単一AZでの小規模システム

### IPアドレス管理の選択指針

| 要件 | 推奨モード | 理由 |
|------|-----------|------|
| 固定IP必要 | Manual | 特定のElastic IP指定可能 |
| コスト最優先 | Automatic | AWS最適化によるコスト削減 |
| セキュリティ重視 | Manual | IPアドレス制御による外部アクセス管理 |
| 運用簡素化 | Automatic | 完全自動化による運用レス |

## まとめ

リージョナルNAT Gatewayは、従来のゾーナルNAT Gatewayと比較して：

**コスト面：**
- クロスAZデータ転送料金の削減
- 運用コストの削減
- 複数NAT Gateway統合によるコスト最適化

**運用面：**
- 自動的な高可用性
- 管理の簡素化
- AZ拡張の自動化

**IPアドレス管理：**
- Manualモードで固定IP実現可能
- 既存IPアドレスの継承も可能
- セキュリティ要件にも対応

特に、**複数のゾーナルNAT Gatewayを運用している環境**では、リージョナルNAT Gatewayへの移行により大幅なコスト削減と運用効率化が期待できます。

**現在の推奨アプローチ：**
- **既存Terraformプロジェクト**: ゾーナルNAT Gatewayで継続運用、Terraformサポート開始を待つ
- **新規プロジェクト**: AWS CLIでRegional NAT Gateway作成、将来的にTerraform管理に移行
- **コスト重視**: 今すぐにでもRegional NAT Gatewayへの移行を検討

移行を検討する際は、現在の通信パターンと外部システムとの連携要件を十分に分析し、適切なモード（AutomaticまたはManual）を選択することが重要です。

## 参考リンク

- [AWS NAT Gateway Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [Regional NAT Gateway Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateways-regional.html)
- [AWS CLI NAT Gateway Commands](https://docs.aws.amazon.com/cli/latest/reference/ec2/create-nat-gateway.html)
- [Terraform AWS Provider - NAT Gateway](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/nat_gateway)

---

*このドキュメントはAWS公式ドキュメントおよびTerraform Providerの調査に基づいて作成されており、最新の情報については公式ドキュメントを参照してください。TerraformサポートのタイムラインについてはHashiCorpのロードマップをご確認ください。*
