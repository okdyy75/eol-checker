/**
 * EOL Data Management Tests
 * 
 * lib/eol-data.tsの機能をテストします。
 */

import { 
  loadEOLData, 
  findEOLProduct, 
  getAvailableTechnologies, 
  clearEOLDataCache,
  getCachedEOLData,
  hasEOLProduct,
  findMultipleEOLProducts,
  getVersionsForTechnology
} from '../eol-data';
import { EOLDataMap, EOLProduct } from '../types';

// モックデータ
const mockEOLData: EOLDataMap = {
  'python': {
    productName: 'python',
    cycles: [
      {
        cycle: '3.11',
        releaseDate: '2022-10-24',
        eol: '2027-10-24',
        support: '2024-10-24',
        lts: false
      },
      {
        cycle: '3.10',
        releaseDate: '2021-10-04',
        eol: '2026-10-04',
        support: '2023-10-04',
        lts: false
      }
    ]
  },
  'nodejs': {
    productName: 'nodejs',
    cycles: [
      {
        cycle: '18',
        releaseDate: '2022-04-19',
        eol: '2025-04-30',
        support: '2023-10-18',
        lts: true
      }
    ]
  }
};

// fetchのモック
global.fetch = jest.fn();

describe('EOL Data Management', () => {
  beforeEach(() => {
    // 各テスト前にキャッシュをクリア
    clearEOLDataCache();
    jest.clearAllMocks();
  });

  describe('loadEOLData', () => {
    it('should load EOL data from JSON file successfully', async () => {
      // fetchのモック設定
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEOLData
      });

      const result = await loadEOLData();
      
      expect(global.fetch).toHaveBeenCalledWith('/data/eol-data.json');
      expect(result).toEqual(mockEOLData);
    });

    it('should cache data and not fetch again on subsequent calls', async () => {
      // fetchのモック設定
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEOLData
      });

      // 最初の呼び出し
      const result1 = await loadEOLData();
      // 2回目の呼び出し
      const result2 = await loadEOLData();
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockEOLData);
      expect(result2).toEqual(mockEOLData);
    });

    it('should handle fetch errors properly', async () => {
      // fetchのモック設定（エラー）
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(loadEOLData()).rejects.toThrow('Failed to load EOL data: 404 Not Found');
    });

    it('should handle invalid JSON data', async () => {
      // fetchのモック設定（無効なデータ）
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => null
      });

      await expect(loadEOLData()).rejects.toThrow('Invalid EOL data format: expected object');
    });

    it('should clear cache on error and allow retry', async () => {
      // 最初はエラー
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(loadEOLData()).rejects.toThrow();

      // 2回目は成功
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEOLData
      });

      const result = await loadEOLData();
      expect(result).toEqual(mockEOLData);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('findEOLProduct', () => {
    it('should find existing product', () => {
      const result = findEOLProduct(mockEOLData, 'python');
      expect(result).toEqual(mockEOLData.python);
    });

    it('should return null for non-existing product', () => {
      const result = findEOLProduct(mockEOLData, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getAvailableTechnologies', () => {
    it('should return sorted list of technology names', () => {
      const result = getAvailableTechnologies(mockEOLData);
      expect(result).toEqual(['nodejs', 'python']);
    });

    it('should return empty array for empty data', () => {
      const result = getAvailableTechnologies({});
      expect(result).toEqual([]);
    });
  });

  describe('clearEOLDataCache', () => {
    it('should clear cache and allow fresh data load', async () => {
      // 最初のデータ読み込み
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEOLData
      });

      await loadEOLData();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // キャッシュクリア
      clearEOLDataCache();

      // 新しいデータで再読み込み
      const newMockData = { ...mockEOLData, 'java': { productName: 'java', cycles: [] } };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => newMockData
      });

      const result = await loadEOLData();
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(newMockData);
    });
  });

  describe('getCachedEOLData', () => {
    it('should return null when no cache exists', () => {
      const result = getCachedEOLData();
      expect(result).toBeNull();
    });

    it('should return cached data when cache exists', async () => {
      // データを読み込んでキャッシュに保存
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEOLData
      });

      await loadEOLData();
      
      const result = getCachedEOLData();
      expect(result).toEqual(mockEOLData);
    });
  });

  describe('hasEOLProduct', () => {
    it('should return true for existing product', () => {
      const result = hasEOLProduct(mockEOLData, 'python');
      expect(result).toBe(true);
    });

    it('should return false for non-existing product', () => {
      const result = hasEOLProduct(mockEOLData, 'nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('findMultipleEOLProducts', () => {
    it('should find multiple existing products', () => {
      const result = findMultipleEOLProducts(mockEOLData, ['python', 'nodejs']);
      expect(result).toEqual({
        python: mockEOLData.python,
        nodejs: mockEOLData.nodejs
      });
    });

    it('should skip non-existing products', () => {
      const result = findMultipleEOLProducts(mockEOLData, ['python', 'nonexistent', 'nodejs']);
      expect(result).toEqual({
        python: mockEOLData.python,
        nodejs: mockEOLData.nodejs
      });
    });

    it('should return empty object when no products found', () => {
      const result = findMultipleEOLProducts(mockEOLData, ['nonexistent1', 'nonexistent2']);
      expect(result).toEqual({});
    });
  });

  describe('getVersionsForTechnology', () => {
    it('should return sorted version list for existing technology', () => {
      const result = getVersionsForTechnology(mockEOLData, 'python');
      expect(result).toEqual(['3.11', '3.10']);
    });

    it('should return single version for technology with one cycle', () => {
      const result = getVersionsForTechnology(mockEOLData, 'nodejs');
      expect(result).toEqual(['18']);
    });

    it('should return empty array for non-existing technology', () => {
      const result = getVersionsForTechnology(mockEOLData, 'nonexistent');
      expect(result).toEqual([]);
    });

    it('should return empty array for technology with no cycles', () => {
      const emptyCyclesData: EOLDataMap = {
        'empty-tech': {
          productName: 'empty-tech',
          cycles: []
        }
      };
      const result = getVersionsForTechnology(emptyCyclesData, 'empty-tech');
      expect(result).toEqual([]);
    });

    it('should sort versions numerically when possible', () => {
      const numericData: EOLDataMap = {
        'test': {
          productName: 'test',
          cycles: [
            { cycle: '1.0', releaseDate: '2020-01-01', eol: '2021-01-01' },
            { cycle: '10.0', releaseDate: '2023-01-01', eol: '2024-01-01' },
            { cycle: '2.0', releaseDate: '2021-01-01', eol: '2022-01-01' }
          ]
        }
      };
      const result = getVersionsForTechnology(numericData, 'test');
      expect(result).toEqual(['10.0', '2.0', '1.0']);
    });
  });
});