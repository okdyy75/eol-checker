# EOL Timeline Viewer

開発中のサービスで使用している言語やフレームワークのEnd of Life（EOL）情報を視覚的に確認できる静的Webサイトです。

## 概要

- 複数のサービスのEOL情報をガントチャート形式で表示
- endoflife.date APIからビルド時にデータを取得
- URLを共有することで誰でも確認可能
- 静的サイトとしてデプロイ可能

## 技術スタック

- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **UIライブラリ**: React 18+
- **ガントチャート**: gantt-task-react
- **スタイリング**: Tailwind CSS
- **ビルド**: 静的エクスポート（next export）
- **データソース**: endoflife.date API

## セットアップ

### 前提条件

- Node.js 18.0.0以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd eol-timeline-viewer

# 依存関係をインストール
npm install

# EOLデータを取得（初回のみ）
npm run fetch-eol-data

# 開発サーバーを起動
npm run dev
```

### 開発

```bash
# 開発サーバーを起動
npm run dev

# テストを実行
npm test

# テストをウォッチモードで実行
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage

# リントを実行
npm run lint
```

### gantt-task-react のパッチ運用

このプロジェクトでは、`gantt-task-react` のバー色分け（`task.segments`）表示のために `patch-package` を使用しています。

- パッチファイル: `patches/gantt-task-react+0.3.9.patch`
- 自動適用: `postinstall` スクリプトで `patch-package` を実行
- 元ファイル（適用先）:
  - `node_modules/gantt-task-react/dist/index.js`
  - `node_modules/gantt-task-react/dist/index.modern.js`

通常は `npm install` 後に自動でパッチが適用されます。手動で再適用したい場合は以下を実行してください。

```bash
npm run postinstall
```

### ビルドとデプロイ

```bash
# 本番用ビルド（EOLデータ取得 + ビルド）
npm run build

# 静的ファイルをエクスポート
npm run export
```

生成された `out/` ディレクトリを任意の静的ホスティングサービスにデプロイできます。

## 使用方法

1. **サービスの追加**: 管理しているサービス名を入力
2. **技術スタックの追加**: 各サービスで使用している技術とバージョンを入力
3. **タイムライン表示**: ガントチャート形式でEOL情報を確認
4. **URL共有**: URLをコピーしてチームメンバーと共有

## プロジェクト構造

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # メインページ
│   └── globals.css        # グローバルスタイル
├── components/            # Reactコンポーネント
│   ├── ServiceForm.tsx    # サービス入力フォーム
│   ├── TechnologyInput.tsx # 技術スタック入力
│   ├── EOLGanttChart.tsx  # ガントチャート表示
│   └── ErrorBoundary.tsx  # エラーハンドリング
├── lib/                   # ユーティリティとロジック
│   ├── types.ts           # 型定義
│   ├── eol-data.ts        # EOLデータ管理
│   ├── url-state.ts       # URL状態管理
│   ├── storage.ts         # ローカルストレージ管理
│   └── gantt-adapter.ts   # Ganttデータ変換
├── scripts/               # ビルドスクリプト
│   └── fetch-eol-data.ts  # EOLデータ取得
└── public/
    └── data/
        └── eol-data.json  # 静的EOLデータ（ビルド時生成）
```

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。

## サポート

問題が発生した場合は、GitHubのIssuesページで報告してください。
