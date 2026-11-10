---
title: eMudhra 中間 CA の鍵漏洩を受けて、コンテナ同梱の CA バンドルから emSign ルートを外すまで
date: 2026-11-10
lang: ja
translation_id: emudhra-root-ca-distrust
cover: /img/cover/2026-11-10-emudhra-root-ca-distrust.svg
categories:
- [AWS]
- [Security]
tags:
- AWS
- ECS
- CodeBuild
- CloudWatch Agent
- Amazon Linux 2023
- CA証明書
- eMudhra
- セキュリティ
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

セキュリティ対策の一環として、eMudhra の中間 CA の秘密鍵が漏洩した件を受け、**コンテナに同梱された CA バンドルが、配下の中間 CA の鍵が漏洩した `emSign ECC Root CA - G3` を信頼しないようにする**対応をしました。

ECS のサイドカーで動かしている CloudWatch Agent や CodeBuild、データ基盤のジョブが使うイメージを洗い出しました。独自イメージで CA バンドルを差し替える案と、ビルド時に `ca-certificates` を更新する案はプルリクエストまで作りましたが、1件を除いてクローズしています（執筆時点で1件がオープンのまま残っています）。最終的には、**上流が出した修正版のイメージ（CloudWatch Agent `1.300074.1` 系、CodeBuild 公式イメージ）へ上げる**方針にしました。その経緯と判断理由をまとめます。

※ 本記事は **2026年11月10日時点**の内容です。インシデントはまだ進行中で、各ベンダーの対応状況は今後も変わる可能性があります。事実関係は一次情報（Mozilla の Bugzilla、NSS のリリースアナウンス、Amazon Linux の ALAS、amazon-cloudwatch-agent の RELEASE_NOTES 等）で確認できた範囲で書いています。セキュリティベンダーのブログやニュースにしか載っていない情報はその旨を明記しました。

<!-- more -->

## 結論

| 項目 | 内容 |
| --- | --- |
| 何が起きたか | eMudhra の**中間 CA** 8つの秘密鍵が、公開証明書から復元できる状態だった（2026年10月17日報告） |
| 外すべきルート | `emSign ECC Root CA - G3`（Mozilla NSS 3.131.1 では、別件の eMudhra 自身の申請により `emSign Root CA - C1` / `emSign ECC Root CA - C3` も削除） |
| 困ったところ | ブラウザは CRLSet / OneCRL で即日ブロックされたが、コンテナ内の Go / OpenSSL 等は**同梱の CA バンドル**を見るので、イメージ側を更新しないと信頼したまま |
| 検討した案 | 独自イメージで CA バンドルを上書き / ビルド時に `ca-certificates` を更新 / 上流の修正版を待って上げる |
| 採った方針 | 上流の修正版へ上げる（CloudWatch Agent `1.300074.1b2005`、CodeBuild 公式イメージ 26.10.30 版） |
| 決め手 | 上流の修正が報告から10日〜2週間弱で出たこと。独自イメージは作る・配る・撤去するまでの手間が重く、信頼する証明書の集合もベンダーとずれる |

## 何が起きたのか（公開情報で確認できたこと）

最初に、事実関係を一次情報で確認しました。

- **2026年10月17日（UTC）**: eMudhra の中間 CA 8つの秘密鍵が漏洩していると報告された。Chrome Root Program 経由で Mozilla にも転送され、Mozilla は同日中に OneCRL でのブロックを完了している（[Bugzilla 2083449](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449)）。Chrome も CRLSet でブロックした（Chrome Root Program の [comment 50](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c50)）。報告者の [comment 2](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c2) には、同日 22:46 UTC 取得の CRLSet に TLS 用の6つが失効として入っていたとある
- 原因は鍵生成の不備です。影響を受けた P-384 の鍵は秘密スカラーが極端に小さく、Bugzilla には「The 8 impacted keys all used integers less than 256」とあります。eMudhra は、鍵生成スクリプトの不具合で作られた弱い鍵を誤って CSR に使ったと説明しています（Bugzilla 2083449、eMudhra の初期説明）
- **10月18日**: eMudhra が8つの中間 CA を `caCompromise` で失効させた（Bugzilla 2083449）
- **10月19日**: Sectigo が8つの中間 CA へのクロス証明書を失効させた（[Sectigo のアドバイザリ](https://www.sectigo.com/resource-library/advisory-on-compromised-emudhra-intermediate-certificates)）。クロス証明書の発行元は `AAA Certificate Services`（[Bugzilla 2083449 comment 30](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c30)）
- **10月19日**: Go 1.27.3 / 1.26.10 がリリースされた。[リリース履歴](https://go.dev/doc/devel/release)の記載は「security fixes to the `crypto/x509` package」だけですが、Go の脆弱性データベース（[GO-2026-6809](https://pkg.go.dev/vuln/GO-2026-6809)、CVE-2026-111943）には「a denylist was added in crypto/x509」とあり、対象の中間 CA を含むチェーンを `Verify` が返さなくなった（[golang/go#82345](https://go.dev/issue/82345)）
- **10月20日**: NSS 3.131.1 がリリースされ、`emSign Root CA - C1` / `emSign ECC Root CA - C3` / `emSign ECC Root CA - G3` の3つのルートの信頼が外された（[リリースアナウンス](https://groups.google.com/a/mozilla.org/g/dev-tech-crypto/c/vSxZxnOMMvs)、[oss-security への転載](https://www.openwall.com/lists/oss-security/2026/10/20/30)）。インシデント対応は G3 の削除（[Bug 2084101](https://bugzilla.mozilla.org/show_bug.cgi?id=2084101)）で、C1 / C3 はデュアルパーパスのルートを廃止する eMudhra 自身の申請による削除（[Bug 2083709](https://bugzilla.mozilla.org/show_bug.cgi?id=2083709)）です。この時点で Mozilla は「At this time we are not removing trust in emSign Root CA - G1.」としていた（[Bugzilla 2083449 comment 18](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c18)）
- **10月21日**: Red Hat が [RHSB-2026-012](https://access.redhat.com/security/vulnerabilities/RHSB-2026-012) を公開した。侵害された中間 CA は `Comodo AAA Services root` と `emSign ECC Root CA - G3` から署名されていたと説明している
- **10月24日**: Amazon Linux 2023 の `ca-certificates` が ALAS2023-2026-3306 で Fixed になった（[CVE-2026-113470](https://explore.alas.aws.amazon.com/CVE-2026-113470.html)）。説明文には「Amazon Linux will remove the affected eMudhra root certificates from the package.」とある
- **10月27日**: amazon-cloudwatch-agent `1.300074.1` の [RELEASE_NOTES](https://github.com/aws/amazon-cloudwatch-agent/blob/v1.300074.1/RELEASE_NOTES) に「[Container] Remove root certificates that are no longer trusted from the container image CA bundle」が載った。同じ版には「[Agent] Build the agent with Go 1.27.3」もある
- **10月30日**: CodeBuild 公式イメージの Dockerfile に `ca-certificates` の更新が入った（[aws/aws-codebuild-docker-images の該当コミット](https://github.com/aws/aws-codebuild-docker-images/commit/e2842e2)）
- **11月5日**: Mozilla が `emSign Root CA - G1` のメール用の信頼を外し、TLS の distrust-after を 2026-11-16 23:59:59 UTC に設定する変更を NSS に入れた（[Bug 2089115](https://bugzilla.mozilla.org/show_bug.cgi?id=2089115)）。ルートごと外すのではなく、この日時より後に発行された TLS 証明書を信頼しない扱い

一点、言葉の整理をしておきます。漏洩したのは**中間 CA の鍵**で、ルート CA の鍵が漏洩したわけではありません。ただし、漏洩した鍵を使えば任意のドメインの証明書を作れ、それはルートまで検証が通ります。そのため、各トラストストアは「ルートごと信頼を外す」対応を取っています。

### 確認できなかったこと・情報が割れていること

- **`AAA Certificate Services`（Sectigo のレガシールート）の扱い**: Sectigo は Bugzilla で、このルートは Chrome と Mozilla のルートストアからはすでに外れており、Microsoft と Apple では信頼されたままだと書いています（[comment 6](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c6)）。実際、後述の CloudWatch Agent のバンドルにも、修正前の Amazon Linux 2023 イメージ（`2023.12.20261021.0`）の `tls-ca-bundle.pem` にも入っていませんでした。Sectigo の告知によると、Microsoft は10月25日に Microsoft Root Store から外し（[Sectigo の告知](https://www.sectigo.com/resource-library/removal-of-aaa-certificate-services-from-the-microsoft-root-store)）、Apple は11月2日の週に macOS の一部から外す更新を出すとしています（[Sectigo の告知](https://www.sectigo.com/resource-library/removal-of-aaa-certificate-services-from-the-apple-root-store)）。Microsoft / Apple 自身の告知は確認していません
- **eMudhra がパブリック TLS 事業から撤退する件**: eMudhra は10月22日のプレスリリースで「decided to voluntarily withdraw from the global SSL/TLS certificate business」と発表しています（[eMudhra のプレスリリース](https://emudhra.com/en/press-release/emudhra-to-exit-global-ssl-tls-certificate-business)）。撤退の時期や既存証明書の扱いは確認していません
- **原因の説明**: 上記の原因は eMudhra の初期の説明です。eMudhra は11月2日に、それまでの回答は社内で集められた範囲の分析に基づくもので、KPMG による独立調査を始めたと書いています（[comment 73](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c73)）。最終報告は確認していません

## 影響範囲の洗い出し方

ブラウザは各社の仕組みで即日ブロックされました。しかし、サーバー側のプロセス（Go 製のエージェント、curl、Python の `urllib` 等）が見ているのは、**イメージに入っている CA バンドル**です。CRLSet や OneCRL のような仕組みは効きません。そこで、動いているイメージを洗い出し、CA バンドルがどこから来ているかで分類しました。

### 1. 使っているイメージを列挙する

ECS のタスク定義と CodeBuild プロジェクトから、イメージを抜き出します。

```console
$ aws ecs list-task-definitions --status ACTIVE --query 'taskDefinitionArns[]' --output text \
  | tr '\t' '\n' \
  | xargs -I{} aws ecs describe-task-definition --task-definition {} \
      --query 'taskDefinition.containerDefinitions[].image' --output text \
  | tr '\t' '\n' | sort -u

$ aws codebuild batch-get-projects \
    --names $(aws codebuild list-projects --query 'projects[]' --output text) \
    --query 'projects[].[name,environment.image]' --output text
```

GitHub Actions の CodeBuild ホステッドランナーは、ワークフロー側のラベルでもイメージを上書きできます。`runs-on` に書かれた `image:` やラベルの値も grep しておきます。

### 2. CA バンドルの出どころで分類する

| 種類 | 例 | CA バンドルの場所 | 直し方 |
| --- | --- | --- | --- |
| ディストリ系のイメージ | CodeBuild 標準イメージ（AL2023）、ランナー | OS のトラストストア（`/etc/pki/ca-trust` 等） | `ca-certificates` を更新する |
| scratch / distroless 系 | CloudWatch Agent のコンテナイメージ | イメージに焼き込まれた `/etc/ssl/certs/ca-certificates.crt` | イメージを作り直す（自分で or 上流で） |
| 言語・ツール同梱 | AWS CLI v2（botocore）、certifi、Java の cacerts | パッケージ内のバンドル | それぞれのパッケージを更新する |

注意したいのは3つ目です。OS の `ca-certificates` を更新しても、**AWS CLI v2 は同梱の botocore の CA バンドルを使う**ので、そちらは変わりません。何を直したことになるのかは、プロセス単位で考える必要がありました。

なお、Go は Linux 上では `/etc/ssl/certs/ca-certificates.crt` などの決まったパスから最初に見つかったファイルと、`/etc/ssl/certs` などのディレクトリ内のファイルを読み込みます（[root_linux.go](https://github.com/golang/go/blob/master/src/crypto/x509/root_linux.go)、[root.go](https://github.com/golang/go/blob/master/src/crypto/x509/root.go)）。CloudWatch Agent のイメージでは、これらのパスにあるのは `/etc/ssl/certs/ca-certificates.crt` だけでした。

### 3. イメージを動かさずに CA バンドルを確認する

CloudWatch Agent のイメージは scratch ベースで、shell が入っていません。`docker run` して中を覗くことができないので、レジストリ API でレイヤーを取ってきて、CA バンドルのファイルだけを取り出しました。

```bash
#!/usr/bin/env bash
set -euo pipefail

repo=cloudwatch-agent/cloudwatch-agent
tag=${1:?tag}
accept="Accept: application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json"

token=$(curl -fsS "https://public.ecr.aws/token/?scope=repository:${repo}:pull" | jq -r .token)
digest=$(curl -fsS -H "Authorization: Bearer ${token}" -H "${accept}" \
  "https://public.ecr.aws/v2/${repo}/manifests/${tag}" \
  | jq -r '.manifests[] | select(.platform.architecture=="arm64") | .digest')

: > bundle.pem
for layer in $(curl -fsS -H "Authorization: Bearer ${token}" -H "${accept}" \
    "https://public.ecr.aws/v2/${repo}/manifests/${digest}" | jq -r '.layers[].digest'); do
  curl -fsSL -H "Authorization: Bearer ${token}" "https://public.ecr.aws/v2/${repo}/blobs/${layer}" -o layer.tgz
  if tar -tzf layer.tgz | grep -x 'etc/ssl/certs/ca-certificates.crt' >/dev/null; then
    tar -xzOf layer.tgz etc/ssl/certs/ca-certificates.crt > bundle.pem
  fi
done
[ -s bundle.pem ] || { echo "CA bundle not found in ${tag}" >&2; exit 1; }

openssl crl2pkcs7 -nocrl -certfile bundle.pem | openssl pkcs7 -print_certs -noout | grep -c '^subject='
openssl crl2pkcs7 -nocrl -certfile bundle.pem | openssl pkcs7 -print_certs -noout | grep -E '^subject=.*(emSign|AAA Certificate Services)' || true
```

執筆時点で改めて実行した結果です（arm64）。

| タグ | 証明書数 | emSign ECC Root CA - G3 | emSign Root CA - C1 / ECC C3 | emSign Root CA - G1 | AAA Certificate Services |
| --- | --- | --- | --- | --- | --- |
| `1.300072.0b1766` | 143 | あり | あり | あり | なし |
| `1.300074.0b1920` | 143 | あり | あり | あり | なし |
| `1.300074.1b2005` | 140 | **なし** | **なし** | あり | なし |

減った3枚は、NSS 3.131.1 で外れた3つのルートと一致しました。`emSign Root CA - G1` が残っているのも、10月20日時点の Mozilla の方針どおりです。なお、11月5日の distrust-after 設定（Bug 2089115）の後、Amazon Linux 2023 の最新イメージ（`2023.12.20261109.0`）の `tls-ca-bundle.pem` からは `emSign Root CA - G1` も消えていました。

### 4. 直ったことを機械的に判定する

ディストリ系のイメージでは、CA バンドルに `emSign ECC Root CA - G3` が残っていたら**ジョブを失敗させる**チェックを入れました。ラベル行（`# <名前>`）が無いとチェックがすり抜けるので、その場合も失敗にしています。実際のプルリクエストでは `AAA Certificate Services` / `Comodo AAA Services root` も失敗条件に入れていました。ただ、前述のとおり Mozilla 系のバンドルにはもともと含まれていないため、本記事の例では失敗条件を `emSign ECC Root CA - G3` だけにし、AAA は有無をログに出すだけにしています。後述の Dockerfile と buildspec の例も同じです。

```bash
bundle=/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem
grep -q '^# ' "$bundle" || { echo "no certificate labels in $bundle" >&2; exit 1; }
if grep -E '^# emSign ECC Root CA - G3$' "$bundle"; then
  echo 'emSign ECC Root CA - G3 is still in the CA bundle' >&2
  exit 1
fi
grep -E '^# (AAA Certificate Services|Comodo AAA Services root)$' "$bundle" || echo 'AAA root: not found'
```

## 検討した3つの案

### 案1: 独自イメージで CA バンドルを上書きする

調査した10月28日時点では、CloudWatch Agent の最新タグ `1.300074.0b1920` にも `emSign ECC Root CA - G3` が残っていました。タグを上げても直らない状態です。scratch ベースなので、イメージの中でパッケージを更新することもできません。

そこで、Amazon Linux 2023 で修正版の `ca-certificates` を入れ、できたバンドルを CloudWatch Agent のイメージへ上書きするマルチステージビルドを作りました。

```dockerfile
FROM public.ecr.aws/amazonlinux/amazonlinux:2023 AS ca-certificates
RUN dnf upgrade -y --releasever=latest ca-certificates && \
    dnf clean all && \
    if grep -E '^# emSign ECC Root CA - G3$' /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem; then exit 1; fi

FROM public.ecr.aws/cloudwatch-agent/cloudwatch-agent:1.300072.0b1766
COPY --from=ca-certificates /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem /etc/ssl/certs/ca-certificates.crt
```

`--releasever=latest` を付けているのは、**AL2023 はリポジトリのバージョンがイメージ作成時のリリースに固定される**ためです（[Deterministic upgrades through versioned repositories on AL2023](https://docs.aws.amazon.com/linux/al2023/ug/deterministic-upgrades.html)）。付けないと、古いイメージからは修正版の `ca-certificates` が見えません。

手元のビルドでは、証明書は 143 → 140 枚に減りました。Amazon のルートは残っているので、X-Ray のエンドポイントへの TLS 検証も通ります。ただ、実運用に乗せるまでの段取りが多くなりました。

- 独自イメージの置き場所（ECR リポジトリ）を作る
- アプリのデプロイワークフローに、ビルドと push のステップを足す
- タスク定義の image を差し替える。イメージが push される前に apply すると、新しいタスクがイメージを pull できず起動しない（`essential = false` のサイドカーでも、pull に失敗すればタスクは起動しない）
- ベースイメージに、ビルド時の残骸らしき同じ内容のバンドル（`/tmp/ca-bundle.crt`）が残っていて、イメージスキャンで検出され続けた。こちらも上書きが必要だった
- 上流が直したら、これらを全部撤去する

### 案2: ビルド時に `ca-certificates` を更新する

CodeBuild の標準イメージ `amazonlinux-aarch64-standard:3.0`（AL2023）にも、同じルートが残っていました。こちらはディストリ系なので、buildspec の `install` フェーズで更新できます。

```yaml
version: 0.2
phases:
  install:
    commands:
      - dnf upgrade -y --releasever=latest ca-certificates
      - grep -q '^# ' /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem
      - if grep -E '^# emSign ECC Root CA - G3$' /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem; then exit 1; fi
```

ハマったのは、**CodeBuild ホステッドの GitHub Actions ランナー**です。ランナーとして動くプロジェクトでは、通常は buildspec が実行されません。ジョブにステップを足せば済みますが、reusable workflow を呼んでいるジョブにはステップを足せません。そこで、ランナー用プロジェクトに buildspec を持たせ、`runs-on` のラベル末尾に `-with-buildspec` を付ける方法を取りました。こうすると `INSTALL` / `PRE_BUILD` / `POST_BUILD` フェーズが実行されます（[Label overrides supported with the CodeBuild-hosted GitHub Actions runner](https://docs.aws.amazon.com/codebuild/latest/userguide/sample-github-action-runners-update-labels.html)）。

```yaml
jobs:
  plan:
    runs-on: codebuild-my-runner-${{ github.run_id }}-${{ github.run_attempt }}-arm-3.0-small-with-buildspec
```

ただし、この案にも欠点があります。

- ビルドのたびにパッケージリポジトリへ取りに行くので、時間が延び、外部への依存が1つ増える
- 先に述べたとおり、AWS CLI v2 や certifi など**同梱バンドル側は変わらない**
- ワークフローやラベルを直す場所がリポジトリをまたいで散らばる

### 案3: 上流の修正版を待って上げる

一番素直な案です。ただ、10月28日時点では CloudWatch Agent の修正版が手元から見えず、いつ出るのかも分かりませんでした。そのため最初は案1・案2を進め、**10月29日にチームの対応方針として、独自イメージによる回避策は使わず上流の修正版を待つ**ことになりました。

その後、CloudWatch Agent は `1.300074.1b2005`（11月5日時点の `latest` と同じ digest）で修正済みになっていました。CodeBuild 公式イメージも 26.10.30 版で、Dockerfile に `dnf -y upgrade --releasever=latest ca-certificates` が入りました（[aws/aws-codebuild-docker-images の該当コミット](https://github.com/aws/aws-codebuild-docker-images/commit/e2842e2)）。CodeBuild 側は `:3.0` を指定したまま修正版に切り替わり、11月5日にジョブの中で CA バンドルを検査して、`emSign ECC Root CA - G3` が残っていないことを確認しています。

なお、RELEASE_NOTES 上は `1.300074.1` の日付が10月27日です。しかし、10月28日に私が確認した時点では、`1.300074.0b1920` より新しいタグを見つけられていませんでした。リリースノートの日付と公開イメージが出た日がずれていたのか、私の確認が漏れていたのかは、確認できていません。**リリースノートだけを見て判断せず、実際のイメージの中身を確認する**のが確実だと思います。

## 比較表

| 観点 | 案1: 独自イメージ | 案2: ca-certificates 更新 | 案3: 公式版へ上げる |
| --- | --- | --- | --- |
| 使える対象 | scratch / distroless 系も含めて何でも | ディストリ系のイメージのみ | 上流が直したもの |
| 効くまでの速さ | 早い（自分で作れる） | 早い | 上流次第（今回は報告から10日〜2週間弱） |
| 変更の量 | ECR・ビルド・デプロイ・タスク定義と多い | buildspec / ワークフロー単位で散らばる | タグを上げるだけ |
| デプロイ順序の制約 | あり（イメージの push → タスク定義の差し替え） | ほぼなし | なし |
| 信頼する証明書の集合 | AL2023 のものに置き換わり、上流とずれる | OS のものになる | 上流のまま |
| 同梱バンドル（botocore 等） | 対象のイメージ次第 | 変わらない | 上流次第 |
| 後片付け | 必要（独自イメージ・パイプラインの撤去） | 必要（不要になった更新処理の撤去） | 不要 |

## 判断理由

最終的に案3（公式版へ上げる）にしました。

- **上流の修正が早かった**。報告から10日〜2週間弱で、CloudWatch Agent（RELEASE_NOTES 上は10月27日）も CodeBuild 公式イメージ（10月30日のコミット）も直った
- 独自イメージは、作るよりも**配って、最後に撤去する**ほうが手間がかかる。デプロイ順序を間違えるとタスクが起動しないリスクもある
- CA バンドルを別のディストリのものに差し替えると、信頼する証明書の集合がベンダーの想定とずれる。今回は Amazon のルートが残ることを確認しましたが、ずれ自体が新たな調査対象になる
- 待っている間のリスクは、通信先で見積もった。漏洩した中間 CA は失効済みです。ただし、Go のエージェントは失効をチェックしないので、ルートが残っている間は偽の証明書を受け入れうる状態でした。一方で、通信先は AWS のエンドポイントに限られます。成立させるには経路上での中間者攻撃が必要なので、修正版を待つ期間は許容できると判断しました
- 判定は「タグを上げたこと」ではなく、**イメージの CA バンドルに対象のルートが無いこと**で行い、修正前の版を陽性対照として並べた

作ったプルリクエストは、独自イメージ用の ECR リポジトリ、Dockerfile、タスク定義の差し替え、`ca-certificates` の更新処理まで含めて、1件を除いてクローズしました（執筆時点で1件がオープンのまま残っています）。結果的には捨てた作業です。ただ、上流の修正が遅れたらすぐ出せる状態にしておけたので、待つ判断がしやすかったと思っています。

## まとめ

- 漏洩したのは eMudhra の**中間 CA の鍵**で、トラストストア側はルート（`emSign ECC Root CA - G3` 等）ごと信頼を外す対応になった
- ブラウザは即日ブロックされたが、コンテナ内のプロセスは**同梱の CA バンドル**を見るので、イメージ側の更新が必要
- 影響範囲は「イメージを列挙 → CA バンドルの出どころ（OS / 焼き込み / 言語同梱）で分類 → レイヤーを取り出して中身を確認」の順で洗い出した
- 独自イメージや `ca-certificates` 更新の案はプルリクエストまで作ったが、上流の修正版（CloudWatch Agent `1.300074.1b2005`、CodeBuild 公式イメージ 26.10.30 版）に上げる方針にした
- AL2023 で `ca-certificates` を更新するときは `--releasever=latest` が必要
- リリースノートではなく、イメージの CA バンドルの中身で直ったことを判定する

参考になれば幸いです。

## 参考

- [Bugzilla 2083449 - eMudhra: Private key compromise of Intermediate Certificates](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449)
- [NSS 3.131.1 release announcement (dev-tech-crypto)](https://groups.google.com/a/mozilla.org/g/dev-tech-crypto/c/vSxZxnOMMvs)
- [NSS 3.131.1 release announcement (oss-security)](https://www.openwall.com/lists/oss-security/2026/10/20/30)
- [RHSB-2026-012 Certificate compromise - eMudhra](https://access.redhat.com/security/vulnerabilities/RHSB-2026-012)
- [Amazon Linux Security Center - CVE-2026-113470](https://explore.alas.aws.amazon.com/CVE-2026-113470.html)
- [Advisory on compromised eMudhra intermediate certificates (Sectigo)](https://www.sectigo.com/resource-library/advisory-on-compromised-emudhra-intermediate-certificates)
- [Bug 2083709 - Remove eMudhra emSign Root CA - C1 and emSign ECC Root CA - C3 from NSS](https://bugzilla.mozilla.org/show_bug.cgi?id=2083709)
- [Bug 2084101 - Remove eMudhra emSign Root CA - G3 from NSS](https://bugzilla.mozilla.org/show_bug.cgi?id=2084101)
- [Bug 2089115 - Remove email trust and set TLS distrust-after to 2026-11-16 23:59:59 UTC for emSign Root CA - G1](https://bugzilla.mozilla.org/show_bug.cgi?id=2089115)
- [eMudhra to exit global SSL/TLS certificate business (eMudhra)](https://emudhra.com/en/press-release/emudhra-to-exit-global-ssl-tls-certificate-business)
- [GO-2026-6809 (Go vulnerability database)](https://pkg.go.dev/vuln/GO-2026-6809)
- [amazon-cloudwatch-agent RELEASE_NOTES (v1.300074.1)](https://github.com/aws/amazon-cloudwatch-agent/blob/v1.300074.1/RELEASE_NOTES)
- [aws/aws-codebuild-docker-images: Update Docker image versions for 26.10.30](https://github.com/aws/aws-codebuild-docker-images/commit/e2842e2)
- [Deterministic upgrades through versioned repositories on AL2023](https://docs.aws.amazon.com/linux/al2023/ug/deterministic-upgrades.html)
- [Label overrides supported with the CodeBuild-hosted GitHub Actions runner](https://docs.aws.amazon.com/codebuild/latest/userguide/sample-github-action-runners-update-labels.html)
- [Go release history](https://go.dev/doc/devel/release)
- [crypto/x509/root_linux.go](https://github.com/golang/go/blob/master/src/crypto/x509/root_linux.go)
- [crypto/x509/root.go](https://github.com/golang/go/blob/master/src/crypto/x509/root.go)
