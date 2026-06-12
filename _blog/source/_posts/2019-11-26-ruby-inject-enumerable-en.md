---
layout: post
title: Learning Ruby's inject (Enumerable) Method
date: 2019-11-26
lang: en
translation_id: ruby-inject-enumerable
permalink: en/2019/11/26/ruby-inject-enumerable/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20191123/20191123143247.png
tags:
- Ruby
---

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20191123/20191123143247.png" width="100%">
</div>

## Overview

I learned Ruby's inject method by working through a problem. This is my note on it.

<!-- more -->

## The Problem

Find the combination that breaks down 123,456 yen into the fewest possible bills and coins.
Coins ... 1, 5, 10, 50, 100, 500 yen coins
Bills ... 1000, 2000, 5000, 10000 yen bills

## The Answer

* 10,000 yen bill × 12
* 5,000 yen bill × 0
* 2,000 yen bill × 1
* 1,000 yen bill × 1
* 500 yen coin × 0
* 100 yen coin × 4
* 50 yen coin × 1
* 10 yen coin × 0
* 5 yen coin × 1
* 1 yen coin × 1



### The inject Method

By computing the answer as a combination held in an array, the code can be written simply.

{% gist kenzo0107/d36b644e1f19f69d6ef41382825b9b6a %}

Going from the largest denomination down, you append the result of `divmod` — `[quotient, remainder]` — onto the back of a growing array (a). Since `r` ends up holding the `remainder` (the last element of the array), you use it in the calculation of the next iteration.

```ruby
[] + 123456.divmode(10000) # [12, 3456]
[12, 3456] + 3456.divmod(5000) # [12, 0, 3456]
[12, 0, 3456] + 3456.divmod(2000) # [12, 0, 1, 1456]
[12, 0, 1, 1456] + 1456.divmod(1000) # [12, 0, 1, 1, 456]
[12, 0, 1, 1, 456] + 456.divmod(500) # [12, 0, 1, 1, 0, 456]
[12, 0, 1, 1, 0, 456] + 456.divmod(100) # [12, 0, 1, 1, 0, 4, 56]
[12, 0, 1, 1, 0, 456] + 56.divmod(50) # [12, 0, 1, 1, 0, 4, 1, 6]
[12, 0, 1, 1, 0, 4, 1, 6] + 6.divmod(10) # [12, 0, 1, 1, 0, 4, 1, 1, 0, 6]
[12, 0, 1, 1, 0, 4, 1, 1, 0, 6] + 6.divmod(5) # [12, 0, 1, 1, 0, 4, 1, 1, 0, 1]
[12, 0, 1, 1, 0, 4, 1, 1, 0, 1] + 1.divmod(1) # [12, 0, 1, 1, 0, 4, 1, 1, 0, 1, 1, 0]
```


The trailing 0 is extra, but I was able to compute the answer in a very simple form.

That said,
my impression is that coming up with this inject expression off the bat takes some getting used to.

So
it seemed like a good way to get comfortable: first check the calculation steps with each, then try inject if it looks like the code can be made simpler.

## The each Method

{% gist kenzo0107/8b32c9b56bd755b2c0e072d063ce0c0c %}

With each, you need to define the array to return at the very end — `b = []` — outside the loop.

`b << r if p.size - 1 == index` is unnecessary, but I added it to make the resulting array match the inject version.

## Taking a Benchmark

```ruby
require &quot;benchmark&quot;

r = 123_456

Benchmark.bmbm do |x|
    x.report(&quot;div_inject&quot;) do
        10000.times do
            div_inject(r)
        end
    end

    x.report(&quot;div_each&quot;) do
        10000.times do
            div_each(r)
        end
    end
end
```


each was faster.

```ruby
                 user     system      total        real
div_inject   0.037365   0.000524   0.037889 (  0.040733)
div_each     0.024333   0.000257   0.024590 (  0.025320)
```

Personally, this article would have wrapped up nicely if inject had come out faster, but with this particular calculation logic, each gave better performance.

## Working with a Hash

### inject

{% gist kenzo0107/7d43a2ff956336ed04efdc36cbc2800a %}


### each

{% gist kenzo0107/7c50a3fcecc7aa8e25ce9ad58e522137 %}

When I benchmarked it, each and hash were roughly equivalent.

## Summary

I learned the inject method by working through an example problem.

In the example it could be written especially simply, but since it doesn't dramatically improve performance, I felt you need to judge where it's worth using.

That's all.
I hope this is helpful.
