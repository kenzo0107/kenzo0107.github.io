---
title: CodeBuild Docker キャッシュの損益分岐点：S3 vs ローカル
date: 2026-04-20
category: AWS
tags:
  - AWS
  - CodeBuild
  - Docker
  - Cost Optimization
---

AWS CodeBuild の Docker キャッシュは S3 とローカルどちらを選ぶべきか。結論から言うと、**ほとんどの場合ローカルキャッシュが最適**です。本記事では具体的な損益分岐点を示します。

<!-- more -->

## TL;DR（結論）

| 条件 | 推奨 | 理由 |
|------|------|------|
| 週2回以上ビルド | **ローカル** | S3 は転送コストが月$5-$30 |
| ビルドホストが毎回変わる | **S3** | ローカルは無効 |
| 週1回以下のビルド | どちらでも可 | コスト差は月$1未満 |

## 2つのキャッシュ方式

### ローカルキャッシュ

```hcl
cache {
  type  = "LOCAL"
  modes = ["LOCAL_DOCKER_LAYER_CACHE"]
}
```

- **コスト**: 無料
- **制約**: 同じビルドホストでのみ有効、privileged モード必須
- **用途**: 頻繁にビルドする CI/CD 環境

### S3 キャッシュ

```hcl
cache {
  type     = "S3"
  location = "my-bucket/cache"
}
```

- **コスト**: ストレージ $0.023/GB/月 + 転送 $0.09/GB
- **利点**: 全ビルドホスト間で共有可能
- **用途**: ビルドホストが頻繁に変わる環境

## 料金体系（2026年）

### CodeBuild

| タイプ | 料金/分 |
|--------|---------|
| arm1.small | $0.0034 |
| general1.small | $0.005 |
| general1.medium | $0.01 |

### S3 キャッシュ

```
月額コスト = (0.023 × キャッシュGB) + (ビルド回数 × キャッシュGB × 0.09)
```

## 実際のコスト比較

典型的なプロジェクト（キャッシュ 1GB、ヒット率 70%）の場合：

| ビルド回数/月 | ローカル | S3 コスト | 差額 |
|-------------|---------|----------|------|
| 10回 | $0 | $0.65 | $0.65 |
| 50回 | $0 | $3.18 | $3.18 |
| 100回 | $0 | $6.32 | $6.32 |
| 200回 | $0 | $12.62 | $12.62 |

**月50回を超えるビルドでは、S3 コストが$3以上になります。**

## Docker レイヤーキャッシュの仕組み

Docker イメージは複数のレイヤーで構成され、上位レイヤーが変更されると以降のレイヤーが無効化されます。

### 典型的なレイヤー構成

```dockerfile
FROM node:20-alpine              # 150MB（変更: 月1回）
RUN apk add python3              # 50MB（変更: 月1回）
COPY package*.json ./
RUN npm ci                       # 300MB（変更: 週1回）
COPY . .                         # 20MB（変更: 毎日）
RUN npm run build                # 100MB（変更: 毎日）
```

### キャッシュ効率

| 変更内容 | キャッシュヒット | 実効キャッシュ | ビルド短縮 |
|---------|----------------|--------------|-----------|
| コードのみ | レイヤー 1-3 | 500MB (77%) | 3-5分 |
| 依存関係も | レイヤー 1-2 | 200MB (31%) | 2-3分 |
| ベース更新 | なし | 0MB (0%) | 0分 |

**平均実効キャッシュ: 600-900MB、ヒット率: 70-75%**

## Dockerfile 最適化のポイント

### ❌ 悪い例

```dockerfile
COPY . .
RUN npm install  # コード変更のたびに実行される
```

### ✅ 良い例

```dockerfile
# 依存関係を先にインストール
COPY package*.json ./
RUN npm ci --only=production

# コードは後でコピー
COPY . .
```

**効果:** キャッシュヒット率が 60% → 75% に向上

## 決定フローチャート

```
ビルドホストは毎回変わる？
├─ Yes → S3 キャッシュ（必須）
└─ No
   └─ ビルド頻度は？
      ├─ 週2回以上 → ローカルキャッシュ（推奨）
      └─ 週1回以下 → どちらでも可
```

## 実装例

### ローカルキャッシュ（推奨）

```hcl
resource "aws_codebuild_project" "app" {
  name = "my-app"

  environment {
    compute_type    = "BUILD_GENERAL1_SMALL"
    image          = "aws/codebuild/standard:7.0"
    type           = "LINUX_CONTAINER"
    privileged_mode = true  # 必須
  }

  cache {
    type  = "LOCAL"
    modes = ["LOCAL_DOCKER_LAYER_CACHE"]
  }
}
```

### S3 キャッシュ

```hcl
resource "aws_codebuild_project" "app" {
  name = "my-app"

  environment {
    compute_type = "BUILD_GENERAL1_SMALL"
    image       = "aws/codebuild/standard:7.0"
    type        = "LINUX_CONTAINER"
  }

  cache {
    type     = "S3"
    location = "${aws_s3_bucket.cache.bucket}/my-app"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cache" {
  bucket = aws_s3_bucket.cache.id

  rule {
    id     = "expire-cache"
    status = "Enabled"
    expiration {
      days = 7  # 7日後に自動削除
    }
  }
}
```

## まとめ

### 一般的な推奨

**ほとんどの CI/CD 環境ではローカルキャッシュが最適**

- 転送コストがゼロ
- ネットワーク遅延なし
- 月$5-$30 のコスト削減

### 例外的に S3 を選ぶケース

1. ビルドホストが毎回異なる（スポットインスタンスなど）
2. VPC 環境で動作する必要がある
3. ビルド頻度が非常に低い（月4回以下）

### チェックリスト

**Dockerfile を最適化する:**
- [ ] 変更頻度の低い命令を上に配置
- [ ] 依存関係ファイルを先にコピー
- [ ] .dockerignore で不要ファイルを除外

**ローカルキャッシュを使う場合:**
- [ ] `privileged_mode = true` を設定
- [ ] セキュリティ要件を確認

**S3 キャッシュを使う場合:**
- [ ] ライフサイクルポリシーで7日後に削除
- [ ] 動的キャッシュキーを設定（`codebuild-hash-files`）

## 参考リンク

- [AWS CodeBuild Pricing](https://aws.amazon.com/codebuild/pricing/)
- [CodeBuild Build Caching](https://docs.aws.amazon.com/codebuild/latest/userguide/build-caching.html)
- [CodeBuild Local Caching](https://docs.aws.amazon.com/codebuild/latest/userguide/caching-local.html)
- [CodeBuild S3 Caching](https://docs.aws.amazon.com/codebuild/latest/userguide/caching-s3.html)
