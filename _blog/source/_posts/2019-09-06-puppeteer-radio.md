---
layout: post
title: puppeteer で radio ボタンチェック
date: 2019-09-06
tags:
  - Puppeteer
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190906/20190906230848.png
---

## 概要

puppeteer というスクレイピングツールで radio ボタンをチェックする為の備忘録です。

<!-- more -->

## 例題

以下のような radio ボタングループがあるとします。

<pre class="code lang-html" data-lang="html" data-unlink><span class="synIdentifier">&lt;</span><span class="synStatement">input</span><span class="synIdentifier"> </span><span class="synType">type</span><span class="synIdentifier">=</span><span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier"> </span><span class="synType">name</span><span class="synIdentifier">=</span><span class="synConstant">&quot;maker&quot;</span><span class="synIdentifier"> </span><span class="synType">value</span><span class="synIdentifier">=</span><span class="synConstant">&quot;1&quot;</span><span class="synIdentifier">&gt;</span> クリスタル映像
<span class="synIdentifier">&lt;</span><span class="synStatement">input</span><span class="synIdentifier"> </span><span class="synType">type</span><span class="synIdentifier">=</span><span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier"> </span><span class="synType">name</span><span class="synIdentifier">=</span><span class="synConstant">&quot;maker&quot;</span><span class="synIdentifier"> </span><span class="synType">value</span><span class="synIdentifier">=</span><span class="synConstant">&quot;2&quot;</span><span class="synIdentifier">&gt;</span> ポセイドン企画
</pre>

## 答え

<p><b>クリスタル映像</b> を選びたい場合は、以下のようにします。</p>

<p>page.evaluate でブラウザ内での操作結果を返すようにします。<br/>
ブラウザ内なので、 document.querySelector が使えます。<br/>
そこで、 `checked = true` しています。</p>

<pre class="code lang-javascript" data-lang="javascript" data-unlink><span class="synStatement">const</span> selectedRadioSelector = `input<span class="synIdentifier">[</span>type=<span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier">][</span>value=<span class="synConstant">&quot;1&quot;</span><span class="synIdentifier">]</span>`
await page.evaluate(
  s =&gt; (<span class="synStatement">document</span>.querySelector(s).checked = <span class="synConstant">true</span>),
  selectedRadioSelector
)
</pre>

## 失敗例

<p>click 処理は軒並み失敗しました。</p>

<p>`page.WaitFor` すると成功する、という記事を見ましたが、自身の環境 puppeteer (version=1.19.0) では、失敗してしまいました。</p>

<ul>
<li>page.click</li>
</ul>

<pre class="code lang-javascript" data-lang="javascript" data-unlink><span class="synStatement">const</span> selectedRadioSelector = `input<span class="synIdentifier">[</span>type=<span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier">][</span>value=<span class="synConstant">&quot;1&quot;</span><span class="synIdentifier">]</span>`
page.click(selectedRadioSelector)
</pre>

<ul>
<li>radio 要素を捕まえて、click</li>
</ul>

<pre class="code lang-javascript" data-lang="javascript" data-unlink>r = page.$(selectedRadioSelector)
r.click()
</pre>

<ul>
<li>document.querySelector().click()</li>
</ul>

<pre class="code lang-javascript" data-lang="javascript" data-unlink><span class="synStatement">const</span> selectedRadioSelector = `input<span class="synIdentifier">[</span>type=<span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier">][</span>value=<span class="synConstant">&quot;1&quot;</span><span class="synIdentifier">]</span>`
await page.evaluate(
  s =&gt; (<span class="synStatement">document</span>.querySelector(s).click()),
  selectedRadioSelector
)
</pre>

## 応用

<p>以下のような radio ボタングループがあるとします。<br/>
上のと比べると label タグが追加されてます。</p>

<pre class="code lang-html" data-lang="html" data-unlink><span class="synIdentifier">&lt;</span><span class="synStatement">input</span><span class="synIdentifier"> </span><span class="synType">type</span><span class="synIdentifier">=</span><span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier"> </span><span class="synType">id</span><span class="synIdentifier">=</span><span class="synConstant">&quot;group1&quot;</span><span class="synIdentifier"> </span><span class="synType">name</span><span class="synIdentifier">=</span><span class="synConstant">&quot;maker&quot;</span><span class="synIdentifier"> </span><span class="synType">value</span><span class="synIdentifier">=</span><span class="synConstant">&quot;1&quot;</span><span class="synIdentifier">&gt;</span> <span class="synIdentifier">&lt;</span><span class="synStatement">label</span><span class="synIdentifier"> </span><span class="synType">for</span><span class="synIdentifier">=</span><span class="synConstant">&quot;group1&quot;</span><span class="synIdentifier">&gt;</span>クリスタル映像<span class="synIdentifier">&lt;/</span><span class="synStatement">label</span><span class="synIdentifier">&gt;</span>
<span class="synIdentifier">&lt;</span><span class="synStatement">input</span><span class="synIdentifier"> </span><span class="synType">type</span><span class="synIdentifier">=</span><span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier"> </span><span class="synType">id</span><span class="synIdentifier">=</span><span class="synConstant">&quot;group2&quot;</span><span class="synIdentifier"> </span><span class="synType">name</span><span class="synIdentifier">=</span><span class="synConstant">&quot;maker&quot;</span><span class="synIdentifier"> </span><span class="synType">value</span><span class="synIdentifier">=</span><span class="synConstant">&quot;2&quot;</span><span class="synIdentifier">&gt;</span> <span class="synIdentifier">&lt;</span><span class="synStatement">label</span><span class="synIdentifier"> </span><span class="synType">for</span><span class="synIdentifier">=</span><span class="synConstant">&quot;group1&quot;</span><span class="synIdentifier">&gt;</span>ポセイドン企画<span class="synIdentifier">&lt;/</span><span class="synStatement">label</span><span class="synIdentifier">&gt;</span>
</pre>

<p>このラベルを正規表現でマッチする方をチェックしてみます。</p>

<ul>
<li>"映像" という文字を含む方をチェックする</li>
</ul>

<pre class="code lang-javascript" data-lang="javascript" data-unlink><span class="synStatement">const</span> regex = <span class="synConstant">&quot;映像&quot;</span>
<span class="synStatement">const</span> regexpLabel = <span class="synStatement">new</span> <span class="synType">RegExp</span>(regex, <span class="synConstant">'g'</span>)

<span class="synStatement">const</span> r = await page.$$(<span class="synConstant">'input[type=&quot;radio&quot;]'</span>)

label: <span class="synStatement">for</span> (<span class="synStatement">const</span> i <span class="synStatement">in</span> r) <span class="synIdentifier">{</span>
  <span class="synComment">// radio ボタンの id 要素</span>
  <span class="synStatement">const</span> id = await (await r<span class="synIdentifier">[</span>i<span class="synIdentifier">]</span>.getProperty(<span class="synConstant">'id'</span>)).jsonValue()
  <span class="synComment">// radio ボタンの value 要素</span>
  <span class="synStatement">const</span> value = await (await r<span class="synIdentifier">[</span>i<span class="synIdentifier">]</span>.getProperty(<span class="synConstant">'value'</span>)).jsonValue()

  <span class="synComment">// ラベル textContent 取得 (&quot;クリスタル映像&quot;, &quot;ポセイドン企画&quot; を取得)</span>
  <span class="synStatement">const</span> label = await page.$(`label<span class="synIdentifier">[</span><span class="synStatement">for</span>=<span class="synConstant">&quot;${id}&quot;</span><span class="synIdentifier">]</span>`)
  <span class="synStatement">const</span> labelContent = await (await label.getProperty(
    <span class="synConstant">'textContent'</span>
  )).jsonValue()


  <span class="synComment">// ラベルの textContent が &quot;映像&quot; を含む場合、 true</span>
  <span class="synStatement">if</span> (labelContent.match(regexpLabel)) <span class="synIdentifier">{</span>
    <span class="synStatement">const</span> selectedRadioSelector = `input<span class="synIdentifier">[</span>type=<span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier">][</span>value=<span class="synConstant">&quot;${value}&quot;</span><span class="synIdentifier">]</span>`
    await page.evaluate(
      s =&gt; (<span class="synStatement">document</span>.querySelector(s).checked = <span class="synConstant">true</span>),
      selectedRadioSelector
    )
    <span class="synComment">// radio ボタンにチェック入れたので処理終了</span>
    <span class="synStatement">break</span> label
  <span class="synIdentifier">}</span>
<span class="synIdentifier">}</span>
</pre>

## まとめ

<p>非常につまづきやすい点だったので備忘録として残しました。</p>

<p>参考になれば幸いです。</p>

<p><div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/4297104407/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/519V%2BijeWmL._SL160_.jpg" class="hatena-asin-detail-image" alt="WEB+DB PRESS Vol.109" title="WEB+DB PRESS Vol.109"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/4297104407/kenzo0107-22/">WEB+DB PRESS Vol.109</a></p><ul><li><span class="hatena-asin-detail-label">作者:</span> 佐藤歩,加藤賢一,原一成,加藤圭佑,大塚健司,磯部有司,村田賢太,末永恭正,久保田祐史,吉川竜太,牧大輔,ytnobody(わいとん),前田雅央,浜田真成,竹馬光太郎,池田拓司,はまちや2,竹原,原田裕介,西立野翔磨,田中孝明</li><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> 技術評論社</li><li><span class="hatena-asin-detail-label">発売日:</span> 2019/02/23</li><li><span class="hatena-asin-detail-label">メディア:</span> 単行本</li><li><a href="https://d.hatena.ne.jp/asin/4297104407/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div></p>
