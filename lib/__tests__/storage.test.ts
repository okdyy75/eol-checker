import { Service } from '../types';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  isLocalStorageAvailable,
  loadDataWithPriority,
  saveDataWithNotification,
  StorageError
} from '../storage';

// モックデータ
const mockServices: Service[] = [
  {
    id: '1',
    name: 'Test Service',
    technologies: [
      {
        id: '1',
        name: 'python',
        currentVersion: '3.9'
      }
    ]
  }
];

// localStorage のモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// グローバルなlocalStorageをモック
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('storage', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('isLocalStorageAvailable', () => {
    it('ローカルストレージが利用可能な場合はtrueを返す', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    it('ローカルストレージが利用不可能な場合はfalseを返す', () => {
      // setItemでエラーを投げるようにモック
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('localStorage not available');
      });

      expect(isLocalStorageAvailable()).toBe(false);
    });
  });

  describe('saveToLocalStorage', () => {
    it('正常にデータを保存できる', () => {
      const result = saveToLocalStorage(mockServices);

      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'eol-timeline-viewer-data',
        JSON.stringify(mockServices)
      );
    });

    it('容量超過エラーを適切に処理する', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const result = saveToLocalStorage(mockServices);

      expect(result.success).toBe(false);
      expect(result.error).toBe(StorageError.QUOTA_EXCEEDED);
      expect(result.message).toContain('容量が不足');
    });

    it('アクセス拒否エラーを適切に処理する', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Access denied');
      });

      const result = saveToLocalStorage(mockServices);

      expect(result.success).toBe(false);
      expect(result.error).toBe(StorageError.ACCESS_DENIED);
    });

    it('ローカルストレージが利用不可能な場合のエラー処理', () => {
      // isLocalStorageAvailableがfalseを返すようにモック
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('localStorage not available');
      });

      const result = saveToLocalStorage(mockServices);

      expect(result.success).toBe(false);
      expect(result.error).toBe(StorageError.ACCESS_DENIED);
    });
  });

  describe('loadFromLocalStorage', () => {
    it('正常にデータを読み込める', () => {
      localStorageMock.setItem('eol-timeline-viewer-data', JSON.stringify(mockServices));

      const result = loadFromLocalStorage();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockServices);
    });

    it('データが存在しない場合は空配列を返す', () => {
      const result = loadFromLocalStorage();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('不正なJSONデータの場合はエラーを返す', () => {
      localStorageMock.setItem('eol-timeline-viewer-data', 'invalid json');

      const result = loadFromLocalStorage();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe(StorageError.INVALID_DATA);
    });

    it('配列でないデータの場合はエラーを返す', () => {
      localStorageMock.setItem('eol-timeline-viewer-data', JSON.stringify({ invalid: 'data' }));

      const result = loadFromLocalStorage();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe(StorageError.INVALID_DATA);
    });

    it('不正なサービス構造の場合はエラーを返す', () => {
      const invalidServices = [{ invalid: 'service' }];
      localStorageMock.setItem('eol-timeline-viewer-data', JSON.stringify(invalidServices));

      const result = loadFromLocalStorage();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe(StorageError.INVALID_DATA);
    });
  });

  describe('clearLocalStorage', () => {
    it('正常にデータをクリアできる', () => {
      localStorageMock.setItem('eol-timeline-viewer-data', JSON.stringify(mockServices));

      const result = clearLocalStorage();

      expect(result.success).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('eol-timeline-viewer-data');
    });

    it('クリア時のエラーを適切に処理する', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Remove failed');
      });

      const result = clearLocalStorage();

      expect(result.success).toBe(false);
      expect(result.error).toBe(StorageError.ACCESS_DENIED);
    });
  });

  describe('loadDataWithPriority', () => {
    beforeEach(() => {
      // ローカルストレージにデータを保存
      localStorageMock.setItem('eol-timeline-viewer-data', JSON.stringify(mockServices));
    });

    it('URL状態が存在する場合はURL状態を優先する', () => {
      const urlServices: Service[] = [
        {
          id: '2',
          name: 'URL Service',
          technologies: []
        }
      ];

      const result = loadDataWithPriority(urlServices);

      expect(result).toEqual(urlServices);
    });

    it('URL状態が空の場合はローカルストレージから読み込む', () => {
      const result = loadDataWithPriority([]);

      expect(result).toEqual(mockServices);
    });

    it('URL状態がundefinedの場合はローカルストレージから読み込む', () => {
      const result = loadDataWithPriority(undefined);

      expect(result).toEqual(mockServices);
    });

    it('URL状態もローカルストレージも空の場合は空配列を返す', () => {
      localStorageMock.clear();

      const result = loadDataWithPriority(undefined);

      expect(result).toEqual([]);
    });
  });

  describe('saveDataWithNotification', () => {
    it('正常に保存できた場合はsuccessを返す', () => {
      const result = saveDataWithNotification(mockServices);

      expect(result.success).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('容量超過エラーの場合は適切なメッセージを返す', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const result = saveDataWithNotification(mockServices);

      expect(result.success).toBe(false);
      expect(result.message).toContain('容量が不足');
    });

    it('アクセス拒否エラーの場合は適切なメッセージを返す', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Access denied');
      });

      const result = saveDataWithNotification(mockServices);

      expect(result.success).toBe(false);
      expect(result.message).toContain('プライベートブラウジング');
    });
  });
});