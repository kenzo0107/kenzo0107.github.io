---
layout: post
title: Git Command Cheat Sheet
date: 2015-04-27
category: Git
lang: en
translation_id: git-command-list
permalink: en/2015/04/27/git-command-list/
cover: /img/cover/2015-04-27-git-command-list.svg
---

```console
// Check out the remote origin/develop into a local develop branch
git checkout -b develop origin/develop

// Discard edits to a specific file. Restore it to its committed state.
git checkout <filepath>

// List commits
git log
git log --pretty=oneline

// Undo the most recent commit
git commit --amend

// Throw away the commit entirely.
git reset --hard HEAD

// Unstage a file that was added to the index
git reset (file_name)

// Throw away the last n commits.
git reset --hard HEAD~{n}
// Undo a push. (Remove the commit info on the remote)
git push -f origin HEAD

// List tags
git tag -n
// Create a tag
git tag -am "<message>" <tag_name>
// Delete a tag
git tag -d <tag_name>


// Stash work-in-progress files
git stash
// Pop the stashed files back out
git stash pop
```
