---
layout: post
title: Adding reCAPTCHA v3 to Rails for Bot Protection
date: 2019-02-17
lang: en
translation_id: rails-recaptcha-v3-bot
permalink: en/2019/02/17/rails-recaptcha-v3-bot/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190216/20190216210737.png
tags:
  - Ruby
  - reCAPTCHA
  - Rails
---

## Overview

A web service I built with Rails was being hit by bot attacks on a regular basis, so I added reCAPTCHA v3 to the contact form.

## Why reCAPTCHA v3 and not v2?

<!-- more -->

With v2, after you tick the `I'm not a robot` checkbox, there is a step that makes you pick images.

For example, if you are asked "Which of these show a billboard?", the psychological burden is high ("How much of it counts as the billboard?"), and there is a chance the user will abandon the form.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190216/20190216210737.png" width="100%">
</div>

## What's nice about v3?

v3 <a href="#f-6cff6d12" name="fn-6cff6d12" title="2019年2月現在最新バージョン">\*1</a> scores user behavior on the page where it is installed and decides whether the visitor is a bot.

The more traffic it gets, the more accurate it becomes.

<p>It places no burden at all on legitimate (non-bot) users while still blocking bots — it really makes you feel how far the world has come.</p>

{% linkPreview https://gigazine.net/news/20190218-how-recaptcha-judge-human/ _blank %}

## Is there a gem?

I didn't use a gem this time.

The reasons were as follows:

- `gem 'recaptcha'` does not support v3.
- `gem 'new_google_recaptcha'` does support v3, but it doesn't return the score, which makes it hard to test.

There may be others out there, but I couldn't find one at the time of writing.

### First, issue a reCAPTCHA v3 key

Go to the reCAPTCHA console below and issue a key.

[https://g.co/recaptcha/v3](https://g.co/recaptcha/v3)

Select v3 and register the domain you are introducing it to.<a href="#f-a2800b5a" name="fn-a2800b5a" title="ドメインは複数登録可能です。ドメイン毎に集計や、 bot 対策の傾向を変えたい場合は、個々に発行します。 また、 RAILS_ENV = production とそれ以外で発行する方が本番への影響がないので推奨されます。">\*2</a>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190216/20190216214351.png" width="100%">
</div>

<p>Save the issued site key and secret key.</p>

- Site key
  - The key needed to obtain a token when a user accesses the site. It is fine to expose this to the public.
- Secret key
  - The key needed when querying Google based on the token. Treat this as confidential information.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190216/20190216214558.png" width="100%">
</div>

## Implementation on the Rails side

<p>This assumes Rails >= 5.2.</p>

#### config/credentials.yml.enc

<pre class="code lang-ruby" data-lang="ruby" data-unlink>recaptcha:
  <span class="synConstant">secret_key</span>: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
</pre>

<p>Store the secret in your confidential credentials.</p>

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

<p>As a shared method, I define the recaptcha authentication method `verify_recaptcha?`.</p>

<p>Here, a score of 0.5 or below is treated as a bot.</p>

<p>If you operate the page normally, you'll easily exceed that value.</p>

#### config/locales/en.yml

<pre class="code" data-lang="" data-unlink>en:
  recaptcha:
    errors:
      verification_failed: 'reCAPTCHA Authorization Failed. Please try again later.'</pre>

<p>This is the locale `en` configuration.</p>

#### config/locales/ja.yml

<pre class="code" data-lang="" data-unlink>ja:
  recaptcha:
    errors:
      verification_failed: 'reCAPTCHA 認証失敗しました。しばらくしてからもう一度お試しください。'</pre>

<p>This is the locale `ja` configuration.</p>

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

<p>The flow posts from new to create, runs the bot check via reCAPTCHA, and then</p>

<ul>
<li>OK → proceed to finish</li>
<li>NG → return to new</li>
</ul>

<p>is the design.</p>

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

##### Displaying the error message

<pre class="code lang-html" data-lang="html" data-unlink><span class="synIdentifier">&lt;% if flash[:recaptcha_error] %&gt;</span>
<span class="synIdentifier">&lt;</span><span class="synStatement">div</span><span class="synIdentifier"> </span><span class="synType">class</span><span class="synIdentifier">=</span><span class="synConstant">&quot;text&quot;</span><span class="synIdentifier">&gt;</span>
  <span class="synIdentifier">&lt;</span><span class="synStatement">p</span><span class="synIdentifier">&gt;&lt;</span>spacn<span class="synIdentifier"> </span><span class="synType">class</span><span class="synIdentifier">=</span><span class="synConstant">&quot;error&quot;</span><span class="synIdentifier">&gt;&lt;%=</span><span class="synConstant"> flash[:recaptcha_error]</span><span class="synIdentifier"> %&gt;&lt;/</span><span class="synStatement">span</span><span class="synIdentifier">&gt;&lt;/</span><span class="synStatement">p</span><span class="synIdentifier">&gt;</span>
<span class="synIdentifier">&lt;/</span><span class="synStatement">div</span><span class="synIdentifier">&gt;</span>
<span class="synIdentifier">&lt;% end %&gt;</span>
</pre>

##### Add the following `name=recaptcha_token` input tag inside `&lt;form&gt; ~ &lt;/form&gt;`.

<pre class="code" data-lang="" data-unlink>&lt;input id=&#34;recaptcha_token&#34; name=&#34;recaptcha_token&#34; type=&#34;hidden&#34;/&gt;</pre>

##### Embed a script to obtain the reCAPTCHA token on page access.

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

<p>When the reCAPTCHA token is obtained successfully, the following are executed.</p>

<ul>
<li>Set the token as the value of the id="recaptcha_token" input tag</li>
<li>Enable the submit button</li>
</ul>

<p>Regarding `&lt;%= Settings.recaptcha.site_key %&gt;`<br/>
this is configured on the assumption that `gem 'settingslogic'` is installed.</p>

<p>If you haven't installed it, and you just want to try out the process quickly, replace `&lt;%= Settings.recaptcha.site_key %&gt;` with the site key you obtained.<a href="#f-b2bcad45" name="fn-b2bcad45" title="前にもお伝えしましたが、サイトキーの管理は直指定でなく、何かしら管理が推奨です。">*3</a></p>

<p>That completes the setup.</p>

## Try accessing the page

<p>The reCAPTCHA badge will now always be displayed in the bottom-right corner of the page.</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190216/20190216234742.png" width="100%">
</div>

## Viewing the aggregated information

<p>When you look at the reCAPTCHA console, you'll probably see a display like the one below, with the aggregated information not yet reflected.</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190216/20190216235044.png" width="100%">
</div>

<p>After a while, a graph like the following will start to be displayed.</p>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190216/20190216235204.png" width="100%">
</div>

## Caveat

<p>For example, if you access the site frequently for testing from a fixed IP such as an internal corporate IP, you'll be treated as a bot.</p>

<p>There is no IP whitelist on the reCAPTCHA side, so in that case you'll need to build an allowed-IP list on the Rails side.</p>

<p>That's all.<br/>
I hope you find it helpful.</p>
<div class="footnote">
<p class="footnote"><a href="#fn-6cff6d12" name="f-6cff6d12" class="footnote-number">*1</a><span class="footnote-delimiter">:</span><span class="footnote-text">The latest version as of February 2019</span></p>
<p class="footnote"><a href="#fn-a2800b5a" name="f-a2800b5a" class="footnote-number">*2</a><span class="footnote-delimiter">:</span><span class="footnote-text">You can register multiple domains. If you want to change the aggregation or bot-prevention behavior per domain, issue keys individually. Also, issuing separate keys for RAILS_ENV = production and the rest is recommended since it avoids impacting production.</span></p>
<p class="footnote"><a href="#fn-b2bcad45" name="f-b2bcad45" class="footnote-number">*3</a><span class="footnote-delimiter">:</span><span class="footnote-text">As mentioned earlier, managing the site key through some mechanism rather than specifying it directly is recommended.</span></p>
</div>
