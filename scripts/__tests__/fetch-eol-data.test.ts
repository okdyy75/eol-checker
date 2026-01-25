import { promises as fs } from 'fs';
import * as path from 'path';
import { fetchEOLData, fetchAllProducts, fetchProductCycles } from '../fetch-eol-data';

// fs.mkdir と fs.writeFile をモック
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn()
  }
}));

// fetch をモック
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;
const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;

describe('fetch-eol-data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // console.log をモック（テスト出力をクリーンに保つため）
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchAllProducts', () => {
    it('正常に製品リストを取得できる', async () => {
      const mockProducts = ['python', 'nodejs', 'react'];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts
      } as Response);

      const result = await fetchAllProducts();

      expect(result).toEqual(mockProducts);
      expect(mockFetch).toHaveBeenCalledWith('https://endoflife.date/api/all.json');
    });

    it('APIエラーの場合は例外を投げる', async () => {
      // 3回すべて同じエラーレスポンスを返す（リトライ対応）
      mockFetch
        .mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        } as Response);

      await expect(fetchAllProducts()).rejects.toThrow('HTTP 404: Not Found');
    });

    it('ネットワークエラーの場合は例外を投げる', async () => {
      // 3回すべて同じネットワークエラーを投げる（リトライ対応）
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchAllProducts()).rejects.toThrow('Network error');
    });
  });

  describe('fetchProductCycles', () => {
    it('正常に製品サイクルを取得できる', async () => {
      const mockCycles = [
        {
          cycle: '3.11',
          releaseDate: '2022-10-24',
          eol: '2027-10-24',
          support: '2024-04-01',
          lts: false
        },
        {
          cycle: '3.10',
          releaseDate: '2021-10-04',
          eol: '2026-10-04',
          support: '2023-04-05',
          lts: false
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCycles
      } as Response);

      const result = await fetchProductCycles('python');

      expect(result).toEqual(mockCycles);
      expect(mockFetch).toHaveBeenCalledWith('https://endoflife.date/api/python.json');
    });

    it('APIエラーの場合は空配列を返す', async () => {
      // 3回すべて同じエラーレスポンスを返す（リトライ対応）
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      const result = await fetchProductCycles('nonexistent');

      expect(result).toEqual([]);
    });

    it('ネットワークエラーの場合は空配列を返す', async () => {
      // 3回すべて同じネットワークエラーを投げる（リトライ対応）
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await fetchProductCycles('python');

      expect(result).toEqual([]);
    });
  });

  describe('fetchEOLData', () => {
    const mockProducts = ['python', 'nodejs'];
    const mockPythonCycles = [
      {
        cycle: '3.11',
        releaseDate: '2022-10-24',
        eol: '2027-10-24'
      }
    ];
    const mockNodejsCycles = [
      {
        cycle: '18',
        releaseDate: '2022-04-19',
        eol: '2025-04-30'
      }
    ];

    beforeEach(() => {
      // 環境変数をテストモードに設定
      process.env.NODE_ENV = 'test';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it('正常にEOLデータを取得して保存できる', async () => {
      // 製品リスト取得のモック
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProducts
        } as Response)
        // python サイクル取得のモック
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPythonCycles
        } as Response)
        // nodejs サイクル取得のモック
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockNodejsCycles
        } as Response);

      await fetchEOLData(2); // テスト用に2製品に制限

      // ディレクトリ作成が呼ばれることを確認
      expect(mockMkdir).toHaveBeenCalledWith('public/data', { recursive: true });

      // ファイル書き込みが呼ばれることを確認
      expect(mockWriteFile).toHaveBeenCalledWith(
        'public/data/eol-data.json',
        expect.stringContaining('python'),
        'utf-8'
      );

      // 書き込まれたデータの構造を確認
      const writeCall = mockWriteFile.mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      
      expect(writtenData).toHaveProperty('python');
      expect(writtenData).toHaveProperty('nodejs');
      expect(writtenData.python.productName).toBe('python');
      expect(writtenData.python.cycles).toEqual(mockPythonCycles);
    });

    it('製品リスト取得に失敗した場合は例外を投げる', async () => {
      // 3回すべて同じエラーを投げる（リトライ対応）
      mockFetch.mockRejectedValue(new Error('API Error'));

      await expect(fetchEOLData()).rejects.toThrow('API Error');
    });

    it('すべての製品サイクル取得に失敗した場合は例外を投げる', async () => {
      // 製品リスト取得は成功
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ['python']
      } as Response);

      // 製品サイクル取得は失敗（空配列を返す）
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(fetchEOLData(1)).rejects.toThrow('取得できたEOLデータがありません');
    });

    it('一部の製品サイクル取得に失敗しても処理を継続する', async () => {
      // 製品リスト取得
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ['python', 'nonexistent']
        } as Response)
        // python サイクル取得は成功
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPythonCycles
        } as Response)
        // nonexistent サイクル取得は失敗（3回すべて失敗）
        .mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        } as Response);

      await fetchEOLData(2);

      // ファイル書き込みが呼ばれることを確認
      expect(mockWriteFile).toHaveBeenCalled();

      // 書き込まれたデータにはpythonのみ含まれることを確認
      const writeCall = mockWriteFile.mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      
      expect(writtenData).toHaveProperty('python');
      expect(writtenData).not.toHaveProperty('nonexistent');
    });

    it('ファイル書き込みに失敗した場合は例外を投げる', async () => {
      // API呼び出しは成功
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ['python']
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPythonCycles
        } as Response);

      // ファイル書き込みで失敗
      mockWriteFile.mockRejectedValueOnce(new Error('Write error'));

      await expect(fetchEOLData(1)).rejects.toThrow('Write error');
    });
  });

  describe('リトライロジック', () => {
    it('一時的な失敗後にリトライして成功する', async () => {
      const mockProducts = ['python'];

      // 最初の2回は失敗、3回目で成功
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProducts
        } as Response);

      const result = await fetchAllProducts();

      expect(result).toEqual(mockProducts);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('最大リトライ回数を超えた場合は例外を投げる', async () => {
      // すべての試行で失敗
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchAllProducts()).rejects.toThrow('3回の試行後も失敗');
    });
  });
});