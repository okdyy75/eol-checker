/**
 * URL State Management Tests
 * 
 * 仕様準拠: セミコロン区切り形式
 * Format: ?s=サービス名(技術:バージョン,技術:バージョン);サービス名(技術:バージョン)
 */

import {
  encodeURLState,
  decodeURLState,
  getURLStateFromCurrentURL,
  setURLState,
  clearURLState,
  MAX_URL_LENGTH,
} from '../url-state';
import { URLState, Service } from '../types';

describe('url-state', () => {
  describe('encodeURLState', () => {
    it('空のサービス配列の場合は空文字列を返す', () => {
      const state: URLState = {
        version: 1,
        services: [],
      };
      
      expect(encodeURLState(state)).toBe('');
    });

    it('単一サービス、単一技術の場合はセミコロン区切り形式で返す', () => {
      const state: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
            technologies: [
              {
                id: '1',
                name: 'python',
                currentVersion: '3.9',
              },
            ],
          },
        ],
      };
      
      const encoded = encodeURLState(state);
      expect(encoded).toBe('myapp(python:3.9)');
    });

    it('単一サービス、複数技術の場合はセミコロン区切り形式で返す', () => {
      const state: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
            technologies: [
              {
                id: '1',
                name: 'python',
                currentVersion: '3.9',
              },
              {
                id: '2',
                name: 'nodejs',
                currentVersion: '18.0',
              },
            ],
          },
        ],
      };
      
      const encoded = encodeURLState(state);
      expect(encoded).toBe('myapp(python:3.9,nodejs:18.0)');
    });

    it('複数サービスの場合はセミコロン区切り形式で返す', () => {
      const state: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
            technologies: [
              {
                id: '1',
                name: 'python',
                currentVersion: '3.9',
              },
            ],
          },
          {
            id: '2',
            name: 'api',
            technologies: [
              {
                id: '2',
                name: 'go',
                currentVersion: '1.20',
              },
            ],
          },
        ],
      };
      
      const encoded = encodeURLState(state);
      expect(encoded).toBe('myapp(python:3.9);api(go:1.20)');
    });

    it('特殊文字を含むデータはURLエンコードして返す', () => {
      const state: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'my-app [prod]',
            technologies: [
              {
                id: '1',
                name: 'node.js',
                currentVersion: '18.0.0-beta',
              },
            ],
          },
        ],
      };
      
      const encoded = encodeURLState(state);
      // 特殊文字がURLエンコードされることを確認
      expect(encoded).toContain('%5B'); // [
      expect(encoded).toContain('%5D'); // ]
      expect(encoded).toContain('%20'); // スペース
    });

    it('URL長が制限を超える場合はエラーをスローする', () => {
      // 大量のサービスを作成してURL長を超えるようにする
      const services: Service[] = [];
      for (let i = 0; i < 100; i++) {
        services.push({
          id: `service-${i}`,
          name: `very-long-service-name-${i}`,
          technologies: [
            {
              id: `tech-${i}-1`,
              name: 'technology-with-very-long-name',
              currentVersion: '1.0.0',
            },
            {
              id: `tech-${i}-2`,
              name: 'another-technology',
              currentVersion: '2.0.0',
            },
          ],
        });
      }
      
      const state: URLState = {
        version: 1,
        services,
      };
      
      expect(() => encodeURLState(state)).toThrow(/exceeds maximum/);
    });
  });

  describe('decodeURLState', () => {
    it('空文字列の場合は空のサービス配列を返す', () => {
      const result = decodeURLState('');
      
      expect(result).toEqual({
        version: 1,
        services: [],
      });
    });

    it('空白文字のみの場合は空のサービス配列を返す', () => {
      const result = decodeURLState('   ');
      
      expect(result).toEqual({
        version: 1,
        services: [],
      });
    });

    it('単一サービス、単一技術の場合は正しくデコードする', () => {
      const originalState: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
            technologies: [
              {
                id: '1',
                name: 'python',
                currentVersion: '3.9',
              },
            ],
          },
        ],
      };
      
      const encoded = encodeURLState(originalState);
      const decoded = decodeURLState(encoded);
      
      expect(decoded.services).toHaveLength(1);
      expect(decoded.services[0].name).toBe('myapp');
      expect(decoded.services[0].technologies).toHaveLength(1);
      expect(decoded.services[0].technologies[0].name).toBe('python');
      expect(decoded.services[0].technologies[0].currentVersion).toBe('3.9');
      // IDはデコード時に自動生成される
      expect(decoded.services[0].id).toMatch(/^service-/);
      expect(decoded.services[0].technologies[0].id).toMatch(/^tech-/);
    });

    it('単一サービス、複数技術の場合は正しくデコードする', () => {
      const originalState: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
            technologies: [
              {
                id: '1',
                name: 'python',
                currentVersion: '3.9',
              },
              {
                id: '2',
                name: 'nodejs',
                currentVersion: '18.0',
              },
            ],
          },
        ],
      };
      
      const encoded = encodeURLState(originalState);
      const decoded = decodeURLState(encoded);
      
      expect(decoded.services[0].technologies).toHaveLength(2);
      expect(decoded.services[0].technologies[0].name).toBe('python');
      expect(decoded.services[0].technologies[1].name).toBe('nodejs');
    });

    it('複数サービスの場合は正しくデコードする', () => {
      const originalState: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
            technologies: [
              {
                id: '1',
                name: 'python',
                currentVersion: '3.9',
              },
            ],
          },
          {
            id: '2',
            name: 'api',
            technologies: [
              {
                id: '2',
                name: 'go',
                currentVersion: '1.20',
              },
            ],
          },
        ],
      };
      
      const encoded = encodeURLState(originalState);
      const decoded = decodeURLState(encoded);
      
      expect(decoded.services).toHaveLength(2);
      expect(decoded.services[0].name).toBe('myapp');
      expect(decoded.services[1].name).toBe('api');
    });

    it('特殊文字を含むデータも正しくデコードする', () => {
      const originalState: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'my-app [prod]',
            technologies: [
              {
                id: '1',
                name: 'node.js',
                currentVersion: '18.0.0-beta',
              },
            ],
          },
        ],
      };
      
      const encoded = encodeURLState(originalState);
      const decoded = decodeURLState(encoded);
      
      expect(decoded.services[0].name).toBe('my-app [prod]');
      expect(decoded.services[0].technologies[0].name).toBe('node.js');
      expect(decoded.services[0].technologies[0].currentVersion).toBe('18.0.0-beta');
    });

    it('不正な形式の場合はエラーをスローする', () => {
      expect(() => decodeURLState('!!!invalid!!!')).toThrow(/Invalid format/);
    });

    it('括弧が欠けている場合はエラーをスローする', () => {
      expect(() => decodeURLState('myapp:python:3.9')).toThrow(/missing parentheses/);
    });

    it('コロンが欠けている場合はエラーをスローする', () => {
      expect(() => decodeURLState('myapp(python,nodejs)')).toThrow(/missing colon/);
    });
  });

  describe('ラウンドトリップテスト', () => {
    it('エンコード→デコードで元のデータを復元する（単一サービス）', () => {
      const originalState: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
            technologies: [
              {
                id: '1',
                name: 'python',
                currentVersion: '3.9',
              },
            ],
          },
        ],
      };
      
      const encoded = encodeURLState(originalState);
      const decoded = decodeURLState(encoded);
      
      // IDはデコード時に自動生成されるため、nameとcurrentVersionのみ比較
      expect(decoded.services).toHaveLength(1);
      expect(decoded.services[0].name).toBe('myapp');
      expect(decoded.services[0].technologies[0].name).toBe('python');
      expect(decoded.services[0].technologies[0].currentVersion).toBe('3.9');
    });

    it('エンコード→デコードで元のデータを復元する（複数サービス）', () => {
      const originalState: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
            technologies: [
              {
                id: '1',
                name: 'python',
                currentVersion: '3.9',
              },
              {
                id: '2',
                name: 'nodejs',
                currentVersion: '18.0',
              },
            ],
          },
          {
            id: '2',
            name: 'api',
            technologies: [
              {
                id: '3',
                name: 'go',
                currentVersion: '1.20',
              },
            ],
          },
        ],
      };
      
      const encoded = encodeURLState(originalState);
      const decoded = decodeURLState(encoded);
      
      expect(decoded.services).toHaveLength(2);
      expect(decoded.services[0].name).toBe('myapp');
      expect(decoded.services[0].technologies).toHaveLength(2);
      expect(decoded.services[1].name).toBe('api');
    });

    it('特殊文字を含むデータでもラウンドトリップが成功する', () => {
      const originalState: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'my-app [prod] (test)',
            technologies: [
              {
                id: '1',
                name: 'node.js',
                currentVersion: '18.0.0-beta',
              },
              {
                id: '2',
                name: 'c++',
                currentVersion: '20.0',
              },
            ],
          },
        ],
      };
      
      const encoded = encodeURLState(originalState);
      const decoded = decodeURLState(encoded);
      
      expect(decoded.services[0].name).toBe('my-app [prod] (test)');
      expect(decoded.services[0].technologies[0].name).toBe('node.js');
      expect(decoded.services[0].technologies[1].name).toBe('c++');
    });
  });

  describe('getURLStateFromCurrentURL', () => {
    let originalLocation: Location;

    beforeEach(() => {
      originalLocation = window.location;
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });

    it('URLパラメータがない場合は空の状態を返す', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '' },
        writable: true,
      });
      
      const result = getURLStateFromCurrentURL();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        version: 1,
        services: [],
      });
    });

    it('有効なURLパラメータがある場合はデコードして返す', () => {
      const state: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
            technologies: [
              {
                id: '1',
                name: 'python',
                currentVersion: '3.9',
              },
            ],
          },
        ],
      };
      
      const encoded = encodeURLState(state);
      Object.defineProperty(window, 'location', {
        value: { search: `?s=${encoded}` },
        writable: true,
      });
      
      const result = getURLStateFromCurrentURL();
      
      expect(result.success).toBe(true);
      // IDはデコード時に自動生成されるため、nameとcurrentVersionのみ比較
      expect(result.data?.services[0].name).toBe('myapp');
      expect(result.data?.services[0].technologies[0].name).toBe('python');
      expect(result.data?.services[0].technologies[0].currentVersion).toBe('3.9');
    });

    it('無効なURLパラメータの場合はエラーを返す', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?s=invalid!!!' },
        writable: true,
      });
      
      const result = getURLStateFromCurrentURL();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('setURLState', () => {
    let mockReplaceState: jest.Mock;

    beforeEach(() => {
      mockReplaceState = jest.fn();
      Object.defineProperty(window, 'history', {
        value: { replaceState: mockReplaceState },
        writable: true,
      });
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/',
          search: '',
          pathname: '/',
          protocol: 'http:',
          host: 'localhost:3000',
        },
        writable: true,
      });
    });

    it('状態をURLに設定する', () => {
      const state: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
            technologies: [
              {
                id: '1',
                name: 'python',
                currentVersion: '3.9',
              },
            ],
          },
        ],
      };
      
      const result = setURLState(state);
      
      expect(result.success).toBe(true);
      expect(mockReplaceState).toHaveBeenCalled();
    });

    it('空のサービス配列の場合はパラメータを削除する', () => {
      const state: URLState = {
        version: 1,
        services: [],
      };
      
      const result = setURLState(state);
      
      expect(result.success).toBe(true);
      expect(mockReplaceState).toHaveBeenCalled();
    });

    it('URL長が制限を超える場合はエラーを返す', () => {
      const services: Service[] = [];
      for (let i = 0; i < 100; i++) {
        services.push({
          id: `service-${i}`,
          name: `very-long-service-name-${i}`,
          technologies: [
            {
              id: `tech-${i}`,
              name: 'technology-with-very-long-name',
              currentVersion: '1.0.0',
            },
          ],
        });
      }
      
      const state: URLState = {
        version: 1,
        services,
      };
      
      const result = setURLState(state);
      
      expect(result.success).toBe(false);
      // URL長制限エラーはsetURLStateで検出され、URL_TOO_LONGとして返される
      expect(result.error?.type).toBe('URL_TOO_LONG');
    });
  });

  describe('clearURLState', () => {
    let mockReplaceState: jest.Mock;

    beforeEach(() => {
      mockReplaceState = jest.fn();
      Object.defineProperty(window, 'history', {
        value: { replaceState: mockReplaceState },
        writable: true,
      });
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/?s=some-data',
          search: '?s=some-data',
          pathname: '/',
          protocol: 'http:',
          host: 'localhost:3000',
        },
        writable: true,
      });
    });

    it('URLパラメータをクリアする', () => {
      clearURLState();
      
      expect(mockReplaceState).toHaveBeenCalled();
    });
  });
});
