import { Service } from './types';

const STORAGE_KEY = 'eol-timeline-viewer-data';

/**
 * ローカルストレージエラーの種類
 */
export enum StorageError {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  INVALID_DATA = 'INVALID_DATA',
  UNAVAILABLE = 'UNAVAILABLE'
}

/**
 * ストレージ操作の結果
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: StorageError;
  message?: string;
}

/**
 * データをローカルストレージに保存
 * 要件 6.1: 入力されたデータをブラウザのローカルストレージに保存する
 */
export function saveToLocalStorage(services: Service[]): StorageResult<void> {
  try {
    const data = JSON.stringify(services);
    localStorage.setItem(STORAGE_KEY, data);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    
    // エラーの種類を判定
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        return {
          success: false,
          error: StorageError.QUOTA_EXCEEDED,
          message: 'ストレージ容量が不足しています'
        };
      }
      
      if (error.message.includes('access') || error.message.includes('denied')) {
        return {
          success: false,
          error: StorageError.ACCESS_DENIED,
          message: 'ストレージへのアクセスが拒否されました'
        };
      }
    }
    
    // その他のエラーの場合、利用可能性をチェック
    if (!isLocalStorageAvailable()) {
      return {
        success: false,
        error: StorageError.UNAVAILABLE,
        message: 'ローカルストレージが利用できません'
      };
    }
    
    return {
      success: false,
      error: StorageError.ACCESS_DENIED,
      message: 'データの保存に失敗しました'
    };
  }
}

/**
 * ローカルストレージからデータを読み込み
 * 要件 6.2: ユーザーがアプリケーションを再度開いた場合、ローカルストレージからデータを読み込む
 */
export function loadFromLocalStorage(): StorageResult<Service[]> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return {
        success: true,
        data: []
      };
    }
    
    const services = JSON.parse(data);
    
    // データ形式の検証
    if (!Array.isArray(services)) {
      throw new Error('Invalid data format: not an array');
    }
    
    // 各サービスの基本的な構造を検証
    for (const service of services) {
      if (!service || typeof service !== 'object') {
        throw new Error('Invalid service object');
      }
      if (typeof service.id !== 'string' || typeof service.name !== 'string') {
        throw new Error('Invalid service structure');
      }
      if (!Array.isArray(service.technologies)) {
        throw new Error('Invalid technologies array');
      }
    }
    
    return {
      success: true,
      data: services
    };
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    
    // 利用可能性をチェック
    if (!isLocalStorageAvailable()) {
      return {
        success: false,
        data: [],
        error: StorageError.UNAVAILABLE,
        message: 'ローカルストレージが利用できません'
      };
    }
    
    return {
      success: false,
      data: [],
      error: StorageError.INVALID_DATA,
      message: 'ストレージのデータが破損しています'
    };
  }
}

/**
 * ローカルストレージのデータをクリア
 * 要件 6.4: ユーザーがデータをクリアできる機能を提供する
 */
export function clearLocalStorage(): StorageResult<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    
    // 利用可能性をチェック
    if (!isLocalStorageAvailable()) {
      return {
        success: false,
        error: StorageError.UNAVAILABLE,
        message: 'ローカルストレージが利用できません'
      };
    }
    
    return {
      success: false,
      error: StorageError.ACCESS_DENIED,
      message: 'データのクリアに失敗しました'
    };
  }
}

/**
 * ローカルストレージが利用可能かチェック
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * URL状態とローカルストレージの優先順位を考慮してデータを読み込み
 * 要件 6.3: URL_Stateが存在する場合、URL_Stateをローカルストレージよりも優先する
 */
export function loadDataWithPriority(urlServices?: Service[]): Service[] {
  // URL状態が存在する場合は、それを優先
  if (urlServices && urlServices.length > 0) {
    return urlServices;
  }
  
  // URL状態がない場合は、ローカルストレージから読み込み
  const result = loadFromLocalStorage();
  return result.data || [];
}

/**
 * データを保存し、結果に応じてユーザーに通知するためのヘルパー関数
 */
export function saveDataWithNotification(services: Service[]): {
  success: boolean;
  message?: string;
} {
  const result = saveToLocalStorage(services);
  
  if (!result.success) {
    // エラーの種類に応じて適切なメッセージを返す
    switch (result.error) {
      case StorageError.QUOTA_EXCEEDED:
        return {
          success: false,
          message: 'ストレージ容量が不足しています。不要なデータを削除してください。'
        };
      case StorageError.ACCESS_DENIED:
        return {
          success: false,
          message: 'プライベートブラウジングモードではデータを保存できません。'
        };
      case StorageError.UNAVAILABLE:
        return {
          success: false,
          message: 'ローカルストレージが利用できません。URLでの共有をご利用ください。'
        };
      default:
        return {
          success: false,
          message: 'データの保存に失敗しました。'
        };
    }
  }
  
  return { success: true };
}