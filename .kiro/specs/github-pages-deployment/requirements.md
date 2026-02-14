# 要件定義書

## はじめに

本ドキュメントは、EOLタイムラインビューアーアプリケーションをGitHub Pagesにデプロイする機能の要件を定義します。Next.jsアプリケーションを静的サイトとしてエクスポートし、GitHub Actionsを使用して自動デプロイを実現します。

## 用語集

- **System**: GitHub Pagesデプロイシステム全体
- **Build_Process**: Next.jsアプリケーションを静的ファイルに変換するビルドプロセス
- **Deployment_Workflow**: GitHub Actionsによる自動デプロイワークフロー
- **Static_Export**: Next.jsの静的エクスポート機能
- **Base_Path**: GitHub Pagesのリポジトリパスに対応するURLベースパス
- **Asset**: 画像、CSS、JavaScriptなどの静的リソース

## 要件

### 要件1: Next.js静的エクスポート設定

**ユーザーストーリー:** 開発者として、Next.jsアプリケーションを静的HTMLファイルとしてエクスポートしたい。これにより、GitHub Pagesでホスティング可能な形式にできる。

#### 受入基準

1. THE Build_Process SHALL 静的エクスポートモード（output: 'export'）を使用してアプリケーションをビルドする
2. WHEN ビルドが実行される THEN THE Build_Process SHALL outディレクトリに完全な静的サイトを生成する
3. THE Build_Process SHALL 画像最適化を無効化する（unoptimized: true）
4. THE Build_Process SHALL すべてのページに末尾スラッシュを追加する（trailingSlash: true）
5. WHEN 動的ルーティングが使用される THEN THE Build_Process SHALL generateStaticParams関数を使用して静的パスを生成する

### 要件2: ベースパス設定

**ユーザーストーリー:** 開発者として、リポジトリ名がURLパスに含まれる場合に対応したい。これにより、GitHub Pagesの標準的なURL構造で正しく動作する。

#### 受入基準

1. WHERE リポジトリがユーザー/組織のメインサイトでない THEN THE System SHALL ベースパスをリポジトリ名に設定する
2. THE System SHALL すべての内部リンクにベースパスを適用する
3. THE System SHALL すべてのアセット参照にベースパスを適用する
4. WHEN 開発環境で実行される THEN THE System SHALL ベースパスを適用しない
5. WHEN 本番環境で実行される THEN THE System SHALL 環境変数からベースパスを読み取る

### 要件3: GitHub Actionsワークフロー作成

**ユーザーストーリー:** 開発者として、コードをプッシュしたときに自動的にデプロイされるようにしたい。これにより、手動デプロイの手間を省ける。

#### 受入基準

1. WHEN mainブランチにプッシュされる THEN THE Deployment_Workflow SHALL 自動的にトリガーされる
2. THE Deployment_Workflow SHALL Node.js環境をセットアップする
3. THE Deployment_Workflow SHALL 依存関係をインストールする
4. THE Deployment_Workflow SHALL EOLデータを取得する（fetch-eol-dataスクリプト実行）
5. THE Deployment_Workflow SHALL アプリケーションをビルドする
6. THE Deployment_Workflow SHALL 生成された静的ファイルをgh-pagesブランチにデプロイする
7. WHEN ワークフローが失敗する THEN THE Deployment_Workflow SHALL エラーメッセージを出力して停止する

### 要件4: アセット最適化

**ユーザーストーリー:** 開発者として、画像やその他のアセットが正しく配信されるようにしたい。これにより、ユーザーに完全な体験を提供できる。

#### 受入基準

1. THE System SHALL すべての画像をpublicディレクトリから配信する
2. THE System SHALL 画像の最適化を無効化する（GitHub Pages用）
3. THE System SHALL CSSとJavaScriptファイルを正しいパスで参照する
4. WHEN アセットが参照される THEN THE System SHALL ベースパスを含む完全なURLを生成する
5. THE System SHALL ファビコンとメタデータアセットを正しく配信する

### 要件5: 環境変数管理

**ユーザーストーリー:** 開発者として、環境ごとに異なる設定を管理したい。これにより、開発環境と本番環境で適切な動作を実現できる。

#### 受入基準

1. THE System SHALL 環境変数NEXT_PUBLIC_BASE_PATHをサポートする
2. WHEN NEXT_PUBLIC_BASE_PATHが設定されている THEN THE System SHALL その値をベースパスとして使用する
3. WHEN NEXT_PUBLIC_BASE_PATHが未設定 THEN THE System SHALL 空文字列をベースパスとして使用する
4. THE System SHALL ビルド時に環境変数を読み取る
5. THE Deployment_Workflow SHALL 必要な環境変数をGitHub Secretsから取得する

### 要件6: デプロイ検証

**ユーザーストーリー:** 開発者として、デプロイが成功したことを確認したい。これにより、本番環境で問題が発生していないことを保証できる。

#### 受入基準

1. WHEN デプロイが完了する THEN THE Deployment_Workflow SHALL 成功ステータスを返す
2. THE System SHALL デプロイされたサイトのURLをワークフローログに出力する
3. WHEN デプロイが失敗する THEN THE Deployment_Workflow SHALL 詳細なエラー情報を提供する
4. THE System SHALL GitHub Pagesの設定が正しいことを確認する手順を提供する
5. THE System SHALL デプロイ後の動作確認手順をドキュメント化する

### 要件7: ビルド最適化

**ユーザーストーリー:** 開発者として、ビルド時間を最小限に抑えたい。これにより、デプロイサイクルを高速化できる。

#### 受入基準

1. THE Deployment_Workflow SHALL 依存関係のキャッシュを使用する
2. THE Deployment_Workflow SHALL Next.jsビルドキャッシュを使用する
3. WHEN 依存関係が変更されていない THEN THE Deployment_Workflow SHALL キャッシュから依存関係を復元する
4. THE Build_Process SHALL 不要なファイルを出力ディレクトリから除外する
5. THE Build_Process SHALL TypeScript型チェックを実行する

### 要件8: エラーハンドリング

**ユーザーストーリー:** 開発者として、デプロイ中のエラーを適切に処理したい。これにより、問題を迅速に特定して修正できる。

#### 受入基準

1. WHEN ビルドエラーが発生する THEN THE Build_Process SHALL 詳細なエラーメッセージを出力する
2. WHEN EOLデータ取得が失敗する THEN THE Deployment_Workflow SHALL エラーを報告して停止する
3. WHEN デプロイが失敗する THEN THE Deployment_Workflow SHALL ロールバック手順を提供する
4. THE System SHALL ビルドログをGitHub Actionsで確認可能にする
5. WHEN 権限エラーが発生する THEN THE System SHALL 必要な権限設定を説明する

### 要件9: ドキュメンテーション

**ユーザーストーリー:** 開発者として、デプロイプロセスを理解し、必要に応じてカスタマイズしたい。これにより、プロジェクトの保守性を向上できる。

#### 受入基準

1. THE System SHALL GitHub Pagesの初期設定手順を提供する
2. THE System SHALL ワークフローファイルの各ステップを説明する
3. THE System SHALL カスタムドメイン設定の手順を提供する
4. THE System SHALL ローカルでの静的エクスポートテスト方法を説明する
