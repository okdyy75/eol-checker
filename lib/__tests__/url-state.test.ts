/**
 * URL State Management Tests
 * 
 * このテストファイルは、URL状態管理機能のエンコード/デコード、
 * バリデーション、エラーハンドリングをテストします。
 */

import {
  encodeURLState,
  decodeURLState,
  validateURLState,
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

    it('単一サービス、単一技術の場合は正しくエンコードする', () => {
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

    it('単一サービス、複数技術の場合は正しくエンコードする', () => {
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

    it('複数サービスの場合は正しくエンコードする', () => {
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

    it('特殊文字を含むサービス名をエスケープする', () => {
      const state: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'my-app [prod]',
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
      // 括弧が含まれるのでエンコードされる
      expect(encoded).toContain('%5B');
      expect(encoded).toContain('%5D');
    });

    it('特殊文字を含まない場合はエンコードしない', () => {
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
      // 特殊文字がないのでそのまま
      expect(encoded).toBe('myapp(python:3.9)');
    });

    it('特殊文字を含む技術名とバージョンをエスケープする', () => {
      const state: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
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
      // ドットとハイフンは特殊文字ではないのでエンコードされない
      expect(encoded).toBe('myapp(node.js:18.0.0-beta)');
    });

    it('URL長が制限を超える場合はエラーをスローする', () => {
      // 非常に長いサービス名を生成（エンコード後に確実に2048文字を超える）
      const longName = 'a'.repeat(2100);
      const state: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: longName,
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
      
      expect(() => encodeURLState(state)).toThrow(/URL length.*exceeds maximum/);
    });
  });

  describe('decodeURLState', () => {
    it('空文字列の場合は空のサービス配列を返す', () => {
      const decoded = decodeURLState('');
      
      expect(decoded.version).toBe(1);
      expect(decoded.services).toEqual([]);
    });

    it('空白文字のみの場合は空のサービス配列を返す', () => {
      const decoded = decodeURLState('   ');
      
      expect(decoded.version).toBe(1);
      expect(decoded.services).toEqual([]);
    });

    it('単一サービス、単一技術の場合は正しくデコードする', () => {
      const decoded = decodeURLState('myapp(python:3.9)');
      
      expect(decoded.version).toBe(1);
      expect(decoded.services).toHaveLength(1);
      expect(decoded.services[0].name).toBe('myapp');
      expect(decoded.services[0].technologies).toHaveLength(1);
      expect(decoded.services[0].technologies[0].name).toBe('python');
      expect(decoded.services[0].technologies[0].currentVersion).toBe('3.9');
    });

    it('単一サービス、複数技術の場合は正しくデコードする', () => {
      const decoded = decodeURLState('myapp(python:3.9,nodejs:18.0)');
      
      expect(decoded.version).toBe(1);
      expect(decoded.services).toHaveLength(1);
      expect(decoded.services[0].name).toBe('myapp');
      expect(decoded.services[0].technologies).toHaveLength(2);
      expect(decoded.services[0].technologies[0].name).toBe('python');
      expect(decoded.services[0].technologies[0].currentVersion).toBe('3.9');
      expect(decoded.services[0].technologies[1].name).toBe('nodejs');
      expect(decoded.services[0].technologies[1].currentVersion).toBe('18.0');
    });

    it('複数サービスの場合は正しくデコードする', () => {
      const decoded = decodeURLState('myapp(python:3.9);api(go:1.20)');
      
      expect(decoded.version).toBe(1);
      expect(decoded.services).toHaveLength(2);
      expect(decoded.services[0].name).toBe('myapp');
      expect(decoded.services[0].technologies[0].name).toBe('python');
      expect(decoded.services[1].name).toBe('api');
      expect(decoded.services[1].technologies[0].name).toBe('go');
    });

    it('エスケープされた特殊文字を正しくデコードする', () => {
      const decoded = decodeURLState('my-app%20%5Bprod%5D(python:3.9)');
      
      expect(decoded.services[0].name).toBe('my-app [prod]');
    });

    it('括弧が欠けている場合はエラーをスローする', () => {
      expect(() => decodeURLState('myapp')).toThrow(/missing parentheses/);
      expect(() => decodeURLState('myapp(python:3.9')).toThrow(/missing parentheses/);
      expect(() => decodeURLState('myapppython:3.9)')).toThrow(/missing parentheses/);
    });

    it('サービス名が空の場合はエラーをスローする', () => {
      expect(() => decodeURLState('(python:3.9)')).toThrow(/missing service name/);
    });

    it('技術名とバージョンの区切りがない場合はエラーをスローする', () => {
      expect(() => decodeURLState('myapp(python3.9)')).toThrow(/missing colon/);
    });

    it('技術名が空の場合はエラーをスローする', () => {
      expect(() => decodeURLState('myapp(:3.9)')).toThrow(/Technology name cannot be empty/);
    });

    it('バージョンが空の場合はエラーをスローする', () => {
      expect(() => decodeURLState('myapp(python:)')).toThrow(/Technology version cannot be empty/);
    });

    it('不正なフォーマットの場合はエラーメッセージに詳細を含む', () => {
      expect(() => decodeURLState('invalid')).toThrow(/Failed to decode URL state/);
    });
  });

  describe('ラウンドトリップテスト', () => {
    it('エンコード→デコードで元のデータを復元する（単一サービス）', () => {
      const original: URLState = {
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
      
      const encoded = encodeURLState(original);
      const decoded = decodeURLState(encoded);
      
      expect(decoded.version).toBe(original.version);
      expect(decoded.services).toHaveLength(original.services.length);
      expect(decoded.services[0].name).toBe(original.services[0].name);
      expect(decoded.services[0].technologies).toHaveLength(
        original.services[0].technologies.length
      );
      expect(decoded.services[0].technologies[0].name).toBe(
        original.services[0].technologies[0].name
      );
      expect(decoded.services[0].technologies[0].currentVersion).toBe(
        original.services[0].technologies[0].currentVersion
      );
    });

    it('エンコード→デコードで元のデータを復元する（複数サービス）', () => {
      const original: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'web',
            technologies: [
              {
                id: '1',
                name: 'react',
                currentVersion: '18',
              },
              {
                id: '2',
                name: 'nodejs',
                currentVersion: '20',
              },
            ],
          },
          {
            id: '2',
            name: 'api',
            technologies: [
              {
                id: '3',
                name: 'python',
                currentVersion: '3.11',
              },
            ],
          },
          {
            id: '3',
            name: 'db',
            technologies: [
              {
                id: '4',
                name: 'postgres',
                currentVersion: '15',
              },
            ],
          },
        ],
      };
      
      const encoded = encodeURLState(original);
      const decoded = decodeURLState(encoded);
      
      expect(decoded.version).toBe(original.version);
      expect(decoded.services).toHaveLength(original.services.length);
      
      for (let i = 0; i < original.services.length; i++) {
        expect(decoded.services[i].name).toBe(original.services[i].name);
        expect(decoded.services[i].technologies).toHaveLength(
          original.services[i].technologies.length
        );
        
        for (let j = 0; j < original.services[i].technologies.length; j++) {
          expect(decoded.services[i].technologies[j].name).toBe(
            original.services[i].technologies[j].name
          );
          expect(decoded.services[i].technologies[j].currentVersion).toBe(
            original.services[i].technologies[j].currentVersion
          );
        }
      }
    });

    it('特殊文字を含むデータでもラウンドトリップが成功する', () => {
      const original: URLState = {
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
      
      const encoded = encodeURLState(original);
      const decoded = decodeURLState(encoded);
      
      expect(decoded.services[0].name).toBe(original.services[0].name);
      expect(decoded.services[0].technologies[0].name).toBe(
        original.services[0].technologies[0].name
      );
      expect(decoded.services[0].technologies[0].currentVersion).toBe(
        original.services[0].technologies[0].currentVersion
      );
    });
  });

  describe('validateURLState', () => {
    it('有効なURLStateの場合はエラーをスローしない', () => {
      const validState: URLState = {
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
      
      expect(() => validateURLState(validState)).not.toThrow();
    });

    it('nullまたはundefinedの場合はエラーをスローする', () => {
      expect(() => validateURLState(null as any)).toThrow(/cannot be null or undefined/);
      expect(() => validateURLState(undefined as any)).toThrow(/cannot be null or undefined/);
    });

    it('versionが数値でない場合はエラーをスローする', () => {
      const invalidState = {
        version: '1' as any,
        services: [],
      };
      
      expect(() => validateURLState(invalidState)).toThrow(/version must be a number/);
    });

    it('servicesが配列でない場合はエラーをスローする', () => {
      const invalidState = {
        version: 1,
        services: {} as any,
      };
      
      expect(() => validateURLState(invalidState)).toThrow(/services must be an array/);
    });

    it('サービスIDが空の場合はエラーをスローする', () => {
      const invalidState: URLState = {
        version: 1,
        services: [
          {
            id: '',
            name: 'myapp',
            technologies: [],
          },
        ],
      };
      
      expect(() => validateURLState(invalidState)).toThrow(/Service id must be a non-empty string/);
    });

    it('サービス名が空の場合はエラーをスローする', () => {
      const invalidState: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: '',
            technologies: [],
          },
        ],
      };
      
      expect(() => validateURLState(invalidState)).toThrow(/Service name must be a non-empty string/);
    });

    it('technologiesが配列でない場合はエラーをスローする', () => {
      const invalidState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
            technologies: {} as any,
          },
        ],
      };
      
      expect(() => validateURLState(invalidState)).toThrow(/technologies must be an array/);
    });

    it('技術IDが空の場合はエラーをスローする', () => {
      const invalidState: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
            technologies: [
              {
                id: '',
                name: 'python',
                currentVersion: '3.9',
              },
            ],
          },
        ],
      };
      
      expect(() => validateURLState(invalidState)).toThrow(/Technology id must be a non-empty string/);
    });

    it('技術名が空の場合はエラーをスローする', () => {
      const invalidState: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
            technologies: [
              {
                id: '1',
                name: '',
                currentVersion: '3.9',
              },
            ],
          },
        ],
      };
      
      expect(() => validateURLState(invalidState)).toThrow(/Technology name must be a non-empty string/);
    });

    it('バージョンが空の場合はエラーをスローする', () => {
      const invalidState: URLState = {
        version: 1,
        services: [
          {
            id: '1',
            name: 'myapp',
            technologies: [
              {
                id: '1',
                name: 'python',
                currentVersion: '',
              },
            ],
          },
        ],
      };
      
      expect(() => validateURLState(invalidState)).toThrow(/Technology currentVersion must be a non-empty string/);
    });
  });
});
