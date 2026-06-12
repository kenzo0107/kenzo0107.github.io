---
layout: post
title: A Machine Learning Newbie Web Engineer Starts Face Recognition with Machine Learning
date: 2016-09-20
category: Data Analytics
lang: en
translation_id: machine-learning
permalink: en/2016/09/20/machine-learning/
cover: /img/cover/2016-09-20-machine-learning.svg
tags:
- MachineLearning
---


## Previously

Face detection and face recognition are fundamentally different.

- <b>Face detection</b> is determining whether something is a face
- <b>Face recognition</b> is determining whose face it is, i.e. identifying a specific person

This time I put together how to build the latter, face recognition.

{% linkPreview https://github.com/kenzo0107/FacialRecognitionSystem _blank %}


## What I'm Trying to Do

I'm carrying out the following five steps in order.

1. Download images from a search engine
2. Detect faces in the downloaded images and extract only the face regions
3. Split the extracted face images into a training set and a test set
4. Build a model with machine learning
5. Use the model on the test images to evaluate whose face each one is

## References

For machine learning, I'm using TensorFlow.

① The following are "Hello World"-style examples for TensorFlow, with code you can copy and paste to get it running right away.

- https://www.tensorflow.org/versions/r0.10/tutorials/mnist/beginners/index.html#mnist-for-ml-beginners
- https://www.tensorflow.org/versions/r0.10/tutorials/mnist/pros/index.html#deep-mnist-for-experts
- https://www.tensorflow.org/versions/r0.10/tutorials/mnist/tf/index.html#tensorflow-mechanics-101
- https://www.tensorflow.org/versions/r0.10/tutorials/tfserve/index.html#tensorflow-serving


② Sugyan's article was extremely helpful.

{% linkPreview http://memo.sugyan.com/entry/20160112/1452558576 _blank %}

What he does is simple and easy to understand, and the way he turned it into a service with a web engineer's mindset really caught my interest and made me want to give it a try.


## Going Forward

What I originally wanted to do was
have a Raspberry Pi recognize faces and, when it determines someone is a family member, greet them with "Good morning."
So this time I learned the basics of that face recognition part.

Going forward, I want to actually try connecting this system with a Raspberry Pi.

That said, family photos aren't that easy to gather, so for now let me keep building the basics with SMAP!
