---
layout: post
title: 'Fix: can''t find gem bundler (>= 0.a) with executable bundle (Gem::GemNotFoundException)'
date: 2019-12-06
category: Infrastructure
lang: en
translation_id: fix-can-t-find-gem-bundler-0-a-with-executable-bundle-gem-gemnotfoundexception
permalink: en/2019/12/06/fix-can-t-find-gem-bundler-0-a-with-executable-bundle-gem-gemnotfoundexception/
cover: /img/cover/2019-12-06-fix-can-t-find-gem-bundler-0-a-with-executable-bundle-gem-gemnotfoundexception.svg
tags:
- Ruby
---

When I tried to run `bundle install` in an environment with multiple Ruby versions managed by rbenv, I hit the following error.

```sh
can't find gem bundler (>= 0.a) with executable bundle (Gem::GemNotFoundException)
```

* The Ruby version was correct,
* the Gemfile was there,
* and I had run `gem install bundler` so bundle existed too ← this was the problem


yet I still got the error.

I kept getting stuck on this, so I took some notes for future reference.

<!-- more -->

## Conclusion

It was caused by the bundler version (`2.0.2`) differing from the one in Gemfile.lock (`1.17.1`).


* The bundler installed via gem was `2.0.2`


```sh
$ gem install bundler

Successfully installed bundler-2.0.2
Parsing documentation for bundler-2.0.2
Done installing documentation for bundler after 2 seconds
1 gem installed
```

* The bundler in Gemfile.lock was `1.17.1`


```ruby
...
 VERSION
   ruby 2.5.3p105

BUNDLED WITH
   1.17.1
```


So once I matched the bundle version being executed to the one in Gemfile.lock, it ran fine.

## Fix

```ruby
$ gem install bundler -v 1.17.1
$ gem uninstall bundler -v 2.0.2
```


At first glance, `(>= 0.a)` made me go "huh?", and thinking "wait, I did set it up though..." is exactly how you get stuck. This was something I wanted to be able to recognize the moment I see this error message.

That's all.
I hope you find it helpful.
