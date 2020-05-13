---
layout: post
title: Rails に reCAPTCHA v3 導入して bot 対策
date: 2019-02-17
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190216/20190216210737.png
tags:
- Ruby
- reCAPTCHA
- Rails
---

## 概要

Rails で構築した Webサービスで bot 攻撃を定期的に受けた為、問い合わせフォームに reCAPTCHA v3 を導入しました。

## 何故 v2 でなく、reCAPTCHA v3 ?

<!-- more -->

v2 は `I'm not a robot` チェックボックスにチェックを入れた後に画像選択させる仕様があります。

例えば、看板が写ってるのはどれ？と選ばせる問いが出てきた場合、<br/>
「どこまでが看板としたらいいの？」と心理的負担も高く、ユーザが離脱する可能性もあります。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190216/20190216210737.png" width="100%">
</div>

## v3 だと嬉しいことは何？

<p>v3 <a href="#f-6cff6d12" name="fn-6cff6d12" title="2019年2月現在最新バージョン">*1</a> は設置したページのユーザ行動をスコア化し bot か判断します。</p>

<p>アクセスが増えるとより精度が高まってくる、という仕様です。</p>

<p>非 bot ユーザへの負担は全くなく、 bot を遮断できる様になるという、世の中進んでるなぁ感満載です。</p>

{% linkPreview https://gigazine.net/news/20190218-how-recaptcha-judge-human/ _blank %}

## gem ある？

今回 gem は使用しませんでした。

というのも、 以下理由からでした。

<ul>
<li>`gem 'recaptcha'` が v3 非対応。</li>
<li>`gem 'new_google_recaptcha'` は v3 対応してますが、スコアが返ってこないのでテストし辛い。</li>
</ul>


その他に既にあるのかもわかりませんが、記事執筆時には探し出すことはできませんでした。

### まず reCAPTCHA v3 発行

以下 reCAPTCHA コンソールにアクセスし発行してください。

<a href="https://g.co/recaptcha/v3">https://g.co/recaptcha/v3</a>

<p>v3 を選択し、今回導入するドメインを登録します。<a href="#f-a2800b5a" name="fn-a2800b5a" title="ドメインは複数登録可能です。ドメイン毎に集計や、 bot 対策の傾向を変えたい場合は、個々に発行します。 また、 RAILS_ENV = production とそれ以外で発行する方が本番への影響がないので推奨されます。">*2</a></p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190216/20190216214351.png" width="100%">
</div>

<p>発行されたサイトキー・シークレットキーを保存しておきます。</p>

* サイトキー
  - ユーザがサイトにアクセスした際にトークンを取得する際に必要なキーです。こちらはユーザ公開して問題ありません。
* シークレットキー
  - トークンを元に Google に問い合わせする際に必要なキーです。こちらは秘密情報として扱います。


<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190216/20190216214558.png" width="100%">
</div>

## Rails 側実装

<p>Rails >= 5.2 を想定しています。</p>

#### config/credentials.yml.enc

<pre class="code lang-ruby" data-lang="ruby" data-unlink>recaptcha:
  <span class="synConstant">secret_key</span>: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
</pre>


<p>シークレットを秘密情報に保存します。</p>

#### app/controllers/application_controller.rb

<pre class="code lang-ruby" data-lang="ruby" data-unlink><span class="synPreProc">require</span> <span class="synSpecial">'</span><span class="synConstant">net/http</span><span class="synSpecial">'</span>
<span class="synPreProc">require</span> <span class="synSpecial">'</span><span class="synConstant">uri</span><span class="synSpecial">'</span>

<span class="synPreProc">class</span> <span class="synType">ApplicationController</span> &lt; <span class="synType">ActionController</span>::<span class="synType">Base</span>
...
  <span class="synType">RECAPTCHA_MINIMUM_SCORE</span> = <span class="synConstant">0.5</span>
  <span class="synType">RECAPTCHA_ACTION</span> = <span class="synSpecial">'</span><span class="synConstant">homepage</span><span class="synSpecial">'</span>
...
  <span class="synPreProc">def</span> <span class="synIdentifier">verify_recaptcha?</span>(token)
    secret_key = <span class="synType">Rails</span>.application.credentials.recaptcha[<span class="synConstant">:secret_key</span>]
    uri = <span class="synType">URI</span>.parse(<span class="synSpecial">&quot;</span><span class="synConstant">https://www.google.com/recaptcha/api/siteverify?secret=</span><span class="synSpecial">#{</span>secret_key<span class="synSpecial">}</span><span class="synConstant">&response=</span><span class="synSpecial">#{</span>token<span class="synSpecial">}&quot;</span>)
    r = <span class="synType">Net</span>::<span class="synType">HTTP</span>.get_response(uri)
    j = <span class="synType">JSON</span>.parse(r.body)
    j[<span class="synSpecial">'</span><span class="synConstant">success</span><span class="synSpecial">'</span>] && j[<span class="synSpecial">'</span><span class="synConstant">score</span><span class="synSpecial">'</span>] &gt; <span class="synType">RECAPTCHA_MINIMUM_SCORE</span> && j[<span class="synSpecial">'</span><span class="synConstant">action</span><span class="synSpecial">'</span>] == <span class="synType">RECAPTCHA_ACTION</span>
  <span class="synPreProc">end</span>
<span class="synPreProc">end</span>
</pre>


<p>共通メソッドとして、recaptcha の認証メソッド `verify_recaptcha?` を設定しています。</p>

<p>ここで、bot となるスコアを 0.5 以下としています。</p>

<p>通常通り操作していれば、十分超える数値です。</p>

#### config/locales/en.yml

<pre class="code" data-lang="" data-unlink>en:
  recaptcha:
    errors:
      verification_failed: 'reCAPTCHA Authorization Failed. Please try again later.'</pre>


<p>local en 設定です。</p>

#### config/locales/ja.yml

<pre class="code" data-lang="" data-unlink>ja:
  recaptcha:
    errors:
      verification_failed: 'reCAPTCHA 認証失敗しました。しばらくしてからもう一度お試しください。'</pre>


<p>local ja 設定です。</p>

#### app/controllers/hoges_controller.rb

<pre class="code lang-ruby" data-lang="ruby" data-unlink><span class="synPreProc">class</span> <span class="synType">HogesController</span> &lt; <span class="synType">ApplicationController</span>
  <span class="synPreProc">def</span> <span class="synIdentifier">new</span>; <span class="synPreProc">end</span>

  <span class="synPreProc">def</span> <span class="synIdentifier">create</span>
    <span class="synStatement">unless</span> verify_recaptcha?(params[<span class="synConstant">:recaptcha_token</span>])
      flash.now[<span class="synConstant">:recaptcha_error</span>] = <span class="synType">I18n</span>.t(<span class="synSpecial">'</span><span class="synConstant">recaptcha.errors.verification_failed</span><span class="synSpecial">'</span>)
      <span class="synStatement">return</span> render <span class="synConstant">action</span>: <span class="synConstant">:new</span>
    <span class="synStatement">end</span>

    <span class="synComment"># something to do</span>

    redirect_to hoge_finish_path
  <span class="synPreProc">end</span>

  <span class="synPreProc">def</span> <span class="synIdentifier">finish</span>; <span class="synPreProc">end</span>
<span class="synPreProc">end</span>
</pre>


<p>new から create に post して reCAPTCHA で bot 判定して</p>

<ul>
<li>OK → finish へ進む</li>
<li>NG → new に戻る</li>
</ul>


<p>という設計です。</p>

#### app/views/hoges/new.html.erb

<pre class="code lang-html" data-lang="html" data-unlink><span class="synIdentifier">&lt;% if flash[:recaptcha_error] %&gt;</span>
<span class="synIdentifier">&lt;</span><span class="synStatement">div</span><span class="synIdentifier"> </span><span class="synType">class</span><span class="synIdentifier">=</span><span class="synConstant">&quot;text&quot;</span><span class="synIdentifier">&gt;</span>
  <span class="synIdentifier">&lt;</span><span class="synStatement">p</span><span class="synIdentifier">&gt;&lt;</span>spacn<span class="synIdentifier"> </span><span class="synType">class</span><span class="synIdentifier">=</span><span class="synConstant">&quot;error&quot;</span><span class="synIdentifier">&gt;&lt;%=</span><span class="synConstant"> flash[:recaptcha_error]</span><span class="synIdentifier"> %&gt;&lt;/</span><span class="synStatement">span</span><span class="synIdentifier">&gt;&lt;/</span><span class="synStatement">p</span><span class="synIdentifier">&gt;</span>
<span class="synIdentifier">&lt;/</span><span class="synStatement">div</span><span class="synIdentifier">&gt;</span>
<span class="synIdentifier">&lt;% end %&gt;</span>

<span class="synIdentifier">&lt;%=</span><span class="synConstant"> form_tag({action:</span><span class="synIdentifier"> :create}, {</span><span class="synType">method</span><span class="synIdentifier">: :post}) do %&gt;</span>
...
  <span class="synIdentifier">&lt;</span><span class="synStatement">input</span><span class="synIdentifier"> </span><span class="synType">id</span><span class="synIdentifier">=</span><span class="synConstant">&quot;recaptcha_token&quot;</span><span class="synIdentifier"> </span><span class="synType">name</span><span class="synIdentifier">=</span><span class="synConstant">&quot;recaptcha_token&quot;</span><span class="synIdentifier"> </span><span class="synType">type</span><span class="synIdentifier">=</span><span class="synConstant">&quot;hidden&quot;</span><span class="synIdentifier">/&gt;</span>
  <span class="synIdentifier">&lt;%=</span><span class="synConstant"> submit_tag</span><span class="synIdentifier"> </span><span class="synConstant">&quot;送信する&quot;</span><span class="synIdentifier">, :</span><span class="synType">class</span><span class="synIdentifier"> =&gt;</span> &quot;submit-recaptcha btn&quot;, :disabled =<span class="synError">&gt;</span> true %<span class="synError">&gt;</span>
<span class="synIdentifier">&lt;% end %&gt;</span>

<span class="synIdentifier">&lt;</span><span class="synStatement">script</span><span class="synIdentifier"> </span><span class="synType">src</span><span class="synIdentifier">=</span><span class="synConstant">&quot;https://www.google.com/recaptcha/api.js?render=&lt;%= Settings.recaptcha.site_key %&gt;&ver=3.0&quot;</span><span class="synIdentifier">&gt;&lt;/</span><span class="synStatement">script</span><span class="synIdentifier">&gt;</span>
<span class="synIdentifier">&lt;</span><span class="synStatement">script</span><span class="synIdentifier">&gt;</span>
<span class="synSpecial">grecaptcha.ready</span>(<span class="synIdentifier">function</span>()<span class="synSpecial"> </span><span class="synIdentifier">{</span>
<span class="synSpecial">  grecaptcha.execute</span>(<span class="synConstant">'&lt;%= Settings.recaptcha.site_key %&gt;'</span><span class="synSpecial">, </span><span class="synIdentifier">{</span><span class="synSpecial">action: </span><span class="synConstant">'homepage'</span><span class="synIdentifier">}</span>)<span class="synSpecial">.then</span>(<span class="synIdentifier">function</span>(<span class="synSpecial">token</span>)<span class="synSpecial"> </span><span class="synIdentifier">{</span>
<span class="synSpecial">    $</span>(<span class="synConstant">'#recaptcha_token'</span>)<span class="synSpecial">.val</span>(<span class="synSpecial">token</span>)<span class="synSpecial">;</span>
<span class="synSpecial">    $</span>(<span class="synConstant">'.submit-recaptcha'</span>)<span class="synSpecial">.prop</span>(<span class="synConstant">'disabled'</span><span class="synSpecial">, </span><span class="synConstant">false</span>)<span class="synSpecial">;</span>
<span class="synSpecial">  </span><span class="synIdentifier">}</span>)<span class="synSpecial">;</span>
<span class="synIdentifier">}</span>)<span class="synSpecial">;</span>
<span class="synIdentifier">&lt;/</span><span class="synStatement">script</span><span class="synIdentifier">&gt;</span>
</pre>


##### エラーメッセージ表示

<pre class="code lang-html" data-lang="html" data-unlink><span class="synIdentifier">&lt;% if flash[:recaptcha_error] %&gt;</span>
<span class="synIdentifier">&lt;</span><span class="synStatement">div</span><span class="synIdentifier"> </span><span class="synType">class</span><span class="synIdentifier">=</span><span class="synConstant">&quot;text&quot;</span><span class="synIdentifier">&gt;</span>
  <span class="synIdentifier">&lt;</span><span class="synStatement">p</span><span class="synIdentifier">&gt;&lt;</span>spacn<span class="synIdentifier"> </span><span class="synType">class</span><span class="synIdentifier">=</span><span class="synConstant">&quot;error&quot;</span><span class="synIdentifier">&gt;&lt;%=</span><span class="synConstant"> flash[:recaptcha_error]</span><span class="synIdentifier"> %&gt;&lt;/</span><span class="synStatement">span</span><span class="synIdentifier">&gt;&lt;/</span><span class="synStatement">p</span><span class="synIdentifier">&gt;</span>
<span class="synIdentifier">&lt;/</span><span class="synStatement">div</span><span class="synIdentifier">&gt;</span>
<span class="synIdentifier">&lt;% end %&gt;</span>
</pre>


##### `&lt;form&gt; ~ &lt;/form&gt;` 内に以下 `name=recaptcha_token` input タグを追加します。

<pre class="code" data-lang="" data-unlink>&lt;input id=&#34;recaptcha_token&#34; name=&#34;recaptcha_token&#34; type=&#34;hidden&#34;/&gt;</pre>


##### ページアクセス時に reCAPTCHA の token を取得すべく、スクリプトを仕込みます。

<pre class="code lang-html" data-lang="html" data-unlink><span class="synIdentifier">&lt;</span><span class="synStatement">script</span><span class="synIdentifier"> </span><span class="synType">src</span><span class="synIdentifier">=</span><span class="synConstant">&quot;https://www.google.com/recaptcha/api.js?render=&lt;%= Settings.recaptcha.site_key %&gt;&ver=3.0&quot;</span><span class="synIdentifier">&gt;&lt;/</span><span class="synStatement">script</span><span class="synIdentifier">&gt;</span>
<span class="synIdentifier">&lt;</span><span class="synStatement">script</span><span class="synIdentifier">&gt;</span>
<span class="synSpecial">grecaptcha.ready</span>(<span class="synIdentifier">function</span>()<span class="synSpecial"> </span><span class="synIdentifier">{</span>
<span class="synSpecial">  grecaptcha.execute</span>(<span class="synConstant">'&lt;%= Settings.recaptcha.site_key %&gt;'</span><span class="synSpecial">, </span><span class="synIdentifier">{</span><span class="synSpecial">action: </span><span class="synConstant">'homepage'</span><span class="synIdentifier">}</span>)<span class="synSpecial">.then</span>(<span class="synIdentifier">function</span>(<span class="synSpecial">token</span>)<span class="synSpecial"> </span><span class="synIdentifier">{</span>
<span class="synSpecial">    $</span>(<span class="synConstant">'#recaptcha_token'</span>)<span class="synSpecial">.val</span>(<span class="synSpecial">token</span>)<span class="synSpecial">;</span>
<span class="synSpecial">    $</span>(<span class="synConstant">'.submit-recaptcha'</span>)<span class="synSpecial">.prop</span>(<span class="synConstant">'disabled'</span><span class="synSpecial">, </span><span class="synConstant">false</span>)<span class="synSpecial">;</span>
<span class="synSpecial">  </span><span class="synIdentifier">}</span>)<span class="synSpecial">;</span>
<span class="synIdentifier">}</span>)<span class="synSpecial">;</span>
<span class="synIdentifier">&lt;/</span><span class="synStatement">script</span><span class="synIdentifier">&gt;</span>
</pre>


<p>reCAPTCHA トークン取得が成功した場合に以下実行します。</p>

<ul>
<li>id="recaptcha_token" input タグの value に トークンを設定</li>
<li>submit ボタンの有効化</li>
</ul>


<p>`&lt;%= Settings.recaptcha.site_key %&gt;` について<br/>
`gem 'settingslogic'` をインストールしている前提で設定しています。</p>

<p>導入していない場合は、簡易的に処理を試す程度であれば、 `&lt;%= Settings.recaptcha.site_key %&gt;` を取得したサイトキーに置き換えて下さい。<a href="#f-b2bcad45" name="fn-b2bcad45" title="前にもお伝えしましたが、サイトキーの管理は直指定でなく、何かしら管理が推奨です。">*3</a></p>

<p>以上で設定は完了です。</p>

## ページにアクセスしてみる

<p>ページ右下に reCAPTCHA マークが常に表示される様になります。</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190216/20190216234742.png" width="100%">
</div>

## 集計情報を見る

<p>reCAPTCHA コンソールを見ると、以下の様な表示が出ていてすぐには集計情報が反映されていないと思います。</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190216/20190216235044.png" width="100%">
</div>

<p>しばらく経つと以下の様なグラフが表示される様になります。</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190216/20190216235204.png" width="100%">
</div>

## 注意

<p>例えば、社内 IP 等固定された IP からテストで頻繁にアクセスすると、 bot 扱いされます。</p>

<p>reCAPTCHA 側で IP のホワイトリストはないので、その場合、 Rails 側で許可 IP リストを作る必要があります。</p>

<p>以上<br/>
参考になれば幸いです。</p>
<div class="footnote">
<p class="footnote"><a href="#fn-6cff6d12" name="f-6cff6d12" class="footnote-number">*1</a><span class="footnote-delimiter">:</span><span class="footnote-text">2019年2月現在最新バージョン</span></p>
<p class="footnote"><a href="#fn-a2800b5a" name="f-a2800b5a" class="footnote-number">*2</a><span class="footnote-delimiter">:</span><span class="footnote-text">ドメインは複数登録可能です。ドメイン毎に集計や、 bot 対策の傾向を変えたい場合は、個々に発行します。 また、 RAILS_ENV = production とそれ以外で発行する方が本番への影響がないので推奨されます。</span></p>
<p class="footnote"><a href="#fn-b2bcad45" name="f-b2bcad45" class="footnote-number">*3</a><span class="footnote-delimiter">:</span><span class="footnote-text">前にもお伝えしましたが、サイトキーの管理は直指定でなく、何かしら管理が推奨です。</span></p>
</div>
