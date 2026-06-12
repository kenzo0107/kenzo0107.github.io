---
layout: post
title: 'Terraform Operational Best Practices 2019 ~Things Like Ditching workspace and More~'
date: 2019-04-17
lang: en
translation_id: terraform-2019-workspace
permalink: en/2019/04/17/terraform-2019-workspace/
category: Terraform
tags:
  - Terraform
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190417/20190417103456.png
---

<span style="color: #ff0000"><b>2020-05-05 Update</b></span> I have published an updated set of best practices for spring 2020.

{% linkPreview https://kenzo0107.github.io/2020/04/25/2020-04-25-terraform-bestpractice-2020/ _blank %}

---

I previously wrote about how to manage tfstate per workspace with terraform, but there were several problems in actual operation.

<p>In conclusion, I have now stopped using workspace-based operations.</p>

{% linkPreview https://kenzo0107.github.io/2017/12/05/2017-12-05-terraform-workspace-tfsate/ _blank %}

## Example of workspace-based operation

<p>First, let me show an actual example of operation.</p>

<p>I'm sure there are people who say "I do it in a much smarter way!", but for now let me introduce a common case.</p>

<!-- more -->

### Example) Creating a security group

<p>Let's say we want to create a security group that satisfies the following requirements.</p>

#### Requirements

<ul>
<li>In stg, access is allowed only from the in-office Wifi IP</li>
<li>In prd, access is allowed without IP restrictions</li>
</ul>

#### Sample code

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

<p>Before actually running terraform plan/apply, you first need to
define a terraform workspace.</p>

<pre class="code" data-lang="" data-unlink>terraform workspace new stg // This errors out if it has already been created.
terraform workspace select stg

// Manages the tfstate for terraform workspace = stg in local memory.
terraform init </pre>

<p>Only after the processing above can `stg.cidrs` and `prd.cidrs` of `variable "ips"` finally be used.</p>

<p>When I tried to operate this way, I ran into the following kinds of problems.</p>

## It doesn't fit well with real-world operations

<p>How should you operate when <span style="color: #d32f2f"><b>you want to apply changes only to staging</b></span>?</p>

<p>What happens if you configure settings for staging and production, the pull request is approved, and the sample code gets merged into master?</p>

<p><b>It looks like it would be fine to deploy to production too.</b></p>

<p>No, on the contrary, if it hasn't been applied, it would be confusing.</p>

<p>After that, when you have code you want to apply to production by merging it into master, even if you say "I don't want the sample code part applied!", it gets applied anyway.</p>

<p>On the other hand, inserting code like the following into multiple resources increases the number of unnecessary steps and consumes mental bandwidth. It's also painful to review.</p>

<pre class="code" data-lang="" data-unlink>count = &#34;${terraform.workspace == &#34;stg&#34; ? 1: 0}&#34;</pre>

<p>Well then, you might say "just don't configure the production one!", but if you don't configure it, the production side starts throwing errors, and you become unable to apply anything else at all.</p>

<p><b>This happens because both staging and production reference the same file.</b></p>

<p>Also, when using workspace, there were problems like the following.</p>

## When you want to add a new workspace other than stg and prd

<p>What about when you get the following requests?</p>

<ul>
<li>"Please prepare an environment identical to production for load testing."</li>
<li>"I want to do an integration test with an external API, so I'd like you to spin up a separate environment!"</li>
</ul>

<p>For example, if you try to prepare a load testing environment and create a workspace called loadtst, you need to modify variables.tf as follows.</p>

<pre class="code" data-lang="" data-unlink>variable &#34;ips&#34; {
  type = &#34;map&#34;
  default = {
    loadtst.cidrs = &#34;12.145.67.89/32,22.145.67.89/32&#34; // added
    stg.cidrs     = &#34;12.145.67.89/32,22.145.67.89/32&#34;
    prod.cidrs    = &#34;0.0.0.0/0&#34;
  }
}</pre>

<p>In the example above, you only need to add one line to variable "ips", but in reality
you need to add code like `loadtst.*** = ***` to every single variable.</p>

<p>Each time a workspace is added, the number of steps grows and the file becomes harder to follow.</p>

<p>Also, when you have code like the following, it likewise consumes mental bandwidth and wears you down.</p>

<pre class="code" data-lang="" data-unlink>lookup(var.ips, &#34;${terraform.workspace}.cidrs&#34;)</pre>

<pre class="code" data-lang="" data-unlink>&#34;${terraform.workspace == &#34;stg&#34; ? hoge: moge}&#34;</pre>

## Summarizing workspace-based operation

<p>Because <b>workspace usage assumes operation by sharing resources across multiple environments</b>, there was degraded readability and a divergence from real-world operation.</p>

<ol>
<li><p>When adding a new workspace, you have to add it to every variable map.<br/>
→ The code becomes harder to follow.<br/>
→ The difficulty of building a new environment increases.</p></li>
<li><p>Real-world operation is difficult when you want to apply to staging only.<br/>
→ Because both staging and production reference the same file, you end up needing to branch the logic within the file with "what if it's staging?".</p></li>
<li><p>It's hard to tell which workspace you're currently in, so you hesitate quite a bit when running terraform apply.<br/>
→ Even if you actually check the workspace with `terraform workspace show` before running `terraform apply`, after a little time passes during execution, you get anxious thinking "wait, which one was it again?", and there were times I had to scroll back through the Terminal to check.</p></li>
</ol>

## So what's the better approach?

<p>Thoroughly abandon workspace.</p>

<p>= <b>Let's go with a DRY design!</b></p>

<p>That's the bottom line.</p>

<p>Here is a summary of what I actually did.</p>

### I structured the directory layout as follows.

<p>modules/common ... Place resources that are created with the same configuration commonly across both stg and prd environments.</p>

<p>modules/stg,prd ... Place resources whose configurations differ individually.<a href="#f-5cda4c55" name="fn-5cda4c55" title="ECS + RDS + Redis 構成で CodePipeline からデプロイするサンプル terraform です。">*1</a></p>

<pre class="code" data-lang="" data-unlink>.
├── README.md
├──envs/
│   ├── prd
│   │   ├── backend.tf
│   │   ├── main.tf
│   │   ├── provider.tf
│   │   ├── region.tf
│   │   ├── templates
│   │   │   └── user-data.tpl
│   │   └── variable.tf
│   └──stg/
│       ├── backend.tf
│       ├── main.tf
│       ├── provider.tf
│       ├── region.tf
│       ├── templates
│       │   └── user-data.tpl
│       └── variable.tf
│
└──modules
    ├── common
    │   ├── bastion.tf
    │   ├── bucket_logs.tf
    │   ├── bucket_static.tf
    │   ├── certificate.tf
    │   ├── cloudfront.tf
    │   ├── cloudwatch.tf
    │   ├── codebuild.tf
    │   ├── codepipeline.tf
    │   ├── network.tf
    │   ├── output.tf
    │   ├── rds.tf
    │   ├── redis.tf
    │   ├── security_group.tf
    │   └── variable.tf
    ├── prd
    │   ├── admin.tf
    │   ├── admin_autoscaling_policy.tf
    │   ├── api.tf
    │   ├── app.tf
    │   ├── ecr.tf
    │   ├── iam_ecs.tf
    │   ├── output.tf
    │   ├── variable.tf
    │   └── waf.tf
    └── stg
        ├── admin.tf
        ├── api.tf
        ├── app.tf
        ├── ecr.tf
        ├── iam_ecs.tf
        ├── output.tf
        ├── variable.tf
        └── waf.tf</pre>

### What does it look like using the earlier security group creation as an example

<p>It looks like the following.</p>

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

<p>If it's a security group you want to apply only to stg, write the security group you want to create in `envs/stg/security_group.tf`.</p>

<p>This covers the real-world operation of applying to stg only.</p>

<p>Also, if you want to prepare an environment called the load testing environment ( `loadtst` ), you just copy it as follows and modify the variables.</p>

<ul>
<li>`envs/prd` → `envs/loadtst`</li>
<li>`modules/prd` → `modules/loadtst`</li>
</ul>

<p>Even if there are some configuration changes, you can create it so that loadtst-related resources never affect prd or stg.</p>

### terraform coding rules

<p>The rule is not to use code that relies on workspace switching like the following.</p>

<pre class="code" data-lang="" data-unlink>lookup(var.ips, &#34;${terraform.workspace}.cidrs&#34;)</pre>

<pre class="code" data-lang="" data-unlink>&#34;${terraform.workspace == &#34;stg&#34; ? hoge: moge}&#34;</pre>

<p>The following is also disallowed. If only stg differs, you should split it into modules/stg,prd.</p>

<pre class="code" data-lang="" data-unlink>&#34;${var.env == &#34;stg&#34; ? hoge: moge}&#34;</pre>

## terraform execution procedure

<p>To build each of the stg and prd environments, move into the `envs/stg` or `envs/prd` directory and run the following.</p>

<pre class="code" data-lang="" data-unlink>terraform init
terraform get -update
terraform plan
terraform apply</pre>

## Handling AWS credentials

<p>When using the same AWS Account for stg and prd, I think it's best to place a `.envrc` (e.g. with direnv) at the project root and operate from there.</p>

<p>When using different AWS Accounts for stg and prd, place a `.envrc` under each `envs/(stg,prd)` and run the `terraform execution procedure` above.</p>

## Dealing with differences in terraform versions per project

<p>Handle this with tfenv.</p>

<pre class="code" data-lang="" data-unlink>macOS%$ brew install tfenv</pre>

<p>In my previous article, I ran terraform in a one-off container to absorb version differences, but the commands got long and management became cumbersome, so tfenv is preferable.</p>

<p>This too is my honest impression after operating it.</p>

## Other

<p>This is more of a "it's recommended to do this?" level, but it was better to remove the version pinning on the provider.</p>

<pre class="code" data-lang="" data-unlink>provider aws {
  version = &#34;1.54.0&#34;
  region  = &#34;ap-northeast-1&#34;
}</pre>

<p>When it's pinned, there are times you can't use the latest resources.<a href="#f-89d57f2f" name="fn-89d57f2f" title="Aurora MySQL が作れない！と思ったら、バージョン固定してた為だったことがありました。">*2</a></p>

<p>In that case, instead of pinning the version, it's better to fix it in the direction of keeping it updated, so you can follow the latest.</p>

## Overall assessment

<p>This is a summary of what I felt after actually operating it: that it might be better to avoid workspace.</p>

<p>Of course, I also think this opinion comes from not fully knowing the merits of workspace, so I have no intention of denying it outright.</p>

<p>Once I get the repository organized, I plan to publish what I can at this stage!</p>

<p>That's all.
I hope this becomes useful knowledge for those operating Terraform.</p>

<p><div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/4873117968/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/51YYyQ6-t6L._SL160_.jpg" class="hatena-asin-detail-image" alt="Infrastructure as Code ―クラウドにおけるサーバ管理の原則とプラクティス" title="Infrastructure as Code ―クラウドにおけるサーバ管理の原則とプラクティス"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/4873117968/kenzo0107-22/">Infrastructure as Code ―クラウドにおけるサーバ管理の原則とプラクティス</a></p><ul><li><span class="hatena-asin-detail-label">作者:</span> Kief Morris,宮下剛輔,長尾高弘</li><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> オライリージャパン</li><li><span class="hatena-asin-detail-label">発売日:</span> 2017/03/18</li><li><span class="hatena-asin-detail-label">メディア:</span> 単行本（ソフトカバー）</li><li><a href="https://d.hatena.ne.jp/asin/4873117968/kenzo0107-22" target="_blank">この商品を含むブログ (2件) を見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div></p>
<div class="footnote">
<p class="footnote"><a href="#fn-5cda4c55" name="f-5cda4c55" class="footnote-number">*1</a><span class="footnote-delimiter">:</span><span class="footnote-text">This is a sample terraform that deploys from CodePipeline with an ECS + RDS + Redis configuration.</span></p>
<p class="footnote"><a href="#fn-89d57f2f" name="f-89d57f2f" class="footnote-number">*2</a><span class="footnote-delimiter">:</span><span class="footnote-text">There was a time when I thought "I can't create Aurora MySQL!" only to find it was because the version was pinned.</span></p>
</div>
