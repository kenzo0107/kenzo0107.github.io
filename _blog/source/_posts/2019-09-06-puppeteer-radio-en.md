---
layout: post
title: Checking a radio button with Puppeteer
date: 2019-09-06
category: Infrastructure
lang: en
translation_id: puppeteer-radio
permalink: en/2019/09/06/puppeteer-radio/
tags:
  - Puppeteer
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190906/20190906230848.png
---

## Overview

This is a memo on how to check a radio button using the scraping tool Puppeteer.

<!-- more -->

## Example

Suppose we have the following radio button group.

<pre class="code lang-html" data-lang="html" data-unlink><span class="synIdentifier">&lt;</span><span class="synStatement">input</span><span class="synIdentifier"> </span><span class="synType">type</span><span class="synIdentifier">=</span><span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier"> </span><span class="synType">name</span><span class="synIdentifier">=</span><span class="synConstant">&quot;maker&quot;</span><span class="synIdentifier"> </span><span class="synType">value</span><span class="synIdentifier">=</span><span class="synConstant">&quot;1&quot;</span><span class="synIdentifier">&gt;</span> クリスタル映像
<span class="synIdentifier">&lt;</span><span class="synStatement">input</span><span class="synIdentifier"> </span><span class="synType">type</span><span class="synIdentifier">=</span><span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier"> </span><span class="synType">name</span><span class="synIdentifier">=</span><span class="synConstant">&quot;maker&quot;</span><span class="synIdentifier"> </span><span class="synType">value</span><span class="synIdentifier">=</span><span class="synConstant">&quot;2&quot;</span><span class="synIdentifier">&gt;</span> ポセイドン企画
</pre>

## Answer

<p>If you want to select <b>クリスタル映像</b>, do the following.</p>

<p>Use page.evaluate so that the result of operating inside the browser is returned.<br/>
Since this runs inside the browser, you can use document.querySelector.<br/>
There, we set `checked = true`.</p>

<pre class="code lang-javascript" data-lang="javascript" data-unlink><span class="synStatement">const</span> selectedRadioSelector = `input<span class="synIdentifier">[</span>type=<span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier">][</span>value=<span class="synConstant">&quot;1&quot;</span><span class="synIdentifier">]</span>`
await page.evaluate(
  s =&gt; (<span class="synStatement">document</span>.querySelector(s).checked = <span class="synConstant">true</span>),
  selectedRadioSelector
)
</pre>

## Failed attempts

<p>The click-based approaches all failed across the board.</p>

<p>I found an article saying it succeeds if you `page.WaitFor`, but in my own environment, puppeteer (version=1.19.0), it still failed.</p>

<ul>
<li>page.click</li>
</ul>

<pre class="code lang-javascript" data-lang="javascript" data-unlink><span class="synStatement">const</span> selectedRadioSelector = `input<span class="synIdentifier">[</span>type=<span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier">][</span>value=<span class="synConstant">&quot;1&quot;</span><span class="synIdentifier">]</span>`
page.click(selectedRadioSelector)
</pre>

<ul>
<li>Grab the radio element and click</li>
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

## Going further

<p>Suppose we have the following radio button group.<br/>
Compared to the one above, a label tag has been added.</p>

<pre class="code lang-html" data-lang="html" data-unlink><span class="synIdentifier">&lt;</span><span class="synStatement">input</span><span class="synIdentifier"> </span><span class="synType">type</span><span class="synIdentifier">=</span><span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier"> </span><span class="synType">id</span><span class="synIdentifier">=</span><span class="synConstant">&quot;group1&quot;</span><span class="synIdentifier"> </span><span class="synType">name</span><span class="synIdentifier">=</span><span class="synConstant">&quot;maker&quot;</span><span class="synIdentifier"> </span><span class="synType">value</span><span class="synIdentifier">=</span><span class="synConstant">&quot;1&quot;</span><span class="synIdentifier">&gt;</span> <span class="synIdentifier">&lt;</span><span class="synStatement">label</span><span class="synIdentifier"> </span><span class="synType">for</span><span class="synIdentifier">=</span><span class="synConstant">&quot;group1&quot;</span><span class="synIdentifier">&gt;</span>クリスタル映像<span class="synIdentifier">&lt;/</span><span class="synStatement">label</span><span class="synIdentifier">&gt;</span>
<span class="synIdentifier">&lt;</span><span class="synStatement">input</span><span class="synIdentifier"> </span><span class="synType">type</span><span class="synIdentifier">=</span><span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier"> </span><span class="synType">id</span><span class="synIdentifier">=</span><span class="synConstant">&quot;group2&quot;</span><span class="synIdentifier"> </span><span class="synType">name</span><span class="synIdentifier">=</span><span class="synConstant">&quot;maker&quot;</span><span class="synIdentifier"> </span><span class="synType">value</span><span class="synIdentifier">=</span><span class="synConstant">&quot;2&quot;</span><span class="synIdentifier">&gt;</span> <span class="synIdentifier">&lt;</span><span class="synStatement">label</span><span class="synIdentifier"> </span><span class="synType">for</span><span class="synIdentifier">=</span><span class="synConstant">&quot;group1&quot;</span><span class="synIdentifier">&gt;</span>ポセイドン企画<span class="synIdentifier">&lt;/</span><span class="synStatement">label</span><span class="synIdentifier">&gt;</span>
</pre>

<p>Let's check the one whose label matches a regular expression.</p>

<ul>
<li>Check the one whose label contains the text "映像"</li>
</ul>

<pre class="code lang-javascript" data-lang="javascript" data-unlink><span class="synStatement">const</span> regex = <span class="synConstant">&quot;映像&quot;</span>
<span class="synStatement">const</span> regexpLabel = <span class="synStatement">new</span> <span class="synType">RegExp</span>(regex, <span class="synConstant">'g'</span>)

<span class="synStatement">const</span> r = await page.$$(<span class="synConstant">'input[type=&quot;radio&quot;]'</span>)

label: <span class="synStatement">for</span> (<span class="synStatement">const</span> i <span class="synStatement">in</span> r) <span class="synIdentifier">{</span>
  <span class="synComment">// the id property of the radio button</span>
  <span class="synStatement">const</span> id = await (await r<span class="synIdentifier">[</span>i<span class="synIdentifier">]</span>.getProperty(<span class="synConstant">'id'</span>)).jsonValue()
  <span class="synComment">// the value property of the radio button</span>
  <span class="synStatement">const</span> value = await (await r<span class="synIdentifier">[</span>i<span class="synIdentifier">]</span>.getProperty(<span class="synConstant">'value'</span>)).jsonValue()

  <span class="synComment">// get the label's textContent (gets &quot;クリスタル映像&quot;, &quot;ポセイドン企画&quot;)</span>
  <span class="synStatement">const</span> label = await page.$(`label<span class="synIdentifier">[</span><span class="synStatement">for</span>=<span class="synConstant">&quot;${id}&quot;</span><span class="synIdentifier">]</span>`)
  <span class="synStatement">const</span> labelContent = await (await label.getProperty(
    <span class="synConstant">'textContent'</span>
  )).jsonValue()


  <span class="synComment">// true if the label's textContent contains &quot;映像&quot;</span>
  <span class="synStatement">if</span> (labelContent.match(regexpLabel)) <span class="synIdentifier">{</span>
    <span class="synStatement">const</span> selectedRadioSelector = `input<span class="synIdentifier">[</span>type=<span class="synConstant">&quot;radio&quot;</span><span class="synIdentifier">][</span>value=<span class="synConstant">&quot;${value}&quot;</span><span class="synIdentifier">]</span>`
    await page.evaluate(
      s =&gt; (<span class="synStatement">document</span>.querySelector(s).checked = <span class="synConstant">true</span>),
      selectedRadioSelector
    )
    <span class="synComment">// the radio button has been checked, so finish processing</span>
    <span class="synStatement">break</span> label
  <span class="synIdentifier">}</span>
<span class="synIdentifier">}</span>
</pre>

## Summary

<p>This was a very easy spot to get stuck on, so I left it here as a memo.</p>

<p>I hope it helps.</p>

<p><div class="hatena-asin-detail"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/4297104407/kenzo0107-22/"><img src="https://images-fe.ssl-images-amazon.com/images/I/519V%2BijeWmL._SL160_.jpg" class="hatena-asin-detail-image" alt="WEB+DB PRESS Vol.109" title="WEB+DB PRESS Vol.109"></a><div class="hatena-asin-detail-info"><p class="hatena-asin-detail-title"><a href="https://www.amazon.co.jp/exec/obidos/ASIN/4297104407/kenzo0107-22/">WEB+DB PRESS Vol.109</a></p><ul><li><span class="hatena-asin-detail-label">作者:</span> 佐藤歩,加藤賢一,原一成,加藤圭佑,大塚健司,磯部有司,村田賢太,末永恭正,久保田祐史,吉川竜太,牧大輔,ytnobody(わいとん),前田雅央,浜田真成,竹馬光太郎,池田拓司,はまちや2,竹原,原田裕介,西立野翔磨,田中孝明</li><li><span class="hatena-asin-detail-label">出版社/メーカー:</span> 技術評論社</li><li><span class="hatena-asin-detail-label">発売日:</span> 2019/02/23</li><li><span class="hatena-asin-detail-label">メディア:</span> 単行本</li><li><a href="https://d.hatena.ne.jp/asin/4297104407/kenzo0107-22" target="_blank">この商品を含むブログを見る</a></li></ul></div><div class="hatena-asin-detail-foot"></div></div></p>
