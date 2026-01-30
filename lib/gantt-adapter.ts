import { Service, EOLDataMap, GanttScale, EOLCycle } from './types';

// ライフサイクルステージの定義
// - current: 最新・推奨バージョン（緑 #22c55e）
// - active: アクティブサポート中（青 #3b82f6）
// - maintenance: メンテナンスモード（グレー #94a3b8）
// - eol: サポート終了（赤 #ef4444）
type LifecycleStage = 'current' | 'active' | 'maintenance' | 'eol';

interface GanttTask {
  id: string | number;
  text: string;
  start: Date;
  end: Date;
  type: 'task' | 'summary';
  parent?: string | number;
  progress?: number;
  css?: string;
  segments?: Array<{
    start: Date;
    end: Date;
    stage: LifecycleStage;
  }>;
  details?: string;
}

/**
 * ServiceデータをGanttTask配列に変換する関数
 * 要件 3.1, 3.2, 3.3, 3.4, 3.6 を満たす実装
 * 
 * サービスごとに独立したガントチャートデータを生成
 * 一つのバージョンを期間ごとに分割して色分け
 */
export function convertToGanttData(
  services: Service[],
  eolData: EOLDataMap
): { tasks: GanttTask[]; scales: GanttScale[] } {
  const tasks: GanttTask[] = [];
  let taskId = 1;
  
  // サービスごとに処理
  for (const service of services) {
    // 技術ごとに処理
    for (const tech of service.technologies) {
      const productData = eolData[tech.name];
      if (!productData) {
        console.warn(`EOL data not found for technology: ${tech.name}`);
        continue;
      }
      
      // 要件 3.3: 現在のVersionから最新Versionまでのすべてのバージョンを表示する
      const relevantCycles = getRelevantCycles(
        productData.cycles,
        tech.currentVersion
      );
      
      // バージョンタスクを作成
      for (const cycle of relevantCycles) {
        // cycle.eolがfalseの場合は、supportまたは適切な終了日を設定
        let eolDateStr: string;
        if (typeof cycle.eol === 'string') {
          eolDateStr = cycle.eol;
        } else if (cycle.eol === false) {
          // eolがfalseの場合、supportがあればそれを使用、なければ5年後を設定
          if (cycle.support && typeof cycle.support === 'string') {
            eolDateStr = cycle.support;
          } else {
            const releaseDate = new Date(cycle.releaseDate);
            releaseDate.setFullYear(releaseDate.getFullYear() + 5);
            eolDateStr = releaseDate.toISOString().split('T')[0];
          }
        } else {
          continue;
        }
        
        if (!cycle.releaseDate) {
          continue;
        }
        
        const startDate = new Date(cycle.releaseDate);
        const endDate = new Date(eolDateStr);
        const now = new Date();
        
        // 現在使用中のバージョンかどうかを判定
        const isCurrentVersion = compareVersions(cycle.cycle, tech.currentVersion) === 0;
        
        // 期間を分割してセグメントを作成
        const stages = calculateStages(cycle, startDate, endDate);
        const segments = stages.map(stage => ({
          start: stage.start,
          end: stage.end,
          stage: stage.stage,
        }));
        const lifecycleStage = getLifecycleStage(cycle, startDate, endDate);

        const task: GanttTask = {
          id: taskId++,
          text: `${tech.name} ${cycle.cycle}${isCurrentVersion ? ' ★' : ''}`,
          start: startDate,
          end: endDate,
          type: 'task',
          progress: 0,
          css: `stage-${lifecycleStage}${isCurrentVersion ? ' current-version' : ''}`,
          segments,
          details: JSON.stringify({
            version: cycle.cycle,
            eolDate: eolDateStr,
            releaseDate: cycle.releaseDate,
            stage: lifecycleStage,
            lts: cycle.lts || false,
            techName: tech.name,
            serviceName: service.name,
            isCurrentVersion,
          }),
        };
        
        tasks.push(task);
      }
    }
  }
  
  // GanttScale配列を生成
  const scales = generateGanttScales();
  
  return { tasks, scales };
}

/**
 * バージョンの期間をステージごとに分割する関数
 * 
 * セグメント分割ルール（endoflife.date APIのデータ構造に基づく）:
 * 
 * パターン1: LTS日付あり（例: Node.js LTS）
 *   - releaseDate → lts: current（緑）
 *   - lts → support: active（青）
 *   - support → eol: maintenance（グレー）
 * 
 * パターン2: supportあり、LTSなし（例: Rails、Python、PHP）
 *   - releaseDate → support: active（青）
 *   - support → eol: maintenance（グレー）
 * 
 * パターン3: supportなし（例: Ruby、PostgreSQL、Go）
 *   - releaseDate → eol: active（青）全期間
 * 
 * パターン4: EOL済み
 *   - 全期間: eol（赤）
 */
function calculateStages(
  cycle: EOLCycle,
  startDate: Date,
  endDate: Date
): Array<{ start: Date; end: Date; stage: 'current' | 'active' | 'maintenance' | 'eol' }> {
  const now = new Date();
  
  // EOL済みの場合は全期間を赤色で表示
  if (endDate < now) {
    return [{
      start: startDate,
      end: endDate,
      stage: 'eol'
    }];
  }
  
  // パターン1: LTSバージョン（ltsフィールドが日付文字列）
  if (cycle.lts && typeof cycle.lts === 'string') {
    const ltsDate = new Date(cycle.lts);
    const segments: Array<{ start: Date; end: Date; stage: 'current' | 'active' | 'maintenance' | 'eol' }> = [];
    
    // releaseDate → lts: current（緑）
    segments.push({
      start: startDate,
      end: ltsDate,
      stage: 'current'
    });
    
    // lts → support: active（青）
    if (cycle.support && typeof cycle.support === 'string') {
      const supportDate = new Date(cycle.support);
      segments.push({
        start: ltsDate,
        end: supportDate,
        stage: 'active'
      });
      
      // support → eol: maintenance（グレー）
      segments.push({
        start: supportDate,
        end: endDate,
        stage: 'maintenance'
      });
    } else {
      // supportがない場合は、lts → eol を active
      segments.push({
        start: ltsDate,
        end: endDate,
        stage: 'active'
      });
    }
    
    return segments;
  }
  
  // パターン2: 非LTSバージョンでsupportあり
  if (cycle.support && typeof cycle.support === 'string') {
    const supportDate = new Date(cycle.support);
    
    return [
      // releaseDate → support: active（青）
      {
        start: startDate,
        end: supportDate,
        stage: 'active'
      },
      // support → eol: maintenance（グレー）
      {
        start: supportDate,
        end: endDate,
        stage: 'maintenance'
      }
    ];
  }
  
  // パターン3: supportフィールドがない場合は、全期間をactiveとして表示
  return [{
    start: startDate,
    end: endDate,
    stage: 'active'
  }];
}

/**
 * ライフサイクルステージを判定する関数
 * 
 * 判定ロジック（endoflife.date APIのデータ構造に基づく）:
 * 1. EOL日が過去 → eol
 * 2. ltsフィールドが文字列（日付）の場合:
 *    - 現在 < lts: current
 *    - lts ≤ 現在 < support: active
 *    - support ≤ 現在: maintenance
 * 3. supportフィールドがある場合:
 *    - 現在 < support: active
 *    - support ≤ 現在: maintenance
 * 4. supportフィールドがない場合:
 *    - active（全期間）
 */
function getLifecycleStage(
  cycle: EOLCycle,
  startDate: Date,
  endDate: Date
): 'current' | 'active' | 'maintenance' | 'eol' {
  const now = new Date();
  
  // 1. EOL済み（サポート終了）
  if (endDate < now) return 'eol';
  
  // 2. LTSバージョン（ltsフィールドが日付文字列）
  if (cycle.lts && typeof cycle.lts === 'string') {
    const ltsDate = new Date(cycle.lts);
    if (cycle.support && typeof cycle.support === 'string') {
      const supportDate = new Date(cycle.support);
      // 現在日時がどの期間にあるかで判定
      if (now < ltsDate) return 'current';
      if (now < supportDate) return 'active';
      return 'maintenance';
    }
    // supportがない場合
    if (now < ltsDate) return 'current';
    return 'active';
  }
  
  // 3. 非LTSバージョンでsupportあり
  if (cycle.support && typeof cycle.support === 'string') {
    const supportDate = new Date(cycle.support);
    if (now < supportDate) return 'active';
    return 'maintenance';
  }
  
  // 4. supportフィールドがない場合
  return 'active';
}

/**
 * 現在バージョンから最新までの関連サイクルを取得する関数
 * 要件 3.3 を満たす実装
 */
export function getRelevantCycles(cycles: EOLCycle[], currentVersion: string): EOLCycle[] {
  if (!cycles || cycles.length === 0) {
    return [];
  }
  
  // 有効なサイクル（リリース日とEOL日があるもの）をフィルタリング
  const validCycles = cycles.filter(cycle => 
    cycle.releaseDate && 
    typeof cycle.eol === 'string'
  );
  
  if (validCycles.length === 0) {
    return [];
  }
  
  // リリース日でソート（古い順）
  validCycles.sort((a, b) => 
    new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
  );
  
  // currentVersionが空の場合は、すべてのサイクルを返す
  if (!currentVersion || currentVersion.trim() === '') {
    return validCycles;
  }
  
  // 現在バージョンのインデックスを見つける
  const currentIndex = validCycles.findIndex(cycle => 
    compareVersions(cycle.cycle, currentVersion) >= 0
  );
  
  // 現在バージョンが見つからない場合は、すべてのサイクルを返す
  if (currentIndex === -1) {
    return validCycles;
  }
  
  // 現在バージョンから最新までのサイクルを返す
  return validCycles.slice(currentIndex);
}

/**
 * バージョンがEOL済みかどうかを判定する関数
 * 要件 3.6 を満たす実装
 */
export function isVersionEOL(eolDate: string | boolean): boolean {
  if (eolDate === false) {
    return false;
  }
  
  if (typeof eolDate === 'string') {
    const eol = new Date(eolDate);
    const now = new Date();
    return eol < now;
  }
  
  return false;
}

/**
 * GanttScale配列を生成する関数
 */
export function generateGanttScales(): GanttScale[] {
  return [
    { unit: 'year', step: 1, format: 'YYYY' },
    { unit: 'month', step: 1, format: 'MMM' },
  ];
}

/**
 * バージョン文字列を比較する関数
 * セマンティックバージョニングに対応した比較を行う
 * 
 * @param version1 比較対象のバージョン1
 * @param version2 比較対象のバージョン2
 * @returns version1 > version2 なら正の数、version1 < version2 なら負の数、等しければ0
 */
function compareVersions(version1: string, version2: string): number {
  // バージョン文字列を正規化（数字以外の文字を除去）
  const normalize = (v: string): number[] => {
    return v.replace(/[^\d.]/g, '')
      .split('.')
      .map(part => parseInt(part, 10) || 0);
  };
  
  const v1Parts = normalize(version1);
  const v2Parts = normalize(version2);
  
  // 長さを合わせる
  const maxLength = Math.max(v1Parts.length, v2Parts.length);
  while (v1Parts.length < maxLength) v1Parts.push(0);
  while (v2Parts.length < maxLength) v2Parts.push(0);
  
  // 各部分を比較
  for (let i = 0; i < maxLength; i++) {
    if (v1Parts[i] > v2Parts[i]) return 1;
    if (v1Parts[i] < v2Parts[i]) return -1;
  }
  
  return 0;
}
