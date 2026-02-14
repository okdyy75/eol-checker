/**
 * Next.js設定のユニットテスト
 * タスク: 4.1 Next.js設定のユニットテスト
 * 要件: 1.1, 1.3, 1.4, 2.1, 2.4, 2.5
 */

describe('Next.js Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // 環境変数を保存
    originalEnv = process.env.NEXT_PUBLIC_BASE_PATH;
    
    // キャッシュをクリア
    jest.resetModules();
  });

  afterEach(() => {
    // 環境変数を復元
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_BASE_PATH = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_BASE_PATH;
    }
  });

  describe('静的エクスポートモード', () => {
    it('output: "export"が設定されていること（要件 1.1）', () => {
      const config = require('../next.config.js');
      expect(config.output).toBe('export');
    });
  });

  describe('画像最適化設定', () => {
    it('images.unoptimized: trueが設定されていること（要件 1.3）', () => {
      const config = require('../next.config.js');
      expect(config.images).toBeDefined();
      expect(config.images.unoptimized).toBe(true);
    });
  });

  describe('末尾スラッシュ設定', () => {
    it('trailingSlash: trueが設定されていること（要件 1.4）', () => {
      const config = require('../next.config.js');
      expect(config.trailingSlash).toBe(true);
    });
  });

  describe('ベースパス設定', () => {
    it('環境変数が設定されている場合、その値を使用すること（要件 2.1, 2.5）', () => {
      process.env.NEXT_PUBLIC_BASE_PATH = '/test-repo';
      const config = require('../next.config.js');
      
      expect(config.basePath).toBe('/test-repo');
      expect(config.assetPrefix).toBe('/test-repo');
    });

    it('環境変数が未設定の場合、空文字列を使用すること（要件 2.4）', () => {
      delete process.env.NEXT_PUBLIC_BASE_PATH;
      const config = require('../next.config.js');
      
      expect(config.basePath).toBe('');
      expect(config.assetPrefix).toBe('');
    });

    it('環境変数が空文字列の場合、空文字列を使用すること', () => {
      process.env.NEXT_PUBLIC_BASE_PATH = '';
      const config = require('../next.config.js');
      
      expect(config.basePath).toBe('');
      expect(config.assetPrefix).toBe('');
    });

    it('複数の異なるベースパスで正しく動作すること', () => {
      const testPaths = ['/eol-checker', '/my-app', '/test-repo'];
      
      testPaths.forEach(path => {
        jest.resetModules();
        process.env.NEXT_PUBLIC_BASE_PATH = path;
        const config = require('../next.config.js');
        
        expect(config.basePath).toBe(path);
        expect(config.assetPrefix).toBe(path);
      });
    });
  });

  describe('TypeScript設定', () => {
    it('ignoreBuildErrors: falseが設定されていること', () => {
      const config = require('../next.config.js');
      expect(config.typescript).toBeDefined();
      expect(config.typescript.ignoreBuildErrors).toBe(false);
    });
  });

  describe('ESLint設定', () => {
    it('eslint.dirsが設定されていること', () => {
      const config = require('../next.config.js');
      expect(config.eslint).toBeDefined();
      expect(config.eslint.dirs).toBeDefined();
      expect(Array.isArray(config.eslint.dirs)).toBe(true);
    });
  });

  describe('ビルドID生成', () => {
    it('generateBuildId関数が定義されていること', () => {
      const config = require('../next.config.js');
      expect(config.generateBuildId).toBeDefined();
      expect(typeof config.generateBuildId).toBe('function');
    });

    it('generateBuildId関数が文字列を返すこと', async () => {
      const config = require('../next.config.js');
      const buildId = await config.generateBuildId();
      
      expect(typeof buildId).toBe('string');
      expect(buildId.length).toBeGreaterThan(0);
    });

    it('generateBuildId関数が"eol-timeline-viewer-"で始まる文字列を返すこと', async () => {
      const config = require('../next.config.js');
      const buildId = await config.generateBuildId();
      
      expect(buildId).toMatch(/^eol-timeline-viewer-/);
    });
  });
});
