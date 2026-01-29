/**
 * URL State Management
 * 
 * このモジュールは、アプリケーションの状態をURLパラメータとして
 * エンコード/デコードする機能を提供します。
 * 
 * フォーマット: サービス名(技術:バージョン,技術:バージョン);サービス名(技術:バージョン)
 * 例: myapp(python:3.9,nodejs:18.0);api(go:1.20)
 */

import { Service, Technology, URLState } from './types';

/**
 * URLの最大長制限（ブラウザの一般的な制限）
 */
export const MAX_URL_LENGTH = 2048;

/**
 * 現在のスキーマバージョン
 */
const SCHEMA_VERSION = 1;

/**
 * 特殊文字（エスケープが必要な文字）のパターン
 * スペースと区切り文字（:, ;, ,, (, )）
 */
const SPECIAL_CHARS_PATTERN = /[:;,() ]/;

/**
 * 文字列に特殊文字が含まれている場合のみエンコードします
 * 
 * @param str - エンコード対象の文字列
 * @returns エンコードされた文字列（特殊文字がない場合はそのまま）
 */
function encodeIfNeeded(str: string): string {
  if (SPECIAL_CHARS_PATTERN.test(str)) {
    return encodeURIComponent(str);
  }
  return str;
}

/**
 * 文字列をデコードします（エンコードされている場合のみ）
 * 
 * @param str - デコード対象の文字列
 * @returns デコードされた文字列
 */
function decodeIfNeeded(str: string): string {
  // %が含まれている場合はエンコードされているとみなす
  if (str.includes('%')) {
    return decodeURIComponent(str);
  }
  return str;
}

/**
 * URLStateをセミコロン区切り形式の文字列にエンコードします
 * 
 * @param state - エンコードするURLState
 * @returns エンコードされた文字列
 * @throws Error - URL長が制限を超える場合
 */
export function encodeURLState(state: URLState): string {
  if (!state.services || state.services.length === 0) {
    return '';
  }

  const encodedServices = state.services.map(service => {
    // サービス名をエスケープ（特殊文字が含まれる場合のみ）
    const serviceName = encodeIfNeeded(service.name);
    
    // 技術リストをエンコード
    const technologies = service.technologies
      .map(tech => {
        const techName = encodeIfNeeded(tech.name);
        const version = encodeIfNeeded(tech.currentVersion);
        return `${techName}:${version}`;
      })
      .join(',');
    
    return `${serviceName}(${technologies})`;
  });

  const encoded = encodedServices.join(';');
  
  // URL長チェック（エンコード後の実際の長さで確認）
  // URLエンコードされた文字列の長さを考慮
  const fullUrl = `?s=${encoded}`;
  if (fullUrl.length > MAX_URL_LENGTH) {
    throw new Error(
      `URL length (${fullUrl.length}) exceeds maximum allowed length (${MAX_URL_LENGTH})`
    );
  }

  return encoded;
}

/**
 * セミコロン区切り形式の文字列をURLStateにデコードします
 * 
 * @param encoded - デコードする文字列
 * @returns デコードされたURLState
 * @throws Error - フォーマットが不正な場合
 */
export function decodeURLState(encoded: string): URLState {
  if (!encoded || encoded.trim() === '') {
    return {
      version: SCHEMA_VERSION,
      services: [],
    };
  }

  try {
    const services: Service[] = [];
    
    // セミコロンでサービスに分割
    const serviceStrings = encoded.split(';');
    
    for (let i = 0; i < serviceStrings.length; i++) {
      const serviceString = serviceStrings[i].trim();
      if (!serviceString) continue;
      
      // サービス名と技術リストに分割
      const openParenIndex = serviceString.indexOf('(');
      const closeParenIndex = serviceString.lastIndexOf(')');
      
      if (openParenIndex === -1 || closeParenIndex === -1) {
        throw new Error(
          `Invalid service format: missing parentheses in "${serviceString}"`
        );
      }
      
      if (openParenIndex === 0) {
        throw new Error(
          `Invalid service format: missing service name in "${serviceString}"`
        );
      }
      
      // サービス名をデコード
      const serviceName = decodeIfNeeded(
        serviceString.substring(0, openParenIndex)
      );
      
      if (!serviceName || serviceName.trim() === '') {
        throw new Error('Service name cannot be empty');
      }
      
      // 技術リストを抽出
      const techListString = serviceString.substring(
        openParenIndex + 1,
        closeParenIndex
      );
      
      const technologies: Technology[] = [];
      
      if (techListString.trim()) {
        // カンマで技術に分割
        const techStrings = techListString.split(',');
        
        for (let j = 0; j < techStrings.length; j++) {
          const techString = techStrings[j].trim();
          if (!techString) continue;
          
          // コロンで技術名とバージョンに分割
          const colonIndex = techString.indexOf(':');
          
          if (colonIndex === -1) {
            throw new Error(
              `Invalid technology format: missing colon in "${techString}"`
            );
          }
          
          const techName = decodeIfNeeded(
            techString.substring(0, colonIndex)
          );
          const version = decodeIfNeeded(
            techString.substring(colonIndex + 1)
          );
          
          if (!techName || techName.trim() === '') {
            throw new Error('Technology name cannot be empty');
          }
          
          if (!version || version.trim() === '') {
            throw new Error('Technology version cannot be empty');
          }
          
          technologies.push({
            id: `${serviceName}-${techName}-${j}`,
            name: techName,
            currentVersion: version,
          });
        }
      }
      
      services.push({
        id: `service-${i}`,
        name: serviceName,
        technologies,
      });
    }
    
    // スキーマバリデーション
    validateURLState({ version: SCHEMA_VERSION, services });
    
    return {
      version: SCHEMA_VERSION,
      services,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to decode URL state: ${error.message}`);
    }
    throw new Error('Failed to decode URL state: Unknown error');
  }
}

/**
 * 現在のURLからURLStateを取得します
 * 
 * @returns URLStateの取得結果
 */
export function getURLStateFromCurrentURL(): {
  success: boolean;
  data?: URLState;
  error?: { type: string; message: string };
} {
  try {
    // ブラウザ環境でない場合は空の状態を返す
    if (typeof window === 'undefined') {
      return {
        success: true,
        data: {
          version: SCHEMA_VERSION,
          services: [],
        },
      };
    }

    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('s');

    if (!dataParam) {
      return {
        success: true,
        data: {
          version: SCHEMA_VERSION,
          services: [],
        },
      };
    }

    const decoded = decodeURLState(dataParam);
    return {
      success: true,
      data: decoded,
    };
  } catch (error) {
    console.error('Failed to get URL state:', error);
    return {
      success: false,
      error: {
        type: 'DECODE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * URLStateを現在のURLに設定します
 * 
 * @param state - 設定するURLState
 * @returns 設定結果
 */
export function setURLState(state: URLState): {
  success: boolean;
  error?: { type: string; message: string };
} {
  try {
    // ブラウザ環境でない場合は何もしない
    if (typeof window === 'undefined') {
      return { success: true };
    }

    const encoded = encodeURLState(state);
    
    if (!encoded) {
      // 空の場合はURLパラメータをクリア
      const url = new URL(window.location.href);
      url.searchParams.delete('s');
      window.history.replaceState({}, '', url.toString());
      return { success: true };
    }

    const url = new URL(window.location.href);
    url.searchParams.set('s', encoded);
    window.history.replaceState({}, '', url.toString());
    
    return { success: true };
  } catch (error) {
    console.error('Failed to set URL state:', error);
    
    // URL長制限エラーの場合は特別な処理
    if (error instanceof Error && error.message.includes('exceeds maximum')) {
      return {
        success: false,
        error: {
          type: 'URL_TOO_LONG',
          message: error.message,
        },
      };
    }
    
    return {
      success: false,
      error: {
        type: 'ENCODE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * URLからdataパラメータをクリアします
 */
export function clearURLState(): void {
  // ブラウザ環境でない場合は何もしない
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete('s');
  window.history.replaceState({}, '', url.toString());
}

/**
 * URLStateのスキーマバリデーションを実行します
 * 
 * @param state - バリデーションするURLState
 * @throws Error - バリデーションに失敗した場合
 */
export function validateURLState(state: URLState): void {
  if (!state) {
    throw new Error('URLState cannot be null or undefined');
  }
  
  if (typeof state.version !== 'number') {
    throw new Error('URLState version must be a number');
  }
  
  if (!Array.isArray(state.services)) {
    throw new Error('URLState services must be an array');
  }
  
  for (const service of state.services) {
    if (!service.id || typeof service.id !== 'string') {
      throw new Error('Service id must be a non-empty string');
    }
    
    if (!service.name || typeof service.name !== 'string') {
      throw new Error('Service name must be a non-empty string');
    }
    
    if (!Array.isArray(service.technologies)) {
      throw new Error('Service technologies must be an array');
    }
    
    for (const tech of service.technologies) {
      if (!tech.id || typeof tech.id !== 'string') {
        throw new Error('Technology id must be a non-empty string');
      }
      
      if (!tech.name || typeof tech.name !== 'string') {
        throw new Error('Technology name must be a non-empty string');
      }
      
      if (!tech.currentVersion || typeof tech.currentVersion !== 'string') {
        throw new Error('Technology currentVersion must be a non-empty string');
      }
    }
  }
}
