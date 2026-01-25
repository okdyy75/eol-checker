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
    const response = await fetch('/data/eol-data.json');
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
 * キャッシュされたEOLデータを同期的に取得する
 * 
 * loadEOLData() が事前に呼び出されてキャッシュが存在する場合のみ使用可能です。
 * キャッシュが存在しない場合は null を返します。
 * 
 * @returns キャッシュされたEOLデータ、またはnull
 */
export function getCachedEOLData(): EOLDataMap | null {
  return eolDataCache;
}

/**
 * 技術名が存在するかチェックする
 * 
 * @param eolData EOLデータマップ
 * @param productName チェックする技術名
 * @returns 技術名が存在する場合 true
 */
export function hasEOLProduct(eolData: EOLDataMap, productName: string): boolean {
  return productName in eolData;
}

/**
 * 複数の技術名を一度に検索する
 * 
 * @param eolData EOLデータマップ
 * @param productNames 検索する技術名の配列
 * @returns 見つかった製品情報のマップ（存在しない技術は含まれない）
 */
export function findMultipleEOLProducts(
  eolData: EOLDataMap, 
  productNames: string[]
): Record<string, EOLProduct> {
  const result: Record<string, EOLProduct> = {};
  
  for (const productName of productNames) {
    const product = findEOLProduct(eolData, productName);
    if (product) {
      result[productName] = product;
    }
  }
  
  return result;
}