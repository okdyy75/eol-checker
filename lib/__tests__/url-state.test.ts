import { Service } from '../types';
import {
  encodeURLState,
  decodeURLState,
  getURLStateFromCurrentURL,
  setURLState,
  clearURLState,
  createEmptyURLState,
  isEmptyURLState,
  URLStateError,
  EncodeResult,
  DecodeResult
} from '../url-state';

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

const mockURLState = {
  version: 1,
  services: mockServices
};

// window.location のモック
const mockLocation = {
  origin: 'https://example.com',
  pathname: '/test',
  search: '',
  href: 'https://example.com/test'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// window.history のモック
const mockHistory = {
  replaceState: jest.fn()
};

Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true
});

describe('url-state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.search = '';
  });

  describe('createEmptyURLState', () => {
    it('空のURL状態を作成する', () => {
      const result = createEmptyURLState();
      
      expect(result.version).toBe(1);
      expect(result.services).toEqual([]);
    });
  });

  describe('isEmptyURLState', () => {
    it('空のサービス配列の場合はtrueを返す', () => {
      const emptyState = createEmptyURLState();
      expect(isEmptyURLState(emptyState)).toBe(true);
    });

    it('サービスが存在する場合はfalseを返す', () => {
      expect(isEmptyURLState(mockURLState)).toBe(false);
    });

    it('servicesがundefinedの場合はtrueを返す', () => {
      const invalidState = { version: 1, services: undefined as any };
      expect(isEmptyURLState(invalidState)).toBe(true);
    });
  });

  describe('encodeURLState', () => {
    it('正常にURL状態をエンコードできる', () => {
      const result = encodeURLState(mockURLState);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
    });

    it('無効なデータの場合はエラーを返す', () => {
      const invalidState = {
        version: 1,
        services: [{ id: '', name: '', technologies: [] }] // 空の名前は無効
      };
      
      const result = encodeURLState(invalidState);
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('VALIDATION_ERROR');
    });

    it('エンコード処理でエラーが発生した場合を処理する', () => {
      // JSON.stringifyでエラーを発生させるため、循環参照を作成
      const circularState: any = { version: 1, services: [] };
      circularState.circular = circularState;
      
      const result = encodeURLState(circularState);
      
      expect(result.success).toBe(false);
      // 循環参照の場合、バリデーションでエラーになる可能性もある
      expect(['DECODE_ERROR', 'VALIDATION_ERROR']).toContain(result.error?.type);
    });
  });

  describe('decodeURLState', () => {
    it('正常にURL状態をデコードできる', () => {
      // まずエンコードしてからデコード
      const encodeResult = encodeURLState(mockURLState);
      expect(encodeResult.success).toBe(true);
      
      const decodeResult = decodeURLState(encodeResult.data!);
      
      expect(decodeResult.success).toBe(true);
      expect(decodeResult.data).toEqual(mockURLState);
    });

    it('空文字列の場合はエラーを返す', () => {
      const result = decodeURLState('');
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('DECODE_ERROR');
    });

    it('不正なBase64文字列の場合はエラーを返す', () => {
      const result = decodeURLState('invalid-base64!@#');
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('DECODE_ERROR');
    });

    it('不正なJSON形式の場合はエラーを返す', () => {
      // 不正なJSONをBase64エンコード
      const invalidJson = btoa('invalid json');
      const result = decodeURLState(invalidJson);
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('DECODE_ERROR');
    });

    it('スキーマバージョンが異なる場合はエラーを返す', () => {
      const invalidVersionState = {
        version: 999,
        services: mockServices
      };
      
      const encoded = btoa(encodeURIComponent(JSON.stringify(invalidVersionState)));
      const result = decodeURLState(encoded);
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('SCHEMA_VERSION_MISMATCH');
    });

    it('不正なサービス構造の場合はエラーを返す', () => {
      const invalidStructureState = {
        version: 1,
        services: [{ invalid: 'structure' }]
      };
      
      const encoded = btoa(encodeURIComponent(JSON.stringify(invalidStructureState)));
      const result = decodeURLState(encoded);
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('DECODE_ERROR');
    });
  });

  describe('getURLStateFromCurrentURL', () => {
    it('URLパラメータからデータを取得できる', () => {
      const encodeResult = encodeURLState(mockURLState);
      expect(encodeResult.success).toBe(true);
      
      // window.locationのsearchを設定
      mockLocation.search = `?data=${encodeResult.data}`;
      
      const result = getURLStateFromCurrentURL();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockURLState);
    });

    it('データパラメータが存在しない場合はエラーを返す', () => {
      mockLocation.search = '';
      
      const result = getURLStateFromCurrentURL();
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('DECODE_ERROR');
    });
  });

  describe('setURLState', () => {
    it('URL状態をブラウザのURLに設定できる', () => {
      const result = setURLState(mockURLState);
      
      expect(result.success).toBe(true);
      expect(mockHistory.replaceState).toHaveBeenCalled();
    });

    it('エンコードに失敗した場合はエラーを返す', () => {
      const invalidState = {
        version: 1,
        services: [{ id: '', name: '', technologies: [] }]
      };
      
      const result = setURLState(invalidState);
      
      expect(result.success).toBe(false);
    });
  });

  describe('clearURLState', () => {
    it('URLからデータパラメータを削除する', () => {
      clearURLState();
      
      expect(mockHistory.replaceState).toHaveBeenCalled();
    });
  });

  describe('ラウンドトリップテスト', () => {
    it('エンコード→デコードで元のデータが復元される', () => {
      const encodeResult = encodeURLState(mockURLState);
      expect(encodeResult.success).toBe(true);
      
      const decodeResult = decodeURLState(encodeResult.data!);
      expect(decodeResult.success).toBe(true);
      expect(decodeResult.data).toEqual(mockURLState);
    });

    it('複数のサービスでもラウンドトリップが成功する', () => {
      const multiServiceState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'Service 1',
            technologies: [
              { id: '1', name: 'python', currentVersion: '3.9' },
              { id: '2', name: 'nodejs', currentVersion: '18.0.0' }
            ]
          },
          {
            id: '2',
            name: 'Service 2',
            technologies: [
              { id: '3', name: 'react', currentVersion: '18.2.0' }
            ]
          }
        ]
      };
      
      const encodeResult = encodeURLState(multiServiceState);
      expect(encodeResult.success).toBe(true);
      
      const decodeResult = decodeURLState(encodeResult.data!);
      expect(decodeResult.success).toBe(true);
      expect(decodeResult.data).toEqual(multiServiceState);
    });
  });
});