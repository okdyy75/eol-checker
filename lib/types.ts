/**
 * EOL Timeline Viewer - Type Definitions
 * 
 * This file contains all type definitions for the EOL Timeline Viewer application.
 * These types define the core data structures for services, technologies, EOL data,
 * Gantt chart components, and URL state management.
 */

// ============================================================================
// Service and Technology Types
// ============================================================================

/**
 * サービス定義
 * アプリケーション内で管理される個々のサービスを表現
 */
export interface Service {
  id: string;
  name: string;
  technologies: Technology[];
}

/**
 * 技術スタック定義
 * サービスで使用される技術とそのバージョン情報
 */
export interface Technology {
  id: string;
  name: string;           // 例: "python", "nodejs"
  currentVersion: string; // 例: "3.9"
}

// ============================================================================
// EOL Data Types (endoflife.date API)
// ============================================================================

/**
 * EOLサイクル情報
 * endoflife.date APIから取得される個々のバージョンサイクル情報
 */
export interface EOLCycle {
  cycle: string;          // バージョン番号
  releaseDate: string;    // リリース日（ISO 8601）
  eol: string | boolean;  // EOL日（ISO 8601）またはfalse
  support?: string;       // サポート終了日（オプション）
  lts?: boolean;          // LTSかどうか
}

/**
 * EOL製品情報
 * 特定の技術製品のすべてのサイクル情報を含む
 */
export interface EOLProduct {
  productName: string;
  cycles: EOLCycle[];
}

/**
 * EOLデータマップ
 * 技術名をキーとしたEOL製品情報のマッピング
 */
export type EOLDataMap = Record<string, EOLProduct>;

// ============================================================================
// Gantt Chart Types
// ============================================================================

/**
 * ガントチャートタスク
 * ガントチャートで表示される個々のタスク項目
 */
export interface GanttTask {
  id: string | number;
  text: string;           // 表示名
  start: Date;            // 開始日
  end: Date;              // 終了日
  type: "task" | "summary";
  parent?: string | number;
  progress?: number;
  css?: string;           // カスタムCSSクラス
  details?: {
    version: string;
    eolDate: string;
    isEOL: boolean;
  };
}

/**
 * ガントチャートリンク
 * タスク間の依存関係を表現
 */
export interface GanttLink {
  id: string | number;
  source: string | number;
  target: string | number;
  type: string;
}

/**
 * ガントチャートスケール
 * ガントチャートの時間軸設定
 */
export interface GanttScale {
  unit: "year" | "month" | "day";
  step: number;
  format: string;
}

// ============================================================================
// URL State Management
// ============================================================================

/**
 * URL状態エンコーディング
 * アプリケーションの状態をURLパラメータとして保存・復元するための構造
 */
export interface URLState {
  version: number;  // スキーマバージョン
  services: Service[];
}