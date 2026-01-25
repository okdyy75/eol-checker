#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import * as path from 'path';
import { EOLDataMap, EOLCycle } from '../lib/types';

const API_BASE_URL = 'https://endoflife.date/api';
const OUTPUT_DIR = 'public/data';
const OUTPUT_FILE = 'eol-data.json';

/**
 * endoflife.date APIから全製品リストを取得
 */
async function fetchAllProducts(): Promise<string[]> {
  try {
    console.log('🌐 全製品リストを取得中...');
    return await fetchWithRetry<string[]>(`${API_BASE_URL}/all.json`);
  } catch (error) {
    console.error('❌ 製品リストの取得に失敗しました:', error);
    throw error;
  }
}

/**
 * 特定の製品のEOLサイクル情報を取得
 */
async function fetchProductCycles(productName: string): Promise<EOLCycle[]> {
  try {
    return await fetchWithRetry<EOLCycle[]>(`${API_BASE_URL}/${productName}.json`);
  } catch (error) {
    console.error(`❌ ${productName} のサイクル情報取得に失敗:`, error);
    return []; // エラーの場合は空配列を返す
  }
}

/**
 * 指定された遅延時間だけ待機
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * リトライロジック付きでAPIリクエストを実行
 */
async function fetchWithRetry<T>(
  url: string, 
  maxRetries: number = 3, 
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️  試行 ${attempt}/${maxRetries} 失敗: ${url} - ${lastError.message}`);
      
      if (attempt < maxRetries) {
        console.log(`⏳ ${delayMs}ms 待機後にリトライします...`);
        await delay(delayMs);
      }
    }
  }
  
  throw new Error(`${maxRetries}回の試行後も失敗: ${lastError!.message}`);
}

/**
 * 全製品のEOLデータを取得してJSONファイルに保存
 * @param limitProducts テスト用に製品数を制限する場合の数値（本番では undefined）
 */
async function fetchEOLData(limitProducts?: number): Promise<void> {
  console.log('🚀 EOLデータの取得を開始します...');
  
  try {
    // 出力ディレクトリを作成
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // 全製品リストを取得
    console.log('📋 製品リストを取得中...');
    const allProducts = await fetchAllProducts();
    console.log(`✅ ${allProducts.length}個の製品を発見しました`);
    
    // 製品数を制限（テスト用）
    const products = limitProducts ? allProducts.slice(0, limitProducts) : allProducts;
    if (limitProducts) {
      console.log(`🔧 テスト用に最初の${products.length}製品を処理します`);
    }
    
    // 各製品の詳細を取得
    const eolData: EOLDataMap = {};
    let processedCount = 0;
    let successCount = 0;
    
    for (const product of products) {
      console.log(`📦 ${product} のデータを取得中... (${processedCount + 1}/${products.length})`);
      
      const cycles = await fetchProductCycles(product);
      if (cycles.length > 0) {
        eolData[product] = {
          productName: product,
          cycles: cycles
        };
        successCount++;
      }
      
      processedCount++;
      
      // API制限を避けるため少し待機（本番では間隔を長くする）
      const waitInterval = limitProducts ? 5 : 10;
      const waitTime = limitProducts ? 500 : 1000;
      
      if (processedCount % waitInterval === 0) {
        console.log(`⏳ API制限を避けるため${waitTime}ms待機中...`);
        await delay(waitTime);
      }
    }
    
    // 取得したデータが空でないことを確認
    if (Object.keys(eolData).length === 0) {
      throw new Error('取得できたEOLデータがありません。APIに問題がある可能性があります。');
    }
    
    // JSONファイルとして保存
    const outputPath = path.join(OUTPUT_DIR, OUTPUT_FILE);
    await fs.writeFile(outputPath, JSON.stringify(eolData, null, 2), 'utf-8');
    
    console.log(`✅ EOLデータを ${outputPath} に保存しました`);
    console.log(`📊 合計 ${successCount}/${processedCount} 製品のデータを取得しました`);
    
    // 成功率が低い場合は警告
    const successRate = (successCount / processedCount) * 100;
    if (successRate < 50) {
      console.warn(`⚠️  成功率が低いです (${successRate.toFixed(1)}%)。APIに問題がある可能性があります。`);
    }
    
  } catch (error) {
    console.error('❌ EOLデータの取得に失敗しました:', error);
    throw error; // 呼び出し元にエラーを再スロー
  }
}

// メイン実行部分
async function main() {
  try {
    // 環境変数でテストモードを制御
    const isTestMode = process.env.NODE_ENV === 'test' || process.env.FETCH_LIMIT;
    const limitProducts = isTestMode ? 20 : undefined;
    
    await fetchEOLData(limitProducts);
  } catch (error) {
    console.error('❌ スクリプト実行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみ実行
if (process.argv[1] && process.argv[1].endsWith('fetch-eol-data.ts')) {
  main();
}

export { fetchEOLData, fetchAllProducts, fetchProductCycles };