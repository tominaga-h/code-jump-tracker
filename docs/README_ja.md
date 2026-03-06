# <img src="../resources/logo.png" width="40px" alt="ロゴ" style="margin-right: 10px" />Code Jump Tracker

VS Code でのコードジャンプ履歴を視覚的に管理する拡張機能。
シェルの `pushd` / `popd` のような直感的な履歴管理をサイドバーで提供し、複雑なコードベースでの「迷子」を防ぎます。

## Features

- **自動記録** -- ファイル間の移動や同一ファイル内の大きな行ジャンプ（10行以上）を自動で履歴に記録。1行ずつの移動やキーボード選択は除外されます
- **手動記録** -- エディタ・行番号の右クリックメニュー、またはショートカットキーで任意の場所を記録
- **サイドバー 2ビュー** -- 「History Log」（重複除去した訪問履歴）と「File Group」（ファイルごとのグループ表示）をタブで切り替え
- **ガターピンアイコン** -- 手動マークした行にピン 📌 アイコンを表示し、コード上で視覚的に把握
- **キーボードナビゲーション** -- 履歴の前後移動をショートカットで実行
- **永続化** -- ワークスペースごとに履歴を保存し、再起動後も完全に復元
- **ソート切替** -- 新着順 / 古い順を切り替え
- **アクティブファイルハイライト** -- 現在開いているファイルのエントリをサイドバー上でハイライト

## サイドバービュー

<img src="../images/demo.png" height="600px" align="left" alt="デモ" style="margin-right: 20px" />

### History Log

重複を除去した訪問履歴を一覧表示します。

- シンボル種別に応じたアイコン（関数・クラスなど）を表示
- 手動マークにはピンアイコンを付与
- 各アイテムをクリックすると該当箇所へジャンプ
- コンテキストメニューから個別削除が可能
- ソート順（新着順 / 古い順）を切り替え可能

<div style="display: block;width: 100%;height: 55px"></div>

### File Group

ファイルごとにグループ化した履歴をツリー表示します。

- ルートノード: ファイル名とエントリ数
- 子ノード: そのファイル内の各エントリ（行番号順）
- 同一ファイル・同一行の重複は自動除去

<div style="display: block;width: 100%;height: 110px"></div>

## コマンド一覧

| コマンド | ID | 説明 |
|----------|-----|------|
| Push to Tracker | `codeJumpTracker.pushManual` | 現在位置を手動で履歴に追加 |
| Go Back | `codeJumpTracker.goBack` | 前の履歴へ移動 |
| Go Forward | `codeJumpTracker.goForward` | 次の履歴へ移動 |
| Clear All History | `codeJumpTracker.clearAll` | 履歴を全削除 |
| Delete | `codeJumpTracker.deleteItem` | 選択アイテムを個別削除 |
| Navigate to Entry | `codeJumpTracker.navigateToEntry` | 履歴エントリへジャンプ |
| Sort: Newest First | `codeJumpTracker.sortOrderDesc` | 新着順にソート |
| Sort: Oldest First | `codeJumpTracker.sortOrderAsc` | 古い順にソート |

## キーバインド

| 操作 | Windows / Linux | macOS |
|------|-----------------|-------|
| 前の履歴に戻る | `Alt+Shift+Left` | `Ctrl+Shift+-` |
| 次の履歴に進む | `Alt+Shift+Right` | `Ctrl+Shift+=` |
| 手動で履歴に保存 | `Alt+Shift+P` | `Ctrl+Shift+P` |

## 設定

`settings.json` で以下の項目をカスタマイズできます。

| 設定 | 型 | デフォルト | 範囲 | 説明 |
|------|----|-----------|------|------|
| `codeJumpTracker.maxHistorySize` | `number` | `50` | 1 -- 500 | 履歴の保存上限数。超過分は古い順に自動削除 |

## 開発

### 前提条件

- Node.js
- npm

### セットアップ

```bash
npm install
npm run build
```

VS Code で `F5` を押すと Extension Development Host が起動します。

### npm scripts

| スクリプト | 説明 |
|-----------|------|
| `npm run build` | esbuild でバンドルビルド |
| `npm run watch` | ファイル監視付きビルド |
| `npm run package` | VSIX パッケージ生成 |

### Makefile

よく使うタスクは `make` でも実行できます。

| ターゲット | 説明 |
|-----------|------|
| `make install` | `npm install` |
| `make build` | プロダクションビルド |
| `make watch` | ウォッチモードでビルド |
| `make clean` | `dist/` と `*.vsix` を削除 |
| `make package` | VSIX パッケージ生成 |
| `make local-install` | ビルドからローカルインストールまで一括実行 |
| `make dev` | install + build（F5 で起動準備） |
