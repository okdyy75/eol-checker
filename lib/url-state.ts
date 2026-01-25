/**
 * URL State Management
 * 
 * このモジュールは、アプリケーションの状態をURLパラメータとして
 * エンコード/デコードする機能を提供します。
 * 
 * 機能:
 * - URLStateをBase64エンコードしてURLパラメータに保存
 * - URLパラメータからBase64デコードしてURLStateを復元
 * - スキーマバリデーション
 * - エラーハンドリング
 * - URL長制限の遵守
 */

import { URLState, Service } from './types';
import { validateForm } from './validation';

// スキーマバージョン定数
const CURRENT_SCHEMA_VERSION = 1;

// URL長制限（ブラウザの一般的な制限）
const MAX_URL_LENGTH = 2048;

/**
 * エラー型定義
 */
export interface URLStateError {
  type: 'DECODE_ERROR' | 'VALIDATION_ERROR' | 'URL_TOO_LONG' | 'SCHEMA_VERSION_MISMATCH';
  message: string;
  details?: any;
}

/**
 * エンコード結果型
 */
export interface EncodeResult {
  success: boolean;
  data?: string;
  error?: URLStateError;
}

/**
 * デコード結果型
 */
export interface DecodeResult {
  success: boolean;
  data?: URLState;
  error?: URLStateError;
}

/**
 * URLStateをBase64エンコードしてURLパラメータ用の文字列に変換
 * 
 * @param state - エンコードするURLState
 * @returns エンコード結果
 */
export function encodeURLState(state: URLState): EncodeResult {
  try {
    // 入力データのバリデーション
    const validationResult = validateForm(state.services);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'データが無効です',
          details: validationResult.errors
        }
      };
    }

    // スキーマバージョンを設定
    const stateWithVersion: URLState = {
      ...state,
      version: CURRENT_SCHEMA_VERSION
    };

    // JSON文字列に変換
    const jsonString = JSON.stringify(stateWithVersion);

    // Base64エンコード
    const base64String = btoa(encodeURIComponent(jsonString));

    // URLセーフな文字列に変換（+を-に、/を_に置換）
    const urlSafeString = base64String
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, ''); // パディングを削除

    // URL長制限チェック
    const fullUrl = `${window.location.origin}${window.location.pathname}?data=${urlSafeString}`;
    if (fullUrl.length > MAX_URL_LENGTH) {
      return {
        success: false,
        error: {
          type: 'URL_TOO_LONG',
          message: `URLが長すぎます（${fullUrl.length}文字、制限: ${MAX_URL_LENGTH}文字）`,
          details: { actualLength: fullUrl.length, maxLength: MAX_URL_LENGTH }
        }
      };
    }

    return {
      success: true,
      data: urlSafeString
    };

  } catch (error) {
    return {
      success: false,
      error: {
        type: 'DECODE_ERROR',
        message: 'エンコード中にエラーが発生しました',
        details: error
      }
    };
  }
}

/**
 * Base64文字列をデコードしてURLStateに変換
 * 
 * @param encodedString - デコードするBase64文字列
 * @returns デコード結果
 */
export function decodeURLState(encodedString: string): DecodeResult {
  try {
    if (!encodedString || encodedString.trim().length === 0) {
      return {
        success: false,
        error: {
          type: 'DECODE_ERROR',
          message: 'エンコードされた文字列が空です'
        }
      };
    }

    // URLセーフな文字列を元に戻す
    let base64String = encodedString
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // パディングを復元
    while (base64String.length % 4) {
      base64String += '=';
    }

    // Base64デコード
    const jsonString = decodeURIComponent(atob(base64String));

    // JSONパース
    const parsedData = JSON.parse(jsonString);

    // 基本的な構造チェック
    if (!parsedData || typeof parsedData !== 'object') {
      return {
        success: false,
        error: {
          type: 'DECODE_ERROR',
          message: 'デコードされたデータが無効な形式です'
        }
      };
    }

    // スキーマバージョンチェック
    if (parsedData.version !== CURRENT_SCHEMA_VERSION) {
      return {
        success: false,
        error: {
          type: 'SCHEMA_VERSION_MISMATCH',
          message: `サポートされていないスキーマバージョンです（現在: ${CURRENT_SCHEMA_VERSION}, 受信: ${parsedData.version}）`,
          details: { 
            currentVersion: CURRENT_SCHEMA_VERSION, 
            receivedVersion: parsedData.version 
          }
        }
      };
    }

    // URLState構造の検証
    const urlState = validateURLStateStructure(parsedData);
    if (!urlState.success) {
      return urlState;
    }

    // データ内容のバリデーション
    const validationResult = validateForm(parsedData.services);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'デコードされたデータが無効です',
          details: validationResult.errors
        }
      };
    }

    return {
      success: true,
      data: parsedData as URLState
    };

  } catch (error) {
    return {
      success: false,
      error: {
        type: 'DECODE_ERROR',
        message: 'デコード中にエラーが発生しました',
        details: error
      }
    };
  }
}

/**
 * URLState構造の検証
 * 
 * @param data - 検証するデータ
 * @returns 検証結果
 */
function validateURLStateStructure(data: any): DecodeResult {
  // version フィールドの存在確認
  if (typeof data.version !== 'number') {
    return {
      success: false,
      error: {
        type: 'DECODE_ERROR',
        message: 'バージョン情報が見つからないか無効です'
      }
    };
  }

  // services フィールドの存在確認
  if (!Array.isArray(data.services)) {
    return {
      success: false,
      error: {
        type: 'DECODE_ERROR',
        message: 'サービス情報が見つからないか無効です'
      }
    };
  }

  // 各サービスの構造確認
  for (let i = 0; i < data.services.length; i++) {
    const service = data.services[i];
    
    if (!service || typeof service !== 'object') {
      return {
        success: false,
        error: {
          type: 'DECODE_ERROR',
          message: `サービス${i + 1}の構造が無効です`
        }
      };
    }

    if (typeof service.id !== 'string' || typeof service.name !== 'string') {
      return {
        success: false,
        error: {
          type: 'DECODE_ERROR',
          message: `サービス${i + 1}のIDまたは名前が無効です`
        }
      };
    }

    if (!Array.isArray(service.technologies)) {
      return {
        success: false,
        error: {
          type: 'DECODE_ERROR',
          message: `サービス${i + 1}の技術情報が無効です`
        }
      };
    }

    // 各技術の構造確認
    for (let j = 0; j < service.technologies.length; j++) {
      const tech = service.technologies[j];
      
      if (!tech || typeof tech !== 'object') {
        return {
          success: false,
          error: {
            type: 'DECODE_ERROR',
            message: `サービス${i + 1}の技術${j + 1}の構造が無効です`
          }
        };
      }

      if (typeof tech.id !== 'string' || 
          typeof tech.name !== 'string' || 
          typeof tech.currentVersion !== 'string') {
        return {
          success: false,
          error: {
            type: 'DECODE_ERROR',
            message: `サービス${i + 1}の技術${j + 1}のフィールドが無効です`
          }
        };
      }
    }
  }

  return { success: true };
}

/**
 * 現在のURLからURL状態を取得
 * 
 * @returns デコード結果
 */
export function getURLStateFromCurrentURL(): DecodeResult {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    
    if (!dataParam) {
      return {
        success: false,
        error: {
          type: 'DECODE_ERROR',
          message: 'URLにデータパラメータが見つかりません'
        }
      };
    }

    return decodeURLState(dataParam);
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'DECODE_ERROR',
        message: 'URL解析中にエラーが発生しました',
        details: error
      }
    };
  }
}

/**
 * URL状態をブラウザのURLに設定
 * 
 * @param state - 設定するURLState
 * @returns エンコード結果
 */
export function setURLState(state: URLState): EncodeResult {
  const encodeResult = encodeURLState(state);
  
  if (encodeResult.success && encodeResult.data) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('data', encodeResult.data);
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'DECODE_ERROR',
          message: 'URL更新中にエラーが発生しました',
          details: error
        }
      };
    }
  }
  
  return encodeResult;
}

/**
 * URLからデータパラメータを削除
 */
export function clearURLState(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('data');
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    console.error('URL状態のクリア中にエラーが発生しました:', error);
  }
}

/**
 * 空のURL状態を作成
 * 
 * @returns 空のURLState
 */
export function createEmptyURLState(): URLState {
  return {
    version: CURRENT_SCHEMA_VERSION,
    services: []
  };
}

/**
 * URL状態が空かどうかを判定
 * 
 * @param state - 判定するURLState
 * @returns 空の場合true
 */
export function isEmptyURLState(state: URLState): boolean {
  return !state.services || state.services.length === 0;
}