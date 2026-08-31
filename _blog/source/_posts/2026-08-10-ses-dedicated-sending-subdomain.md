---
title: SES の通知メールが迷惑メール判定されたので送信専用サブドメイン + DKIM で解消した話
date: 2026-08-10
lang: ja
translation_id: ses-dedicated-sending-subdomain
cover: /img/cover/2026-08-10-ses-dedicated-sending-subdomain.svg
categories:
- [AWS]
- [Terraform]
tags:
- AWS
- SES
- Route53
- DKIM
- SPF
- DMARC
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

社内システムから Lambda + SES で送っているログイン用通知メール（マジックリンク）が**迷惑メール判定**されるようになったので、送信専用サブドメインの SES Domain Identity + Easy DKIM + Custom MAIL FROM + DMARC で解消しました。
親ゾーンが別アカウント・別リポジトリ管理という制約下での NS 委譲の設計と、Terraform での段階移行の進め方を書きます。

<!-- more -->

## 問題

当初の SES 構成は以下でした。

- 送信元がメールアドレス単位の `aws_ses_email_identity`（個人アドレス）
- **DKIM 署名なし**
- **SPF 不一致**（MAIL FROM が amazonses.com のままで From ドメインとアライメントしない）

この状態では受信側の判定材料が弱く、迷惑メールフォルダ行きになっていました。

### 余談: SES の IAM 認可は宛先 Identity にも掛かる

迷惑メール以前に、SES 送信自体が `AccessDenied` で落ちる問題も踏んでいました。`ses:SendEmail` の IAM リソースを送信元 Identity のみに限定していたのですが、**宛先がアカウント内の検証済み Identity の場合、AWS は宛先 Identity に対しても認可チェックを行います**（実機ログ `... is not authorized to perform 'ses:SendEmail' on resource 'identity/<宛先email>'` で確認）。

```hcl
  # SES は From 側 Identity だけでなく、宛先がアカウント内の検証済み Identity の
  # 場合はその宛先 Identity に対しても認可チェックを行う
  statement {
    effect = "Allow"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
    ]
    resources = concat(
      [aws_ses_domain_identity.mail_from.arn],
      [for identity in aws_ses_email_identity.recipient : identity.arn]
    )
  }
```

## 解決方針

送信専用サブドメイン（例: `myapp.example.co.jp`）の Domain Identity に切り替え、認証の3点セットを揃えます。

| 対策 | 内容 |
| --- | --- |
| DKIM | Easy DKIM（CNAME × 3） |
| SPF アライメント | Custom MAIL FROM ドメイン（`bounce.` サブドメイン + MX + SPF） |
| DMARC | `p=none` で開始し、DKIM/SPF の成立を確認してから段階的に引き上げ |

ここで制約になったのが、**親ゾーン（`example.co.jp`）が別 AWS アカウント・別リポジトリで管理されている**ことです。サブドメインの Hosted Zone はアプリ側リポジトリで作り、親ゾーンから NS 委譲してもらう必要があります。

## NS 委譲の設計: stg は prd ゾーン内で委譲する

環境は stg / prd の2つあります。素直にやると親ゾーンに NS レコードを2件（prd 用・stg 用）追加することになりますが、最終的に以下のチェーンにしました。

```
example.co.jp（別アカウント・全社DNSリポジトリ）
  └─ NS委譲 → myapp.example.co.jp（アプリ prd アカウント）
                └─ NS委譲 → stg.myapp.example.co.jp（アプリ stg アカウント）
```

全社 DNS リポジトリへの依存を **prd の 1 レコードに最小化**し、stg の委譲は prd の Hosted Zone 内で完結させます。stg 環境を作り直しても全社リポジトリに影響せず、ライフサイクルがアプリのリポジトリ内に閉じるのが利点です。

NS レコードの値はハードコードせず、`terraform_remote_state` でアプリ側の output を参照します。

```hcl
# アプリ側 prd: stg サブドメインをこのゾーン内で委譲する
# NOTE: 親ゾーン側での NS 委譲は prd ドメインのみとし、stg への委譲はこのゾーン内で
# 完結させることで、stg 環境の作り直しが親ゾーン側に影響しないようにする
resource "aws_route53_record" "mail_stg_delegation" {
  zone_id = aws_route53_zone.mail.zone_id
  name    = "stg.${local.mail_domain}"
  type    = "NS"
  ttl     = 300
  records = data.terraform_remote_state.stg.outputs.mail_zone_name_servers
}
```

## Terraform 実装と段階移行

親ゾーンの NS 委譲が完了するまでドメイン検証は通らないため、**「リソース作成」と「検証 + 切り替え」を PR 2段階に分割**しました。同一 apply で検証まで進めると、委譲未完了で検証タイムアウト + 送信断のリスクがあります。

### Step 1: SES + DNS リソースの先行作成（from は切り替えない）

```hcl
resource "aws_ses_domain_identity" "mail_from" {
  domain = local.mail_domain # 例: myapp.example.co.jp
}

# Easy DKIM 署名用
resource "aws_ses_domain_dkim" "mail_from" {
  domain = aws_ses_domain_identity.mail_from.domain
}

# SPF をアライメントさせるための Custom MAIL FROM domain
resource "aws_ses_domain_mail_from" "mail_from" {
  domain           = aws_ses_domain_identity.mail_from.domain
  mail_from_domain = "bounce.${local.mail_domain}"
}
```

DNS 側は Hosted Zone + 検証 TXT + DKIM CNAME×3 + MAIL FROM の MX/SPF + DMARC です。

```hcl
# NOTE: Easy DKIM 署名検証用 CNAME レコード(3件)。dkim_tokens は新規作成時は apply 後に
# しか値が判明せず for_each + toset のキーにできないため、常に3件である前提で count を使う
resource "aws_route53_record" "mail_dkim" {
  count = 3

  zone_id = aws_route53_zone.mail.zone_id
  name    = "${aws_ses_domain_dkim.mail_from.dkim_tokens[count.index]}._domainkey.${local.mail_domain}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_ses_domain_dkim.mail_from.dkim_tokens[count.index]}.dkim.amazonses.com"]
}

resource "aws_route53_record" "mail_from_mx" {
  zone_id = aws_route53_zone.mail.zone_id
  name    = aws_ses_domain_mail_from.mail_from.mail_from_domain
  type    = "MX"
  ttl     = 600
  records = ["10 feedback-smtp.${data.aws_region.current.region}.amazonses.com"]
}

resource "aws_route53_record" "mail_from_spf" {
  zone_id = aws_route53_zone.mail.zone_id
  name    = aws_ses_domain_mail_from.mail_from.mail_from_domain
  type    = "TXT"
  ttl     = 600
  records = ["v=spf1 include:amazonses.com ~all"]
}

# NOTE: p=none で開始する。DKIM/SPF の成立を確認してから別PRで p=quarantine に上げる
resource "aws_route53_record" "mail_dmarc" {
  zone_id = aws_route53_zone.mail.zone_id
  name    = "_dmarc.${local.mail_domain}"
  type    = "TXT"
  ttl     = 600
  records = ["v=DMARC1; p=none;"]
}
```

NS 委譲用に name servers を output で公開しておきます。

```hcl
output "mail_zone_name_servers" {
  description = "送信専用サブドメインの NS レコード。親ゾーンへの委譲に使用する"
  value       = aws_route53_zone.mail.name_servers
}
```

### Step 2: NS 委譲完了後に検証 + from 切り替え

NS 委譲が済んでから `aws_ses_domain_identity_verification` を追加します（委譲前に入れると apply がタイムアウトします）。

```hcl
# NOTE: ドメイン所有権検証の完了を待つ。NS 委譲済みの TXT レコードが
# DNS に反映されている必要があるため明示的に depends_on する
resource "aws_ses_domain_identity_verification" "mail_from" {
  domain = aws_ses_domain_identity.mail_from.domain

  depends_on = [aws_route53_record.mail_verification]

  timeouts {
    create = "10m"
  }
}
```

検証が通ってから from アドレスを `noreply@myapp.example.co.jp` に切り替え、旧 `aws_ses_email_identity` を削除しました。**旧 Identity は検証完了まで残しておく**のが安全です。

### 細かい罠

- `dkim_tokens` は apply 後にしか値が確定しないため `for_each + toset` のキーにできず、**常に3件前提の `count = 3`** で書く
- 同一メールアドレスを2つの Terraform リソース（送信元用と宛先用）で管理すると、destroy 時にもう一方の Identity も**巻き添えで失効**する
- サブドメイン名は後から短縮したくなった（`mail.prd.myapp...` → `myapp...`）が、Hosted Zone の作り直し = NS 委譲のやり直しになる。**「このサブドメイン配下をメール以外に使うか」は最初に決めておく**べきだった

## 結果

送信元が DKIM 署名 + SPF アライメント + DMARC の揃ったドメイン Identity になり、迷惑メール判定は解消しました。DMARC の `p=none` → `p=quarantine` への引き上げは、レポートを確認しながら別途進める予定です。

## まとめ

- SES のメールアドレス Identity（DKIM なし・SPF 不一致）は迷惑メール判定されやすい。送信専用サブドメインの Domain Identity + Easy DKIM + Custom MAIL FROM + DMARC で解消
- 親ゾーンが別管理のときは「リソース作成」と「検証 + 切り替え」を2段階の PR に分割する
- stg の NS 委譲を prd ゾーン内で行うと、全社 DNS への依存を最小化できる
- SES の IAM 認可は宛先の検証済み Identity にも掛かる

参考になれば幸いです。

## 参考

- [Amazon SES での Easy DKIM](https://docs.aws.amazon.com/ja_jp/ses/latest/dg/send-email-authentication-dkim-easy.html)
- [Amazon SES の カスタム MAIL FROM ドメイン](https://docs.aws.amazon.com/ja_jp/ses/latest/dg/mail-from.html)
- [aws_ses_domain_identity_verification](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ses_domain_identity_verification)
