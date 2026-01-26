# 要件定義書

## はじめに

EOL Timeline Viewerは、開発中のサービスで使用している言語やフレームワークのEnd of Life（EOL）情報を視覚的に確認できる静的Webサイトです。複数のサービスのEOL情報をガントチャート形式で表示し、URLを共有することで誰でも確認できるようにします。endoflife.dateのAPIデータをビルド時に取得して使用します。

## 用語集

- **System**: EOL Timeline Viewerアプリケーション全体
- **Service**: ユーザーが管理する開発サービス（例：「マイクロサービスA」「Webアプリ」）
- **Technology**: 言語またはフレームワーク（例：Python、Node.js、React）
- **Version**: 特定のTechnologyのバージョン番号（例：3.9、18.0.0）
- **EOL_Date**: 特定のバージョンのサポート終了日
- **Timeline**: ガントチャート形式で表示されるEOL情報の視覚表現
- **endoflife.date**: EOL情報を提供する外部APIサービス
- **Gantt_Chart**: 時系列に沿ってバーで情報を表示するチャート形式
- **URL_State**: URLパラメータに保存されたアプリケーションの状態

## 機能要件

### 要件1: サービスとテクノロジーの入力

**ユーザーストーリー:** 開発者として、管理しているサービスとそこで使用している技術スタックを入力したい。そうすることで、EOL情報を追跡できるようになる。

#### 受入基準

1. THE System SHALL サービス名を入力するためのフォームフィールドを提供する
2. THE System SHALL 各サービスに対して複数のTechnologyを追加できる機能を提供する
3. WHEN ユーザーがTechnologyを追加する場合、THE System SHALL Technology名と現在使用中のVersionを入力できるようにする
4. THE System SHALL 入力されたすべてのデータをURL_Stateとして保存する
5. WHEN 無効なデータ（空のサービス名や空のTechnology名）が入力された場合、THE System SHALL エラーメッセージを表示し、データの追加を防止する

### 要件2: endoflife.dateからのデータ取得

**ユーザーストーリー:** システム管理者として、最新のEOL情報を自動的に取得したい。そうすることで、手動でデータを更新する必要がなくなる。

#### 受入基準

1. WHEN アプリケーションがビルドされる場合、THE System SHALL endoflife.date APIから利用可能なすべてのTechnology情報を取得する
2. THE System SHALL 各Technologyについて、すべてのVersionとそれぞれのEOL_Dateを取得する
3. IF APIリクエストが失敗した場合、THEN THE System SHALL エラーをログに記録し、ビルドを失敗させる
4. THE System SHALL 取得したデータを静的ファイルとして保存し、クライアント側で利用できるようにする
5. THE System SHALL 取得したデータにリリース日、サポート終了日、拡張サポート終了日が含まれる場合、それらを保持する

### 要件3: ガントチャートによるタイムライン表示

**ユーザーストーリー:** 開発者として、複数のサービスのEOL情報をガントチャート形式で視覚的に確認したい。そうすることで、どのバージョンがいつサポート終了するかを一目で把握できる。

#### 受入基準

1. THE System SHALL 入力されたすべてのServiceとTechnologyをGantt_Chartとして表示する
2. WHEN Serviceが複数のTechnologyを持つ場合、THE System SHALL 各Technologyを個別の行として表示する
3. WHEN Technologyに現在のVersionが指定されている場合、THE System SHALL 現在のVersionから最新Versionまでのすべてのバージョンを表示する
4. THE System SHALL 各Versionのバーを、リリース日からEOL_Dateまでの期間として表示する
5. THE System SHALL 現在日付を示す垂直線をチャート上に表示する
6. THE System SHALL すでにEOLを迎えたVersionを視覚的に区別できるようにする（例：異なる色で表示）
7. WHEN ユーザーがチャート上のバーにホバーした場合、THE System SHALL Version番号、リリース日、EOL_Dateを含む詳細情報を表示する

### 要件4: URL共有機能

**ユーザーストーリー:** チームリーダーとして、設定したEOLタイムラインをチームメンバーと共有したい。そうすることで、全員が同じ情報を確認できる。

#### 受入基準

1. THE System SHALL すべての入力データ（Service、Technology、Version）をURLパラメータとしてエンコードする
2. WHEN ユーザーがデータを入力または変更した場合、THE System SHALL URLを自動的に更新する
3. WHEN ユーザーがURL_Stateを含むURLにアクセスした場合、THE System SHALL URLからデータをデコードし、アプリケーションの状態を復元する
4. THE System SHALL URLが最大長制限を超えないように、データを効率的にエンコードする
5. IF URLのデコードに失敗した場合、THEN THE System SHALL エラーメッセージを表示し、空の状態から開始する

### 要件5: レスポンシブデザイン

**ユーザーストーリー:** ユーザーとして、デスクトップでもモバイルデバイスでもEOL情報を確認したい。そうすることで、どこからでもアクセスできる。

#### 受入基準

1. THE System SHALL デスクトップ、タブレット、モバイルデバイスで適切に表示される
2. WHEN 画面幅が狭い場合、THE System SHALL Gantt_Chartを水平スクロール可能にする
3. THE System SHALL タッチデバイスでのスクロールとズーム操作をサポートする
4. WHEN モバイルデバイスで表示される場合、THE System SHALL 入力フォームを縦方向に最適化して表示する

### 要件6: 静的サイト生成

**ユーザーストーリー:** システム管理者として、アプリケーションを静的サイトとしてデプロイしたい。そうすることで、サーバーレスで低コストに運用できる。

#### 受入基準

1. THE System SHALL Next.jsの静的エクスポート機能を使用してビルドされる
2. THE System SHALL ビルド時にすべての必要なデータを取得し、静的ファイルに含める
3. THE System SHALL クライアント側でのみ動作し、サーバー側の処理を必要としない
4. THE System SHALL 標準的な静的ホスティングサービス（Netlify、Vercel、GitHub Pagesなど）にデプロイ可能である

### 要件7: エラーハンドリング

**ユーザーストーリー:** ユーザーとして、エラーが発生した場合に何が問題なのかを理解したい。そうすることで、適切に対処できる。

#### 受入基準

1. WHEN 入力データが無効な場合、THE System SHALL 具体的なエラーメッセージを表示する
2. WHEN 指定されたTechnologyがendoflife.dateで見つからない場合、THE System SHALL ユーザーに通知し、そのTechnologyをスキップする
3. WHEN ネットワークエラーやデータ読み込みエラーが発生した場合、THE System SHALL ユーザーフレンドリーなエラーメッセージを表示する
4. THE System SHALL エラー発生時もアプリケーションがクラッシュせず、部分的に機能し続けるようにする
