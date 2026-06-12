# kenzo0107.github.io - Blog 操作 Makefile
#
# 全コマンドは _blog/ ディレクトリで実行する。
# TZ=UTC は permalink の日付ずれを防ぐために必須。

BLOG_DIR := _blog
HEXO     := ./node_modules/.bin/hexo

.PHONY: help install server build new deploy commit push

# --------------------------------------------------------------------------
# デフォルト: ヘルプ表示
# --------------------------------------------------------------------------
help:
	@printf '\n'
	@printf '\033[1mコマンド一覧\033[0m\n'
	@printf '\n'
	@printf '  \033[32mmake install\033[0m              依存パッケージをインストール (npm install)\n'
	@printf '  \033[32mmake server\033[0m               ローカルプレビューサーバー起動 (http://localhost:4000)\n'
	@printf '  \033[32mmake build\033[0m                静的ファイルを生成 (_blog/public/)\n'
	@printf '  \033[32mmake new TITLE=xxx\033[0m        新しい記事ファイルを作成\n'
	@printf '  \033[32mmake commit MSG=xxx\033[0m       _blog/ の変更を commit + push（テーマ変更向け）\n'
	@printf '  \033[32mmake deploy MSG=xxx\033[0m       build + commit + push を一括実行\n'
	@printf '  \033[32mmake push\033[0m                 main へ push → GitHub Pages へ自動デプロイ\n'
	@printf '\n'
	@printf '\033[1m--- 新記事の投稿フロー ---\033[0m\n'
	@printf '\n'
	@printf '  1. make new TITLE=YYYY-MM-DD-my-post\n'
	@printf '  2. _blog/source/_posts/YYYY-MM-DD-my-post.md を編集\n'
	@printf '  3. make server           (任意: ブラウザで確認)\n'
	@printf '  4. make build            (OG データ取得 + db.json を更新)\n'
	@printf '  5. git add _blog/source/_posts/YYYY-MM-DD-my-post.md _blog/db.json\n'
	@printf '  6. git commit -m "記事タイトル"\n'
	@printf '  7. make push\n'
	@printf '\n'
	@printf '\033[1m--- テーマ CSS/JS を変更した場合 ---\033[0m\n'
	@printf '\n'
	@printf '  1. _blog/themes/icarus/... を編集\n'
	@printf '  2. make build\n'
	@printf '  3. git add _blog/themes/... _blog/db.json\n'
	@printf '  4. git commit -m "変更内容"\n'
	@printf '  5. make push\n'
	@printf '\n'
	@printf '\033[33m⚠ 注意: hexo clean は実行しないこと\033[0m\n'
	@printf '  macOS (JST) 環境で実行すると生成済みファイルが削除され permalink がずれる。\n'
	@printf '  また linkPreview タグの OG キャッシュ (db.json) も消える。\n'
	@printf '\n'
	@printf '\033[33m⚠ 注意: linkPreview タグを含む記事を追加・変更した場合\033[0m\n'
	@printf '  make build を実行して db.json を更新してからコミットすること。\n'
	@printf '  db.json が古いと CI で OG 取得が走り、失敗するとビルドが中断される。\n'
	@printf '\n'

# --------------------------------------------------------------------------
install:
	cd $(BLOG_DIR) && npm install

server:
	cd $(BLOG_DIR) && TZ=UTC npm run server

build:
	cd $(BLOG_DIR) && TZ=UTC npm run build

new:
	@test -n "$(TITLE)" || { \
		printf '\033[31mエラー:\033[0m TITLE を指定してください\n'; \
		printf '例: make new TITLE=2026-06-12-my-post\n'; \
		exit 1; \
	}
	cd $(BLOG_DIR) && TZ=UTC $(HEXO) new "$(TITLE)"
	@printf '\n作成: $(BLOG_DIR)/source/_posts/$(TITLE).md\n'
	@printf '次: make server でプレビューしながら記事を編集してください\n'

# テーマ CSS/JS/JSX など _blog/ ソース変更を commit + push（ローカルビルド不要）
commit:
	@test -n "$(MSG)" || { \
		printf '\033[31mエラー:\033[0m MSG を指定してください\n'; \
		printf '例: make commit MSG="変更内容"\n'; \
		exit 1; \
	}
	git add _blog/
	git diff --cached --quiet \
		&& printf '変更なし。push のみ実行します。\n' \
		|| git commit -m "$(MSG)"
	git push origin main

deploy:
	@test -n "$(MSG)" || { \
		printf '\033[31mエラー:\033[0m MSG を指定してください\n'; \
		printf '例: make deploy MSG="記事タイトル or 変更内容"\n'; \
		exit 1; \
	}
	cd $(BLOG_DIR) && TZ=UTC npm run build
	git add _blog/
	git diff --cached --quiet \
		&& printf '変更なし。push のみ実行します。\n' \
		|| git commit -m "$(MSG)"
	git push origin main

push:
	git push origin main
