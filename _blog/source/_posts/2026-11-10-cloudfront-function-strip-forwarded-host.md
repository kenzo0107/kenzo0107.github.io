---
title: X-Forwarded-Host による Host 偽装を CloudFront Function で origin に渡さないようにした
date: 2026-11-10
lang: ja
translation_id: cloudfront-function-strip-forwarded-host
cover: /img/cover/2026-11-10-cloudfront-function-strip-forwarded-host.svg
categories:
- [AWS]
- [Terraform]
tags:
- AWS
- CloudFront
- CloudFront Functions
- AWS WAF
- ALB
- Rails
- Sentry
- Terraform
- セキュリティ
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

セキュリティ対策の一環として、クライアントが付けた `X-Forwarded-Host` / `Forwarded: host=` などの**転送系ヘッダーを CloudFront Function（viewer request）で削除し、origin に渡さない**ようにしました。

いきなり拒否すると正規の通信を止めるおそれがあったので、まず CloudFront の WAF で **COUNT ルールを入れて計測**し、影響がないことを確かめてから入れています。あわせて、CloudFront を経由しない別の入口の WAF で `CloudFront-Viewer-Address` 付きリクエストを拒否したこと、ALB でオリジン検証ヘッダーを確認するようにしたこと、そのヘッダーを Sentry に送らないようにしたことも残しておきます。

※ 本記事は **2026年11月10日時点**の内容です。Rails / Rack / sentry-ruby の挙動は、対応時に使っていたバージョン（Rails 8.1.4 / Rack 3.2.6 / sentry-ruby 7.0.0）のソースで確認しています。

<!-- more -->

## 結論

| 項目 | 内容 |
| --- | --- |
| リスク | `X-Forwarded-Host` 等で `request.host` が書き換わり、パスワードリセット URL の汚染・キャッシュポイズニング・Host ベースのルーティングの迂回などにつながる |
| 計測 | CloudFront の WAF に COUNT ルールを置き、正規の通信に `X-Forwarded-Host` / `Forwarded: host=` が付いていないことを確認（残り 3 種は計測対象外） |
| 対策 | CloudFront Function（viewer request）で転送系ヘッダー 5 種を削除する |
| 対象外 | `X-Forwarded-Proto` は CloudFront Functions から扱えない。Rails は `assume_ssl` で上書き |
| 付随対策 | CloudFront を経由しない入口の WAF で `CloudFront-Viewer-Address` 付きを拒否 / ALB でオリジン検証ヘッダーを確認 / そのヘッダーを Sentry に送らない |

## 背景: 転送系ヘッダーによる Host 偽装

リバースプロキシの後ろにいるアプリは、`X-Forwarded-Host` などのヘッダーを「元のリクエストの Host」として扱うことがあります。プロキシ側でこのヘッダーを上書き・削除していないと、**クライアントが付けた値がそのままアプリまで届き、アプリが受け取る Host を偽装できます**。

一般に知られているリスクは次のとおりです（[PortSwigger: HTTP Host header attacks](https://portswigger.net/web-security/host-header)）。

- **パスワードリセット URL の汚染**: `request.host` から組み立てた URL をメールに載せると、攻撃者のドメインを指すリンクが正規のメールで届く
- **Web キャッシュポイズニング**: Host から作った URL を含むレスポンスがキャッシュされ、他の利用者にも返る
- **Host ベースのルーティングの迂回**: 1 つのアプリで複数ドメインを Host で振り分けていると、別ドメイン（内部向けなど）のルーティングに入れてしまう

Rails では、`request.host` の元になる `raw_host_with_port` が `X-Forwarded-Host` を優先して使います（[action_dispatch/http/url.rb (v8.1.4)](https://github.com/rails/rails/blob/v8.1.4/actionpack/lib/action_dispatch/http/url.rb)）。

```ruby
def raw_host_with_port
  if forwarded = x_forwarded_host.presence
    forwarded.split(/,\s?/).last
  else
    get_header("HTTP_HOST") || "#{server_name}:#{get_header('SERVER_PORT')}"
  end
end
```

Rails の `request.host` 自体は `Forwarded` ヘッダーを見ませんが、Rack の `Rack::Request` はデフォルトで `forwarded_priority = [:forwarded, :x_forwarded]` となっており、`Forwarded` を `X-Forwarded-*` より優先して解釈します（[rack/request.rb (v3.2.6)](https://github.com/rack/rack/blob/v3.2.6/lib/rack/request.rb)）。実際に確認用スクリプトで試したところ、`X-Forwarded-Host` では Rails の `request.host` が書き換わり、`Forwarded: host=` では書き換わりませんでした。どのミドルウェアがどちらを読むかを全部追うより、**両方とも origin に届かないようにする**方が確実だと判断しました。

構成は CloudFront → ALB → Rails です。CloudFront の origin request policy でビューワーのヘッダーをすべて転送しているため、クライアントが付けた `X-Forwarded-Host` はそのまま Rails まで届いていました。ALB のドキュメントに載っている `X-Forwarded-*` は `X-Forwarded-For` / `X-Forwarded-Proto` / `X-Forwarded-Port` の 3 つで、`X-Forwarded-Host` は含まれません（[HTTP headers and Application Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/x-forwarded-headers.html)）。

## ヘッダーごとの扱い

転送系ヘッダーを一通り洗い出し、削除するものを決めました。

| ヘッダー | アプリでの使われ方 | 判断 |
| --- | --- | --- |
| `X-Forwarded-Host` | Rails の `request.host` | 削除 |
| `Forwarded` | Rack が host / proto / for を解釈 | 削除 |
| `X-Forwarded-Scheme` | Rack が scheme の判定に使う | 削除 |
| `X-Forwarded-Ssl` | Rack が scheme の判定に使う | 削除 |
| `X-Forwarded-Port` | port の判定に使う（ALB が値を設定する） | 削除 |
| `X-Forwarded-Proto` | scheme の判定に使う | CloudFront Functions から扱えないため対象外。Rails の `assume_ssl` で上書き |
| `X-Forwarded-For` | `remote_ip` の計算 | 残す（CloudFront / ALB が追記する前提で使う） |

`X-Forwarded-Proto` は CloudFront の edge function の **Disallowed headers** に含まれており、関数からは参照も追加もできません（[Restrictions on all edge functions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-function-restrictions-all.html)）。

> The following HTTP headers are not exposed to edge functions, and functions can't add them.

そのため Rails 側の `config.assume_ssl = true` に任せています。`ActionDispatch::AssumeSSL` は `HTTP_X_FORWARDED_PROTO` を `https`、`HTTP_X_FORWARDED_PORT` を `443` に上書きするミドルウェアです（[assume_ssl.rb (v8.1.4)](https://github.com/rails/rails/blob/v8.1.4/actionpack/lib/action_dispatch/middleware/assume_ssl.rb)）。

## まず WAF の COUNT で計測する

正規の呼び出し元（モバイルアプリや連携先など）がこれらのヘッダーを付けていないことを、手元のデータでは確認できませんでした。通常の ALLOW は WAF ログに残しておらず、ALB / CloudFront のアクセスログには任意のリクエストヘッダーが記録されないためです。

そこで、CloudFront に付けている WAF に **COUNT ルール**を追加しました。allow 系のルールで評価が止まる前に判定させたいので、priority は小さい値にしています。

計測したのは Host の解釈に使われる `X-Forwarded-Host`（Rails）と `Forwarded: host=`（Rack）の 2 つだけです。`X-Forwarded-Scheme` / `X-Forwarded-Ssl` / `X-Forwarded-Port` は、削除しても scheme / port が CloudFront・ALB・`assume_ssl` の決めた値になるだけで、正規の通信が付けていても挙動は変わりません。そのため計測の対象にはしていません。

```hcl
rule {
  name     = "count-host-override-headers"
  priority = 5

  action {
    count {}
  }

  statement {
    or_statement {
      statement {
        size_constraint_statement {
          comparison_operator = "GT"
          size                = 0

          field_to_match {
            single_header {
              name = "x-forwarded-host"
            }
          }

          text_transformation {
            priority = 0
            type     = "NONE"
          }
        }
      }

      statement {
        byte_match_statement {
          positional_constraint = "CONTAINS"
          search_string         = "host="

          field_to_match {
            single_header {
              name = "forwarded"
            }
          }

          text_transformation {
            priority = 0
            type     = "LOWERCASE"
          }
        }
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "count-host-override-headers"
    sampled_requests_enabled   = true
  }
}
```

WAF ログは logging filter で BLOCK と COUNT だけを残す設定にしていたので、COUNT にしたリクエストはそのままログに残ります（[Finding your protection pack (web ACL) records](https://docs.aws.amazon.com/waf/latest/developerguide/logging-management.html)）。

```hcl
resource "aws_wafv2_web_acl_logging_configuration" "app" {
  resource_arn            = aws_wafv2_web_acl.app.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf_app.arn]

  logging_filter {
    default_behavior = "DROP"

    filter {
      behavior    = "KEEP"
      requirement = "MEETS_ANY"

      condition {
        action_condition {
          action = "BLOCK"
        }
      }

      condition {
        action_condition {
          action = "COUNT"
        }
      }
    }
  }
}
```

集計は CloudWatch Logs Insights で行いました。

```
fields @timestamp, httpRequest.clientIp, httpRequest.uri
| filter @message like /count-host-override-headers/
| stats count(*) by httpRequest.clientIp
| sort count(*) desc
```

あわせて、ヘッダーあり / なしで同じ URL を叩き、レスポンス（ステータスコードと `Location`）が変わらないかを見る確認用スクリプトを用意しました。対策前は差が出て失敗し、対策後は差がなくなって成功する、という判定にしています。

```console
$ curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://www.example.com/
$ curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -H 'X-Forwarded-Host: other.example.com' https://www.example.com/
$ curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -H 'Forwarded: host=other.example.com' https://www.example.com/
```

### 計測期間を待たずに入れた理由

当初は、計測期間を設けてから対策を入れる予定でした。ただ、本番で計測を始めてから翌日までの間に一致したのは確認用スクリプトの実行分だけで、正規の通信からの一致は見つかりませんでした。

また、計測期間は「**WAF で BLOCK する**」前提で決めたものでした。今回の対策はヘッダーを消すだけでリクエストは止めません。仮に正規の通信にヘッダーが付いていても、CloudFront が受けた Host で処理されるだけです。影響が小さく、穴を開けたままにしておく方がリスクが大きいと判断し、前倒しで入れました。

## CloudFront Function で転送系ヘッダーを削除する

viewer request の CloudFront Function でヘッダーを削除します。関数自体はとても短いです。

```js
function handler(event) {
  const request = event.request;
  const headers = request.headers;

  delete headers["x-forwarded-host"];
  delete headers["forwarded"];
  delete headers["x-forwarded-scheme"];
  delete headers["x-forwarded-ssl"];
  delete headers["x-forwarded-port"];

  return request;
}
```

```hcl
resource "aws_cloudfront_function" "strip_forwarded_headers" {
  name    = "strip-forwarded-headers"
  runtime = "cloudfront-js-2.0"
  comment = "Strip client-supplied forwarding headers before sending to the origin"
  publish = true
  code    = file("${path.module}/files/strip_forwarded_headers.js")
}

resource "aws_cloudfront_distribution" "app" {
  # ...

  default_cache_behavior {
    # ...

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.strip_forwarded_headers.arn
    }
  }
}
```

ヘッダー名は CloudFront Functions の event 上では小文字に変換されて渡ってくるので、小文字のキーで削除すれば十分です（[CloudFront Functions event structure](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html)）。関数はローカルの node でも実行し、5 つのヘッダーだけが消え、`host` / `x-forwarded-for` / `cloudfront-viewer-address` が残ることを確認しています。

### 注意点: viewer request の関数は 1 behavior に 1 つ

1 つの cache behavior では、**各イベントタイプに関連付けられる edge function は 1 つだけ**です（[Restrictions on all edge functions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-function-restrictions-all.html)）。

> Each event type (viewer request, origin request, origin response, and viewer response) can have only one edge function association.

JWT 検証などの関数がすでに viewer request に付いている behavior には、この関数を追加できません。その場合は**既存の関数に同じ削除処理を足す**必要があります。処理が 2 か所に分かれるので、片方だけ直す事故を防ぐために、両方のファイルに「もう一方も直す」旨の NOTE を書いておきました。

### origin request policy の allExcept を使わなかった理由

「関数を書かずに origin request policy の `allExcept` で除外すればよいのでは」とも考えましたが、採用しませんでした。

`allExcept` は「ビューワーのヘッダーを、指定したもの以外すべて転送する」設定で、指定したヘッダーは除外の一覧として使われるため、CloudFront が付与する `CloudFront-Viewer-Address` などのヘッダーを追加で含める指定ができません。ビューワーの全ヘッダーに加えて CloudFront のヘッダーを含められるのは `allViewerAndWhitelistCloudFront` です（[OriginRequestPolicyHeadersConfig](https://docs.aws.amazon.com/cloudfront/latest/APIReference/API_OriginRequestPolicyHeadersConfig.html)）。アプリは `CloudFront-Viewer-Address` をクライアント IP として使っているため、`allExcept` に切り替えるとそれが届かなくなります。

### WAF の COUNT ルールは残す

対策後も COUNT ルールは残しています。試行の記録を引き続き取れることを期待してのものです。WAF のルールが viewer request の関数より先に評価されることは、Lambda@Edge については公式に明記されています（[How Lambda@Edge works with requests and responses](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-event-request-response.html)）。

> If you're using AWS WAF, the Lambda@Edge viewer request is executed after any AWS WAF rules are applied.

CloudFront Functions について同じ趣旨の記載は公式ドキュメントで見つけられず、WAF が関数より先に評価されるかは未確認です。

## CloudFront を経由しない入口で CloudFront-Viewer-Address を拒否する

アプリは `CloudFront-Viewer-Address` の値をクライアント IP（`remote_ip`）として信頼する設定になっています。CloudFront 経由なら CloudFront が値を付けるので問題ありませんが、**CloudFront を経由しない別の入口（当時）**では、クライアントがこのヘッダーを付けるだけで `remote_ip` を偽装できます。ログやログイン記録の IP が信用できなくなるので、その ALB に付けている WAF で、このヘッダー付きのリクエストを拒否しました。

```hcl
rule {
  name     = "block-cloudfront-viewer-address"
  priority = 5

  action {
    block {}
  }

  statement {
    size_constraint_statement {
      comparison_operator = "GT"
      size                = 0

      field_to_match {
        single_header {
          name = "cloudfront-viewer-address"
        }
      }

      text_transformation {
        priority = 0
        type     = "NONE"
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "block-cloudfront-viewer-address"
    sampled_requests_enabled   = true
  }
}
```

こちらは CloudFront を経由しない入口なので、正規の通信にこのヘッダーが付くことはありません。そのため COUNT を挟まず、最初から BLOCK にしています。

## ALB でオリジン検証ヘッダーを確認する

CloudFront 側でいくらヘッダーを削っても、ALB に CloudFront 以外から届く経路があれば意味がありません。ALB のセキュリティグループを CloudFront のマネージドプレフィックスリストで絞っていても、これは CloudFront 全体の IP レンジなので、**他のディストリビューション経由の通信までは区別できません**。

AWS のドキュメントの方法に沿って、CloudFront の origin に**カスタムヘッダー**を付け、ALB のリスナールールでその値を確認するようにしました（[Restrict access to Application Load Balancers](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/restrict-access-to-load-balancer.html)）。

```hcl
locals {
  origin_verify_header = "X-Origin-Check"
}

resource "random_password" "origin_verify" {
  length  = 64
  special = false

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_cloudfront_distribution" "app" {
  # ...

  origin {
    origin_id   = "alb-app"
    domain_name = aws_lb.app.dns_name

    custom_header {
      name  = local.origin_verify_header
      value = random_password.origin_verify.result
    }

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
}

resource "aws_lb_listener_rule" "app" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  condition {
    host_header {
      values = ["www.example.com"]
    }
  }

  condition {
    http_header {
      http_header_name = local.origin_verify_header
      values           = [random_password.origin_verify.result]
    }
  }

  # NOTE: CloudFront がヘッダーを付け始める前にリスナールールが変わると正規の通信も弾かれるため、
  #       ディストリビューションの更新完了を待ってから変更する
  depends_on = [aws_cloudfront_distribution.app]
}
```

リスナーのデフォルトアクションは固定レスポンスにしておき、ヘッダーが一致しないリクエストはアプリに届かないようにします。ドキュメントでは 403 を返す例になっていますが、今回は既存の 404 の固定レスポンスをそのまま使いました。

運用面で気をつけた点です。

- **適用順**: CloudFront がヘッダーを付け始める（エッジへの反映が終わる）前にリスナールールが変わると、正規の通信も弾かれる。`depends_on` でディストリビューションの更新完了（`wait_for_deployment`）を待ってからリスナールールを変更する
- **撤去順**: 逆に外すときは、先にリスナールールの condition を消して apply し、その後で custom_header を消す。同じ apply で消すと CloudFront が先にヘッダーを外し、反映が終わるまで正規の通信が弾かれる
- **作り直し防止**: `random_password` が作り直されると同じ理由で通信が弾かれるので、`prevent_destroy` を付ける
- **ローテーション**: 新旧 2 つの値を受け付ける期間を設ける。ドキュメントの手順は別のヘッダーを追加して切り替える方法だが、今回は同じヘッダー名のまま、リスナールールの `values` に新旧両方を入れる → CloudFront を新しい値に切り替える → 旧い値を消す、という手順にした
- **plan の見え方**: sensitive な値が入るため、CloudFront の `origin` ブロック全体とリスナールールの `condition` 全体が以降の plan で `(sensitive value)` 扱いになり、中身を確認できなくなる。レビュー時に把握しておく必要がある
- **値の置き場所**: 値は Terraform state と CloudFront の設定に残る。state と `GetDistributionConfig` の権限を持つ人は読める

なお、ALB を internal にして CloudFront の **VPC オリジン**からつなげる構成にできるなら、そもそもインターネットから ALB に届く経路がなくなるので、そちらの方が素直です（[Restrict access with VPC origins](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-vpc-origins.html)）。

※ その後 ALB は CloudFront の VPC オリジン + internal ALB の構成に置き換え、このヘッダー検証と CloudFront を経由しない入口は廃止しました。経緯は [CloudFront VPC オリジンと ECS ネイティブ Blue/Green の記事](/2026/11/09/2026-11-10-cloudfront-vpc-origin-ecs-native-blue-green/) にまとめています。

## 秘密のヘッダーを Sentry に送らない

見落としやすいのがここです。**オリジン検証ヘッダーは Rails まで届きます**。Sentry がエラーイベントにリクエストヘッダーを添付する設定だと、その値がエラートラッキングに送られてしまいます。

sentry-ruby 7.0.0 で `send_default_pii` が非推奨になり、より細かい `data_collection` という設定が入りました（[CHANGELOG (7.0.0)](https://github.com/getsentry/sentry-ruby/blob/7.0.0/CHANGELOG.md)）。リクエストヘッダーは `:deny_list` モードで、`terms` に一致する名前のヘッダーの値が `[Filtered]` に置き換わります。

ソース（[key_value_collection.rb (7.0.0)](https://github.com/getsentry/sentry-ruby/blob/7.0.0/sentry-ruby/lib/sentry/data_collection/key_value_collection.rb)）を読むと、判定は次のようになっていました。

- ヘッダー名を小文字にして、`terms` の各語を**部分一致**で判定する
- `terms` とは別に、`auth` / `token` / `secret` / `key` / `cookie` などを含む名前は常に除外される（`SENSITIVE_DENY_LIST`）
- `data_collection` を設定せず `send_default_pii = false` のときは、`terms` に `PII_HEADER_SNIPPETS`（`forwarded -ip _ip remote via _user -user`）が backfill される（[data_collection.rb (7.0.0)](https://github.com/getsentry/sentry-ruby/blob/7.0.0/sentry-ruby/lib/sentry/data_collection.rb)）

今回付けたヘッダー名はどちらにも当たらないため、何もしなければ値がそのまま送られます。そこで `terms` に追加しました。

```ruby
Sentry.init do |config|
  config.data_collection.http_headers.request.mode = :deny_list
  # NOTE: オリジン検証ヘッダーは CloudFront が付けるシークレットのため送らない
  config.data_collection.http_headers.request.terms =
    Sentry::DataCollection::PII_HEADER_SNIPPETS + %w[x-origin-check]
end
```

設定が外れたら気づけるように、spec でも確認しています。

```ruby
RSpec.describe "Sentry data collection" do
  it "リクエストヘッダーからオリジン検証ヘッダーを除外する" do
    terms = Sentry.configuration.data_collection.http_headers.request.terms

    expect(terms).to include("forwarded", "-ip", "_ip", "x-origin-check")
  end
end
```

この Rails 側の変更は**先にリリースしてから** ALB / CloudFront 側の変更を適用する前提にしていました。順番が逆だと、適用からリリースまでの間に発生したエラーに値が載って送られてしまいます。ただ実際には、本番では ALB / CloudFront 側の適用の方が Rails の本番リリースより数時間早くなってしまいました。前提の順番は、適用の承認前に確認する手順に入れておくのがよいと思います。

ヘッダー名に `secret` や `token` を含めておけば sentry-ruby の常時除外に当たりますが、それに頼るより明示的に除外しておく方が意図が伝わると考えています。また Sentry に限らず、リクエストヘッダーを丸ごとログや APM に出している箇所があれば同じ問題が起きるので、合わせて確認しておくのがよいと思います。

## まとめ

- `X-Forwarded-Host` / `Forwarded` はクライアントが自由に付けられる。プロキシが何もしなければ、`X-Forwarded-Host` で Rails の `request.host` を偽装でき、`Forwarded` も Rack は Host として解釈する
- いきなり拒否せず、Host の解釈に使われる `X-Forwarded-Host` / `Forwarded: host=` について、WAF の COUNT ルールで正規の通信に付いていないことを確認してから対策した
- 対策はヘッダーを消すだけでリクエストは止めないので、影響が小さく前倒しで入れられた
- CloudFront Function（viewer request）で転送系ヘッダー 5 種を削除した。`X-Forwarded-Proto` は関数から扱えないので Rails の `assume_ssl` に任せた
- viewer request の関数は 1 behavior に 1 つなので、既存の関数がある behavior には同じ処理を足す
- CloudFront を経由しない入口では `CloudFront-Viewer-Address` 付きを WAF で拒否した
- ALB でオリジン検証ヘッダーを確認し、そのシークレットが Sentry に送られないよう除外した

参考になれば幸いです。

## 参考

- [PortSwigger: HTTP Host header attacks](https://portswigger.net/web-security/host-header)
- [Restrictions on all edge functions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-function-restrictions-all.html)
- [CloudFront Functions event structure](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html)
- [How Lambda@Edge works with requests and responses](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-event-request-response.html)
- [OriginRequestPolicyHeadersConfig](https://docs.aws.amazon.com/cloudfront/latest/APIReference/API_OriginRequestPolicyHeadersConfig.html)
- [Add CloudFront request headers](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/adding-cloudfront-headers.html)
- [Restrict access to Application Load Balancers](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/restrict-access-to-load-balancer.html)
- [Restrict access with VPC origins](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-vpc-origins.html)
- [HTTP headers and Application Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/x-forwarded-headers.html)
- [Finding your protection pack (web ACL) records](https://docs.aws.amazon.com/waf/latest/developerguide/logging-management.html)
- [rails/rails: action_dispatch/http/url.rb (v8.1.4)](https://github.com/rails/rails/blob/v8.1.4/actionpack/lib/action_dispatch/http/url.rb)
- [rails/rails: action_dispatch/middleware/assume_ssl.rb (v8.1.4)](https://github.com/rails/rails/blob/v8.1.4/actionpack/lib/action_dispatch/middleware/assume_ssl.rb)
- [rack/rack: lib/rack/request.rb (v3.2.6)](https://github.com/rack/rack/blob/v3.2.6/lib/rack/request.rb)
- [getsentry/sentry-ruby: key_value_collection.rb (7.0.0)](https://github.com/getsentry/sentry-ruby/blob/7.0.0/sentry-ruby/lib/sentry/data_collection/key_value_collection.rb)
- [getsentry/sentry-ruby: data_collection.rb (7.0.0)](https://github.com/getsentry/sentry-ruby/blob/7.0.0/sentry-ruby/lib/sentry/data_collection.rb)
