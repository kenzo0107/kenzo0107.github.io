---
layout: post
title: Placing robots.txt to Load sitemap.xml and Improve SEO Efficiency
date: 2015-04-06
lang: en
translation_id: robot-txt-for-seo
permalink: en/2015/04/06/robot-txt-for-seo/
cover: /img/cover/2015-04-06-robot-txt-for-seo.svg
---

## Overview

This is one of the things you'll want to do at release time as part of your SEO efforts.
By specifying which files you want search engine crawlers to read,
you can improve SEO efficiency.


## Prerequisites
The site should be in a state where it's ready to release,
or very nearly ready to release.

This is the kind of task I think of as something to perform right before or right after release.


## Overview of Each File

### robots.txt

robots.txt is a file used to describe instructions for robot-based search engines such as goo, Google, and Lycos.


### sitemap.xml

sitemap.xml is a file that describes information about each page, such as URLs and titles, in XML format.


## Procedure

### Creating sitemap.xml

You can create it with the following sitemap generator.

http://tafcue.com/xml_sitemap-convenient_tools/xml_sitemap_tools001/

* Note: If there are unnecessary URLs, you'll need to delete them, and if there are URLs you want to add, you'll need to edit them in yourself.


Example) When a detail page is displayed under various URLs

For search engines, it's preferable that a single piece of content corresponds to a unique URL.

When all of the following resolve to the same page content, a single page ends up being represented by various URL forms, which is not good.

* http://hogehoge.com/products/detail.php?product_id=100
* http://hogehoge.com/products/detail.php?product_id=100&name=ProductName
* http://hogehoge.com/products/detail.php?product_id=100&category_id=10

When you have a case like the above, please narrow it down to a single URL.


### Place sitemap.xml in the document root.


* /path/to/DocumentRoot/sitemap.xml

### Place robots.txt in the document root, written as follows.

* /path/to/DocumentRoot/robots.txt

{% gist kenzo0107/222a16207d9530a64749 %}


That completes the configuration to have search engine crawlers load sitemap.xml.


## How to Verify

You can check the configuration status with Google Webmaster Tools.

https://www.google.com/webmasters/tools/

* Note: Registration is free.


That's all.
