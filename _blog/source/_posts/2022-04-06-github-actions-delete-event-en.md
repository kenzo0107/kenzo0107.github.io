---
title: Running GitHub Actions When a Specific Branch Is Deleted
date: 2022-04-06
lang: en
translation_id: github-actions-delete-event
permalink: en/2022/04/06/github-actions-delete-event/
cover: https://i.imgur.com/XvuvUZ4.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

I tried out a configuration for triggering and running GitHub Actions when a specific branch is deleted, so here is a summary.

Below is the sample configuration.
https://github.com/kenzo0107/tutorial-delete-event-on-github-actions/blob/develop/.github/workflows/delete.yml

<!-- more -->

## Conclusion

I implemented it with the following configuration.

- .github/workflows/delete.yml

```yml
on: delete

jobs:
  run:
    if: ${{ (github.event.ref_type == 'branch' && startsWith(github.event.ref, 'tmp/')) }}
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - run: echo "delete event ${{ github.event.ref }}"
```

Here is a summary of the key points.

### Specifying the branch name with on: delete and if

This is triggered when a branch or tag is deleted.

Unlike `on.push` shown below, **`on.delete` cannot currently filter branches via `branches`.**

```yml
on:
  push:
    branches:
      - tmp/**
```

For that reason, the configuration only runs the following when what was deleted via `on.delete` is a `branch` and that branch name starts with `tmp/` (e.g. tmp/dummy).

```yml
jobs:
  run:
    if: ${{ (github.event.ref_type == 'branch' && startsWith(github.event.ref, 'tmp/')) }}
```

Because of the configuration above, the delete trigger fires every time a branch is deleted (such as deleting a branch after merging), but in practice it stopped in about 1 second.

![](https://i.imgur.com/3Kbhcml.png)

Since these small costs add up over time, if you want to avoid this, you might use the GitHub Webhook with Lambda's free tier... but that's the gist of it, and my impression is that there is no fundamental solution.

I really (sincerely) wish `on.delete` supported a branches filter.

### on.delete becomes available only after you push to the default branch

`on.push` can be triggered even on the very first push to any branch.

`on.delete` becomes available only after you push to the default branch.
I was getting impatient because it just wouldn't trigger, but it turns out it was properly documented in the official docs.

https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#delete

> Note: This event will only trigger a workflow run if the workflow file is on the default branch.

## Summary

- `on.delete` cannot use a branches filter
- `on.delete` will not trigger unless there is a workflow file used on the default branch

That's all.
I hope this is helpful.
