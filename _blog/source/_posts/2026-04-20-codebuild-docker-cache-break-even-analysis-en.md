---
title: "CodeBuild Docker Cache Break-Even Analysis: S3 vs Local"
date: 2026-04-20
lang: en
translation_id: codebuild-docker-cache-break-even-analysis
permalink: en/2026/04/20/codebuild-docker-cache-break-even-analysis/
category: AWS
tags:
  - AWS
  - CodeBuild
  - Docker
  - Cost Optimization
cover: https://i.imgur.com/H65Q7Ed.png
---

Should you use S3 or local cache for Docker caching in AWS CodeBuild? The bottom line: **in most cases, local cache is the best choice**. This article shows the concrete break-even points.

<!-- more -->

## TL;DR (Conclusion)

| Condition | Recommendation | Reason |
|------|------|------|
| Building twice a week or more | **Local** | S3 transfer costs $5-$30/month |
| Build host changes every time | **S3** | Local cache is ineffective |
| Building once a week or less | Either works | Cost difference is under $1/month |

## Two Caching Methods

### Local Cache

```hcl
cache {
  type  = "LOCAL"
  modes = ["LOCAL_DOCKER_LAYER_CACHE"]
}
```

- **Cost**: Free
- **Constraints**: Only effective on the same build host, requires privileged mode
- **Use case**: CI/CD environments that build frequently

### S3 Cache

```hcl
cache {
  type     = "S3"
  location = "my-bucket/cache"
}
```

- **Cost**: Storage $0.023/GB/month + transfer $0.09/GB
- **Advantage**: Can be shared across all build hosts
- **Use case**: Environments where the build host changes frequently

## Pricing (2026)

### CodeBuild

| Type | Price/min |
|--------|---------|
| arm1.small | $0.0034 |
| general1.small | $0.005 |
| general1.medium | $0.01 |

### S3 Cache

```
Monthly cost = (0.023 × cache GB) + (number of builds × cache GB × 0.09)
```

## Real-World Cost Comparison

For a typical project (1GB cache, 70% hit rate):

| Builds/month | Local | S3 cost | Difference |
|-------------|---------|----------|------|
| 10 | $0 | $0.65 | $0.65 |
| 50 | $0 | $3.18 | $3.18 |
| 100 | $0 | $6.32 | $6.32 |
| 200 | $0 | $12.62 | $12.62 |

**Above 50 builds per month, S3 costs exceed $3.**

## How Docker Layer Caching Works

A Docker image is made up of multiple layers, and when an upper layer changes, all subsequent layers are invalidated.

### Typical Layer Structure

```dockerfile
FROM node:20-alpine              # 150MB（変更: 月1回）
RUN apk add python3              # 50MB（変更: 月1回）
COPY package*.json ./
RUN npm ci                       # 300MB（変更: 週1回）
COPY . .                         # 20MB（変更: 毎日）
RUN npm run build                # 100MB（変更: 毎日）
```

### Cache Efficiency

| Change | Cache hit | Effective cache | Build time saved |
|---------|----------------|--------------|-----------|
| Code only | Layers 1-3 | 500MB (77%) | 3-5 min |
| Dependencies too | Layers 1-2 | 200MB (31%) | 2-3 min |
| Base image update | None | 0MB (0%) | 0 min |

**Average effective cache: 600-900MB, hit rate: 70-75%**

## Dockerfile Optimization Tips

### ❌ Bad Example

```dockerfile
COPY . .
RUN npm install  # コード変更のたびに実行される
```

### ✅ Good Example

```dockerfile
# 依存関係を先にインストール
COPY package*.json ./
RUN npm ci --only=production

# コードは後でコピー
COPY . .
```

**Effect:** Cache hit rate improves from 60% to 75%

## Decision Flowchart

```
ビルドホストは毎回変わる？
├─ Yes → S3 キャッシュ（必須）
└─ No
   └─ ビルド頻度は？
      ├─ 週2回以上 → ローカルキャッシュ（推奨）
      └─ 週1回以下 → どちらでも可
```

## Implementation Examples

### Local Cache (Recommended)

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

### S3 Cache

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

## Summary

### General Recommendation

**For most CI/CD environments, local cache is the best choice**

- Zero transfer costs
- No network latency
- Saves $5-$30/month

### Exceptional Cases for Choosing S3

1. The build host differs every time (e.g., spot instances)
2. It needs to run in a VPC environment
3. Build frequency is very low (4 or fewer per month)

### Checklist

**Optimize your Dockerfile:**
- [ ] Place instructions that change infrequently higher up
- [ ] Copy dependency files first
- [ ] Exclude unnecessary files with .dockerignore

**When using local cache:**
- [ ] Set `privileged_mode = true`
- [ ] Verify security requirements

**When using S3 cache:**
- [ ] Delete after 7 days with a lifecycle policy
- [ ] Set a dynamic cache key (`codebuild-hash-files`)

## Reference Links

- [AWS CodeBuild Pricing](https://aws.amazon.com/codebuild/pricing/)
- [CodeBuild Build Caching](https://docs.aws.amazon.com/codebuild/latest/userguide/build-caching.html)
- [CodeBuild Local Caching](https://docs.aws.amazon.com/codebuild/latest/userguide/caching-local.html)
- [CodeBuild S3 Caching](https://docs.aws.amazon.com/codebuild/latest/userguide/caching-s3.html)
