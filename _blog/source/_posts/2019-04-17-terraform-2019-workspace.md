---
layout: post
title: Terraform 運用ベストプラクティス 2019 ~workspace をやめてみた等諸々~
date: 2019-04-17
tags:
- Terraform
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190417/20190417103456.png
---

<span style="color: #ff0000"><b>2020-05-05 追記</b></span> 2020年春のベストプラクティス更新しています。

{% linkPreview https://kenzo0107.github.io/2020/04/25/2020-04-25-terraform-bestpractice-2020/ _blank %}

---

以前 terraform で workspace 毎に tfstate 管理する方法を執筆しましたが、実運用上いくつかの問題がありました。

<p>結論、現在は workspace 運用をやめています。</p>

{% linkPreview https://kenzo0107.github.io/2017/12/05/2017-12-05-terraform-workspace-tfsate/ _blank %}

## workspace 運用例

<p>まずは実際の運用例です。</p>

<p>もっとうまいことやってるぞ！という話はあろうかと思いますが、まずはありがちなケースを紹介します。</p>

<!-- more -->

### 例) セキュリティグループ作成

<p>以下の要件を実現するセキュリティグループを作成するとします。</p>

#### 要件

<ul>
<li>stg では、社内で Wifi の ip からのみアクセス可</li>
<li>prd では、ip 制限なくアクセス可</li>
</ul>


#### サンプルコード

<ul>
<li>variables.tf</li>
</ul>


<pre class="code" data-lang="" data-unlink>variable &#34;ips&#34; {
  type = &#34;map&#34;
  default = {
    stg.cidrs    = &#34;12.145.67.89/32,22.145.67.89/32&#34;
    prod.cidrs   = &#34;0.0.0.0/0&#34;
  }
}</pre>


<ul>
<li>security_group.tf</li>
</ul>


<pre class="code" data-lang="" data-unlink>resource &#34;aws_security_group&#34; &#34;hoge&#34; {
  name        = &#34;${terraform.workspace}-hoge-sg&#34;
  vpc_id      = &#34;${aws_vpc.vpc_main.id}&#34;
}

resource &#34;aws_security_group_rule&#34; &#34;https&#34; {
  security_group_id = &#34;${aws_security_group.hoge.id}&#34;
  type              = &#34;ingress&#34;
  from_port         = 443
  to_port           = 443
  protocol          = &#34;tcp&#34;
  cidr_blocks       = [&#34;${split(&#34;,&#34;, lookup(var.ips, &#34;${terraform.workspace}.cidrs&#34;))}&#34;]
}

resource &#34;aws_security_group_rule&#34; &#34;https&#34; {
  security_group_id = &#34;${aws_security_group.hoge.id}&#34;
  type              = &#34;egress&#34;
  from_port         = 0
  to_port           = 0
  protocol          = &#34;-1&#34;
  cidr_blocks       = [&#34;0.0.0.0/0&#34;]
}</pre>


<p>実際に terraform を plan/apply する前にまずは
terraform workspace を定義する必要があります。</p>

<pre class="code" data-lang="" data-unlink>terraform workspace new stg // 既に作成されていたらエラーとなります。
terraform workspace select stg

// terraform workspace = stg とした場合の tfstate をローカルのメモリ上で管理します。
terraform init </pre>


<p>上記のような処理があって、初めて、 `variable "ips"` の `stg.cidrs`, `prd.cidrs` が利用できるようになります。</p>

<p>こちらを運用しようとしてみると以下の様な問題にぶつかりました。</p>

## 実運用との相性が悪い

<p><span style="color: #d32f2f"><b>ステージングのみに反映させたい</b></span>、という時にどう運用したら良いでしょうか。</p>

<p>ステージング用、本番用に設定して、プルリクエストが通って、サンプルのコードを master にマージしていたらどうでしょう？</p>

<p><b>本番にもデプロイして良さそうに見えます。</b></p>

<p>いや、むしろ反映されていなければ、混乱します。</p>

<p>その後に master にマージして、本番に反映させたいコードがあった時に、サンプルコードの部分は反映させたくない！と言っても反映されてしまいます。</p>

<p>かといって、以下の様なコードを複数リソースに入れていくのは、余計なステップ数も増え、脳内でリソースが消費されます。レビューするのも辛いです。</p>

<pre class="code" data-lang="" data-unlink>count = &#34;${terraform.workspace == &#34;stg&#34; ? 1: 0}&#34;</pre>


<p>では、本番用は設定しなければいいじゃないか！と言って設定しないと、本番用はエラーを出す様になり、その他の反映が何もできなくなります。</p>

<p><b>これはステージングも本番も同じファイルを参照している為に発生しています。</b></p>

<p>また、 workspace を利用していると以下の様な問題もありました。</p>

## stg, prd 以外に新たに workspace を追加したい場合

<p>以下要望があった場合にどうでしょうか。</p>

<ul>
<li>「負荷試験をする為に本番同様の環境を用意してください」</li>
<li>「外部 API との連携試験をしたいので環境を別途増やして欲しいです！」</li>
</ul>


<p>例えば、 負荷試験環境を用意しようとすると、 loadtst という workspace を用意するとしたら variables.tf を以下のように修正が必要です。</p>

<pre class="code" data-lang="" data-unlink>variable &#34;ips&#34; {
  type = &#34;map&#34;
  default = {
    loadtst.cidrs = &#34;12.145.67.89/32,22.145.67.89/32&#34; // 追加
    stg.cidrs     = &#34;12.145.67.89/32,22.145.67.89/32&#34;
    prod.cidrs    = &#34;0.0.0.0/0&#34;
  }
}</pre>


<p>上記例ですと variable "ips" に 1行加えただけで良いですが、実際は
あらゆる変数に `loadtst.*** = ***` というコードを追加していく必要があります。</p>

<p>workspace が増える毎に step 数が増え、ファイルの見通しが悪くなります。</p>

<p>また、以下の様なコードがあると、こちらも脳内リソースを消費し、疲弊します。</p>

<pre class="code" data-lang="" data-unlink>lookup(var.ips, &#34;${terraform.workspace}.cidrs&#34;)</pre>




<pre class="code" data-lang="" data-unlink>&#34;${terraform.workspace == &#34;stg&#34; ? hoge: moge}&#34;</pre>


## workspace 運用をまとめると

<p><b>workspace の利用はリソースを複数環境で共有する</b> ことで運用する想定の為に、可読性の悪化、実運用との乖離がありました。</p>

<ol>
<li><p>新たに workspace 追加する際に、全ての変数 map に追加しなければならない。<br/>
→ コードの見通しが悪くなる。<br/>
→ 新規環境の構築難易度が上がる。</p></li>
<li><p>ステージングのみに反映という時の実運用が困難<br/>
→ ステージングも本番も同じファイルを参照している為、ファイルの中でステージングの場合は？と処理を分ける必要が出てきてしまう。</p></li>
<li><p>今、どの workspace なのかがわかりずらく、 terraform apply する際にかなり躊躇してしまう。<br/>
→ 実際 `terraform apply` 実行前に `terraform workspace show` で workspace 確認しても、実行中で少し時間が経つと、「あれ？どっちだっけ？」と不安になり、 Terminal を遡って確認することがあったりしました。</p></li>
</ol>


## ではどうすると良いか？

<p>徹底的に workspace をやめます。</p>

<p>= <b>DRY な設計しよう！</b></p>

<p>これに尽きます。</p>

<p>実際にどうしたか以下まとめました。</p>

### ディレクトリ構成は以下のようにしました。

<p>modules/common ... stg, prd どちらの環境でも共通して同構成で作成するリソースを置きます。</p>

<p>modules/stg,prd ... 個々に異なる構成となるリソースを置きます。<a href="#f-5cda4c55" name="fn-5cda4c55" title="ECS + RDS + Redis 構成で CodePipeline からデプロイするサンプル terraform です。">*1</a></p>

<pre class="code" data-lang="" data-unlink>.
├── README.md
├──envs/
│   ├── prd
│   │   ├── backend.tf
│   │   ├── main.tf
│   │   ├── provider.tf
│   │   ├── region.tf
│   │   ├── templates
│   │   │   └── user-data.tpl
│   │   └── variable.tf
│   └──stg/
│       ├── backend.tf
│       ├── main.tf
│       ├── provider.tf
│       ├── region.tf
│       ├── templates
│       │   └── user-data.tpl
│       └── variable.tf
│
└──modules
    ├── common
    │   ├── bastion.tf
    │   ├── bucket_logs.tf
    │   ├── bucket_static.tf
    │   ├── certificate.tf
    │   ├── cloudfront.tf
    │   ├── cloudwatch.tf
    │   ├── codebuild.tf
    │   ├── codepipeline.tf
    │   ├── network.tf
    │   ├── output.tf
    │   ├── rds.tf
    │   ├── redis.tf
    │   ├── security_group.tf
    │   └── variable.tf
    ├── prd
    │   ├── admin.tf
    │   ├── admin_autoscaling_policy.tf
    │   ├── api.tf
    │   ├── app.tf
    │   ├── ecr.tf
    │   ├── iam_ecs.tf
    │   ├── output.tf
    │   ├── variable.tf
    │   └── waf.tf
    └── stg
        ├── admin.tf
        ├── api.tf
        ├── app.tf
        ├── ecr.tf
        ├── iam_ecs.tf
        ├── output.tf
        ├── variable.tf
        └── waf.tf</pre>


### 前出のセキュリティグループの作成を例にするとどうなるか

<p>以下の様になります。</p>

<ul>
<li>envs/prd/variables.tf</li>
</ul>


<pre class="code" data-lang="" data-unlink>variable &#34;cidrs&#34; {
  default = [
    &#34;0.0.0.0/0&#34;,
  ]
}</pre>


<ul>
<li>envs/stg/variables.tf</li>
</ul>


<pre class="code" data-lang="" data-unlink>variable &#34;cidrs&#34; {
  default = [
    &#34;12.145.67.89/32&#34;,
    &#34;22.145.67.89/32&#34;,
  ]
}</pre>


<ul>
<li>envs/common/security_group.tf</li>
</ul>


<pre class="code" data-lang="" data-unlink>resource &#34;aws_security_group&#34; &#34;hoge&#34; {
  name        = &#34;${terraform.workspace}-hoge-sg&#34;
  vpc_id      = &#34;${aws_vpc.vpc_main.id}&#34;
}

resource &#34;aws_security_group_rule&#34; &#34;https&#34; {
  security_group_id = &#34;${aws_security_group.hoge.id}&#34;
  type              = &#34;ingress&#34;
  from_port         = 443
  to_port           = 443
  protocol          = &#34;tcp&#34;
  cidr_blocks       = [&#34;${var.cidrs&#34;))}&#34;]
}

resource &#34;aws_security_group_rule&#34; &#34;https&#34; {
  security_group_id = &#34;${aws_security_group.hoge.id}&#34;
  type              = &#34;egress&#34;
  from_port         = 0
  to_port           = 0
  protocol          = &#34;-1&#34;
  cidr_blocks       = [&#34;0.0.0.0/0&#34;]
}</pre>


<p>もし stg だけに反映させたいセキュリティグループであれば、 `envs/stg/security_group.tf` に作成したいセキュリティグループを記述します。</p>

<p>これで stg だけ反映という実運用をカバーできます。</p>

<p>また、負荷試験環境 ( `loadtst` ) という環境を用意したい場合は、以下の様にコピーし、変数を修正すれば良いです。</p>

<ul>
<li>`envs/prd` → `envs/loadtst`</li>
<li>`modules/prd` → `modules/loadtst`</li>
</ul>


<p>多少構成に変更があろうとも、 loadtst 関連のリソースが prd, stg に影響することはない様に作成できます。</p>

### terraform コーディングルール

<p>以下のような workspace の切り替えを利用したコードを利用しないことです。</p>

<pre class="code" data-lang="" data-unlink>lookup(var.ips, &#34;${terraform.workspace}.cidrs&#34;)</pre>




<pre class="code" data-lang="" data-unlink>&#34;${terraform.workspace == &#34;stg&#34; ? hoge: moge}&#34;</pre>


<p>また、以下も NG とします。 stg だけ異なるのであれば、 modules/stg,prd と分けるべきです。</p>

<pre class="code" data-lang="" data-unlink>&#34;${var.env == &#34;stg&#34; ? hoge: moge}&#34;</pre>


## terraform 実行手順

<p>stg, prd 各環境構築は `envs/stg`, `envs/prd` ディレクトリに移動し、 以下実行します。</p>

<pre class="code" data-lang="" data-unlink>terraform init
terraform get -update
terraform plan
terraform apply</pre>


## AWS credentials の扱い

<p>stg, prd で同じ AWS Account を利用する場合、プロジェクトの root に direnv 等、 .envrc を置いて、運用するのが良いと思います。</p>

<p>stg, prd で異なる AWS Account を利用する場合、 `envs/(stg,prd)` 以下に .envrc をそれぞれ配置し、上記 `terraform 実行手順` を実行すれば良いです。</p>

## プロジェクト毎の terraform バージョンの違いの対応

<p>tfenv で対応します。</p>

<pre class="code" data-lang="" data-unlink>macOS%$ brew install tfenv</pre>


<p>以前の執筆記事では terraform を one-off container で実行しバージョン差異を吸収する様にしていましたが、コマンドが長くなり、管理も煩雑になるので、tfenv が望ましいです。</p>

<p>こちらも運用してみての実感です。</p>

## その他

<p>これはしといた方がオススメ？レベルですが、 provider で バージョン固定外した方が良かったです。</p>

<pre class="code" data-lang="" data-unlink>provider aws {
  version = &#34;1.54.0&#34;
  region  = &#34;ap-northeast-1&#34;
}</pre>


<p>固定されていて、最新のリソースが利用できない時があります。<a href="#f-89d57f2f" name="fn-89d57f2f" title="Aurora MySQL が作れない！と思ったら、バージョン固定してた為だったことがありました。">*2</a></p>

<p>その時は、バージョン固定でなく、アップデートしていく方向で修正した方が、最新に追従できます。</p>

## 総評

<p>実運用をしてみて、 workspace はやめておいた方がいいかなと感じたことをまとめました。</p>

<p>勿論、 workspace の良さを知り尽くしてないからこういう意見になっているとも思いますので、一概に否定する意図はありません。</p>

<p>リポジトリの整理がついたら現段階で公開できるところをしていこうと思います！</p>

<p>以上
Terraform 運用されてる方の知見になりましたら幸いです。</p>

<p><div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/4873117968/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/51YYyQ6-t6L._SL160_.jpg" class="hatena-asin-detail-image" alt="Infrastructure as Code ―クラウドにおけるサーバ管理の原則とプラクティス" title="Infrastructure as Code ―クラウドにおけるサーバ管理の原則とプラクティス"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/4873117968/kenzo0107-22/">Infrastructure as Code ―クラウドにおけるサーバ管理の原則とプラクティス</a></p><ul><li><span class="hatena-asin-detail-label">作者:</span> Kief Morris,宮下剛輔,長尾高弘</li><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> オライリージャパン</li><li><span class="hatena-asin-detail-label">発売日:</span> 2017/03/18</li><li><span class="hatena-asin-detail-label">メディア:</span> 単行本（ソフトカバー）</li><li><a href="https://d.hatena.ne.jp/asin/4873117968/kenzo0107-22" target="_blank">この商品を含むブログ (2件) を見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div></p>
<div class="footnote">
<p class="footnote"><a href="#fn-5cda4c55" name="f-5cda4c55" class="footnote-number">*1</a><span class="footnote-delimiter">:</span><span class="footnote-text">ECS + RDS + Redis 構成で CodePipeline からデプロイするサンプル terraform です。</span></p>
<p class="footnote"><a href="#fn-89d57f2f" name="f-89d57f2f" class="footnote-number">*2</a><span class="footnote-delimiter">:</span><span class="footnote-text">Aurora MySQL が作れない！と思ったら、バージョン固定してた為だったことがありました。</span></p>
</div>
