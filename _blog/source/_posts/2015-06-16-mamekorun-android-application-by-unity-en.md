---
layout: post
title: Released the Android App "Mamekoran!" Built with Unity
date: 2015-06-16
category: Infrastructure
lang: en
translation_id: mamekorun-android-application-by-unity
permalink: en/2015/06/16/mamekorun-android-application-by-unity/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150616/20150616004701.png
---

## The App Is Now Live

[Google Play "Mamekoran!"](https://play.google.com/store/apps/details?id=com.mameko.jp&hl=ja)

## Androider Introduction Video

Tane-chan kindly introduced it for me.

{% linkPreview https://www.youtube.com/watch?v=XdxubQsPs6M %}

## Androider Detail Page

{% linkPreview https://androider.jp/official/app/0e098734256fe037/ %}

## Tane-chan

http://idol.lecre.jp/

## Featured by Appcasual!

{% linkPreview http://www.appcasual.net/2015/03/11/shortreview-mameko/ %}

### Key Points

At its core it's a running game, but since there are already tons of fun running games out there, I added swimming and jumping, and built it with a strong focus on the story.

The further you progress, the more the story unfolds. I crafted it so that you'll find out things like "wait, that guy was actually...".

It has laughs and tears too. Please give it a try (^-^)

## Environment

- Unity 4.6
- MacOSX Yosemite 10.10.2
- Sakura rental server (¥1,000/month) - LAMP stack built with Ansible.

## 5rocks (now tapjoy) - Client Side

- An SDK for Unity is available
- Real-time KPI measurement is possible. Includes remote push. Pricing is free or paid depending on the number of monthly Active Users.
- As of May 28, 2015, now that it has become TapJoy there are some typos and such in the documentation, which is a bit concerning.

\*\* fluentd + ElasticSearch + kibana for log analysis - Server Side

- I introduced this to track things like item usage rates.

## Points of Ingenuity

For the map, I use object pooling and generate it as the player advances, then return it to the pool once it goes off-camera. By making it efficient this way, I sped up transitions between scenes.

## It Became an Androider Certified App

{% linkPreview https://androider.jp/official/app/0e098734256fe037/ %}
