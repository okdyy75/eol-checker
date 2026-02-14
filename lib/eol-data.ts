import { EOLDataMap, EOLProduct } from './types';

// データキャッシュ用のグローバル変数
let eolDataCache: EOLDataMap | null = null;
let cachePromise: Promise<EOLDataMap> | null = null;

/**
 * 静的JSONファイルからEOLデータを読み込む（キャッシング機能付き）
 * 
 * 初回読み込み時にデータをキャッシュし、以降の呼び出しではキャッシュされたデータを返します。
 * 複数の同時呼び出しがあった場合でも、実際のfetchは一度だけ実行されます。
 */
export async function loadEOLData(): Promise<EOLDataMap> {
  // キャッシュされたデータがある場合はそれを返す
  if (eolDataCache !== null) {
    return eolDataCache;
  }

  // 既に読み込み中の場合は、その Promise を返す
  if (cachePromise !== null) {
    return cachePromise;
  }

  // 新しい読み込みを開始
  cachePromise = fetchEOLDataFromFile();
  
  try {
    eolDataCache = await cachePromise;
    return eolDataCache;
  } catch (error) {
    // エラーが発生した場合はキャッシュをクリアして再試行可能にする
    cachePromise = null;
    throw error;
  }
}

/**
 * 実際のファイル読み込み処理
 */
async function fetchEOLDataFromFile(): Promise<EOLDataMap> {
  try {
    // ベースパスを考慮したパスを生成
    // NEXT_PUBLIC_BASE_PATHはビルド時に埋め込まれる
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const dataPath = `${basePath}/data/eol-data.json`;
    
    console.log('Fetching EOL data from:', dataPath); // デバッグ用
    
    const response = await fetch(dataPath);
    if (!response.ok) {
      throw new Error(`Failed to load EOL data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    
    // データの基本的な検証
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid EOL data format: expected object');
    }
    
    return data;
  } catch (error) {
    console.error('Error loading EOL data:', error);
    // エラーの場合は空のオブジェクトではなく、エラーを再スローする
    // これにより呼び出し元でエラーハンドリングが可能になる
    throw error;
  }
}

/**
 * 特定の技術名でEOLデータを検索
 * 
 * @param eolData EOLデータマップ
 * @param productName 検索する技術名
 * @returns 見つかった製品情報、または null
 */
export function findEOLProduct(eolData: EOLDataMap, productName: string): EOLProduct | null {
  return eolData[productName] || null;
}

/**
 * 利用可能な技術名のリストを取得
 * 
 * @param eolData EOLデータマップ
 * @returns ソートされた技術名の配列
 */
export function getAvailableTechnologies(eolData: EOLDataMap): string[] {
  return Object.keys(eolData).sort();
}

/**
 * EOLデータのキャッシュをクリアする
 * 
 * テスト時やデータを強制的に再読み込みしたい場合に使用します。
 */
export function clearEOLDataCache(): void {
  eolDataCache = null;
  cachePromise = null;
}

/**
 * 特定の技術の利用可能なバージョンリストを取得
 * 
 * @param eolData EOLデータマップ
 * @param productName 技術名
 * @returns バージョン番号の配列（新しい順）、技術が存在しない場合は空配列
 */
export function getVersionsForTechnology(
  eolData: EOLDataMap,
  productName: string
): string[] {
  const product = findEOLProduct(eolData, productName);
  if (!product || !product.cycles) {
    return [];
  }
  
  // cyclesからバージョン番号を抽出し、新しい順にソート
  return product.cycles
    .map(cycle => cycle.cycle)
    .sort((a, b) => {
      // セマンティックバージョニングに対応した比較
      const partsA = a.split('.').map(Number);
      const partsB = b.split('.').map(Number);
      
      // 各パートを順番に比較
      const maxLength = Math.max(partsA.length, partsB.length);
      for (let i = 0; i < maxLength; i++) {
        const numA = partsA[i] || 0;
        const numB = partsB[i] || 0;
        
        if (numB !== numA) {
          return numB - numA;
        }
      }
      
      // すべてのパートが同じ場合は文字列長で比較（より詳細なバージョンを優先）
      return b.length - a.length;
    });
}