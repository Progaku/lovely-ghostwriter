---
name: issue-branch-create
description: 指定されたGitHub issueを読み取り、要件・作業範囲・安全制約を確認したうえで、このリポジトリの作業用ブランチを作成する。Codexに対して、issue番号やURLから内容を確認させ、実装着手前のブランチ作成、ブランチ名提案、既存ブランチ確認、作業開始準備をさせる際に使用する。
---

# Issue ブランチ作成

## 目的

指定された issue を実装作業の起点として読み取り、要件に対応する安全で分かりやすい作業ブランチを作成する。

ブランチ作成前に、issue の本文、受け入れ条件、対象外、安全制約を確認し、現在の作業ツリーや既存ブランチを壊さない。

## 基本手順

1. `AGENTS.md` を読み、言語方針、技術スタック、安全制約を確認する。
2. ユーザーが指定した issue 番号、URL、または本文から対象 issue を特定する。
3. GitHub issue の場合は `gh issue view` でタイトル、本文、URL、ラベル、状態を確認する。
4. issue が未取得、存在しない、closed、または内容が不足している場合は、ブランチを切る前にユーザーへ確認する。
5. `git status --short` で作業ツリーを確認する。未コミット変更がある場合は、それがユーザー作業か既存作業かを尊重し、上書き・巻き戻しをしない。
6. `git branch --list` と必要に応じて `git branch --show-current` で既存ブランチを確認する。
7. issue タイトルと番号からブランチ名を決める。
8. ベースブランチを確認し、必要なら `git fetch` や `git switch` の前にユーザー確認を挟む。
9. `git switch -c <branch-name>` でブランチを作成する。
10. 作成後に `git branch --show-current` と `git status --short` を確認し、issue要約とブランチ名をユーザーへ報告する。

## issue 確認

GitHub CLI が使える場合は、次を基本にする。

```bash
gh issue view <number-or-url> --json number,title,body,state,url,labels,assignees,milestone
```

GitHub CLI が使えない場合は、ユーザーが貼った issue 本文やローカル資料を根拠にする。issue の受け入れ条件や対象外が確認できない場合は、推測で作業ブランチを切らず確認する。

確認する内容:

- issue 番号、タイトル、URL、状態。
- 背景、やること、受け入れ条件、テスト観点、対象外。
- `docs/` や `references/` への参照。
- 非公式ファン作品、娯楽用途、重要判断に使わない注意書きなどの安全制約。
- 初期スコープ外の保存、履歴、URL共有、画像保存、SNS連携、認証、バックエンド、外部 AI API 呼び出しが含まれていないか。

## ブランチ命名

ブランチ名は英小文字、数字、ハイフン、スラッシュのみを使う。

標準形式:

```text
issue-<number>-<short-slug>
```

例:

```text
issue-12-weekly-prophecy-form
issue-27-copyable-ai-prompt
issue-35-disclaimer-validation
```

命名ルール:

- issue 番号が分かる場合は必ず含める。
- slug は issue タイトルの主題を英語で短く表す。
- 長すぎるタイトルは 3 から 6 語程度に圧縮する。
- 日本語タイトルをローマ字にしない。意味が分かる英語 slug に置き換える。
- スペース、アンダースコア、日本語、記号、絵文字は使わない。
- 既存ブランチと重複する場合は、issue 内容に合わせて slug を調整する。

issue 番号がない場合の暫定形式:

```text
task-<short-slug>
```

ただし GitHub issue がある前提の作業では、番号が確認できるまでブランチ作成を待つ。

## Git 操作

作業ツリー確認:

```bash
git status --short
git branch --show-current
git branch --list
```

ベースブランチ確認:

```bash
git remote show origin
git branch --show-current
```

ブランチ作成:

```bash
git switch -c issue-<number>-<short-slug>
```

既に同名ブランチがある場合:

- 現在のブランチが同名なら、新規作成せずそのまま使う。
- ローカルに同名ブランチがあるが現在ブランチでない場合は、`git switch <branch-name>` してよいか確認する。
- リモートに同名ブランチがある場合は、そのブランチが対象 issue の作業か確認してから扱う。

## 注意事項

- 未コミット変更を破棄、退避、上書き、巻き戻ししない。
- `git reset --hard`、`git checkout --`、`git clean` などの破壊的操作は行わない。
- `git fetch`、`gh issue view` などネットワークが必要な操作が失敗した場合は、必要に応じて許可を取って再実行する。
- issue の内容がこのプロジェクトの `docs/` や `AGENTS.md` と矛盾する場合は、ブランチ作成前にユーザーへ確認する。
- issue を読んだだけで実装には着手しない。ユーザーが実装も求めた場合のみ続ける。

## 報告形式

作成後は日本語で簡潔に報告する。

```markdown
issue #<number>「<タイトル>」を確認し、`<branch-name>` を作成しました。

確認した主な作業範囲:
- <要点1>
- <要点2>

現在のブランチ: `<branch-name>`
```

作成できなかった場合は、原因、確認済み事項、次に必要なユーザー判断を明記する。
