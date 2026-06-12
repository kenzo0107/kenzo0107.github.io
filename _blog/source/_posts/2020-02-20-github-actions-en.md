---
title: GitHub Actions - Should I Run Jobs Sequentially or in Parallel?
date: 2020-02-20
lang: en
translation_id: github-actions
permalink: en/2020/02/20/github-actions/
cover: /img/cover/2020-02-20-github-actions.svg
tags:
- GitHub Actions
---

## Overview

I run static analysis such as Go's errcheck and lint with GitHub Actions,
but I was wondering which is better: a sequential configuration or a parallel configuration for those jobs.
This is a write-up of that dilemma.

<!-- more -->

## Points I Struggled With

* With a parallel configuration, each job triggers a container load. The individual execution time is short, but the total execution time becomes longer.
* With a sequential configuration, the container load happens only once. The execution time becomes longer, but the total execution time is shorter.

If I want to run things without spending too much money, the sequential approach is probably the way to go.

## The Actual Configurations

### Sequential Jobs

```yml
name: static check
on: push

jobs:
  imports:
    name: Imports
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: check
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: imports
        token: ${{ secrets.GITHUB_TOKEN }}

  errcheck:
    name: Errcheck
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: check
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: errcheck
        token: ${{ secrets.GITHUB_TOKEN }}

  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: check
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: lint
        token: ${{ secrets.GITHUB_TOKEN }}

  shadow:
    name: Shadow
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: check
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: shadow
        token: ${{ secrets.GITHUB_TOKEN }}

  staticcheck:
    name: StaticCheck
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: check
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: staticcheck
        token: ${{ secrets.GITHUB_TOKEN }}

  sec:
    name: Sec
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: check
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: sec
        token: ${{ secrets.GITHUB_TOKEN }}
```

### Parallel Jobs

```yml
name: static check
on: push

jobs:
  imports:
    name: Imports
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: imports
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: imports
        token: ${{ secrets.GITHUB_TOKEN }}
    - name: errcheck
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: errcheck
        token: ${{ secrets.GITHUB_TOKEN }}
    - name: lint
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: lint
        token: ${{ secrets.GITHUB_TOKEN }}
    - name: shadow
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: shadow
        token: ${{ secrets.GITHUB_TOKEN }}
    - name: staticcheck
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: staticcheck
        token: ${{ secrets.GITHUB_TOKEN }}
    - name: sec
      uses: grandcolline/golang-github-actions@v1.1.0
      with:
        run: sec
        token: ${{ secrets.GITHUB_TOKEN }}
```

## I Actually Measured It

Running each configuration 10 times, the average times were as follows.

* Parallel configuration: 1 min 30 sec/job * 6 jobs = 9 min
* Sequential configuration: 1 min 50 sec/job * 1 job = 1 min 50 sec

In terms of execution speed, there was only about a 20-second difference.

In total, that's a difference of 7 min 50 sec!

## So Which One Should I Choose?

* GitHub Actions pricing is billed based on the total execution time of jobs, so the sequential approach is gentler on the wallet.
* That said, for a project with a low commit frequency, the parallel approach to save time could also be fine.

This time the difference in execution time was only about 20 seconds, so the sequential approach is perfectly fine.
But depending on the trade-off with cost, how you choose between sequential and parallel seems likely to change. That was the story.
