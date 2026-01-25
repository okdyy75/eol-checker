import { Service, EOLDataMap, GanttScale, EOLCycle } from './types';
import { ITask } from '@svar-ui/react-gantt';

/**
 * ServiceデータをGanttTask配列に変換する関数
 * 要件 3.1, 3.2, 3.3, 3.4, 3.6 を満たす実装
 */
export function convertToGanttData(
  services: Service[],
  eolData: EOLDataMap
): { tasks: ITask[]; scales: GanttScale[] } {
  const tasks: ITask[] = [];
  let taskId = 1;
  
  // 要件 3.1: 入力されたすべてのServiceとTechnologyをGantt_Chartとして表示する
  for (const service of services) {
    // サービスをサマリータスクとして追加
    const serviceId = taskId++;
    
    // サマリータスクの期間を計算（子タスクの最小開始日〜最大終了日）
    let minStart = new Date();
    let maxEnd = new Date();
    let hasValidTasks = false;
    
    // 一時的に子タスクを収集して期間を計算
    const tempTasks: ITask[] = [];
    
    // 要件 3.2: Serviceが複数のTechnologyを持つ場合、各Technologyを個別の行として表示する
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
      
      for (const cycle of relevantCycles) {
        // cycle.eolがfalseまたは存在しない場合はスキップ
        if (!cycle.releaseDate || typeof cycle.eol !== 'string') {
          continue;
        }
        
        const startDate = new Date(cycle.releaseDate);
        const endDate = new Date(cycle.eol);
        
        // 要件 3.6: すでにEOLを迎えたVersionを視覚的に区別できるようにする
        const isEOL = isVersionEOL(cycle.eol);
        
        // 要件 3.4: 各Versionのバーを、リリース日からEOL_Dateまでの期間として表示する
        const task: ITask = {
          id: taskId++,
          text: `${tech.name} ${cycle.cycle}`,
          start: startDate,
          end: endDate,
          type: 'task',
          parent: serviceId,
          progress: isEOL ? 100 : 0, // EOL済みは100%、未EOLは0%
          css: isEOL ? 'eol-task' : 'active-task', // 要件 3.6: EOL状態に応じたCSSクラス
          // detailsはstring型でJSONとして保存
          details: JSON.stringify({
            version: cycle.cycle,
            eolDate: cycle.eol,
            isEOL,
          }),
        };
        
        tempTasks.push(task);
        
        // サマリータスクの期間を更新
        if (!hasValidTasks) {
          minStart = startDate;
          maxEnd = endDate;
          hasValidTasks = true;
        } else {
          if (startDate < minStart) minStart = startDate;
          if (endDate > maxEnd) maxEnd = endDate;
        }
      }
    }
    
    // サマリータスクを追加（子タスクがある場合のみ）
    if (hasValidTasks) {
      tasks.push({
        id: serviceId,
        text: service.name,
        start: minStart,
        end: maxEnd,
        type: 'summary',
      });
      
      // 子タスクを追加
      tasks.push(...tempTasks);
    }
  }
  
  // GanttScale配列を生成
  const scales = generateGanttScales();
  
  return { tasks, scales };
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