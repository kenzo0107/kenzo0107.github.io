---
layout: post
title: git コマンドまとめ
date: 2015-04-27
---

```console
// リモートのorigin/developをlocalのdevelopブランチへチェックアウトする
git checkout -b develop origin/develop

// 特定のファイルの編集内容を取り消す。Commitされているファイルの状態に戻す。
git checkout <filepath>

// commit一覧表示
git log
git log --pretty=oneline

// 直前のcommitを取り消す
git commit --amend

// commitをなかったことにする。
git reset --hard HEAD

// indexに加えたファイルを元に戻す
git reset (file_name)

// 過去n個のcommitをなかったことにする。
git reset --hard HEAD~{n}
// pushをなかったことにする。(remoteのコミット情報を削除)
git push -f origin HEAD

// タグ一覧確認
git tag -n
// タグ付け
git tag -am "<message>" <tag_name>
// タグ削除
git tag -d <tag_name>


// 作業中ファイルの退避
git stash
// 作業中ファイルの吐き出し
git stash pop
```
