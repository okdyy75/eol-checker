import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServiceForm from '../ServiceForm';
import { Service } from '@/lib/types';

// EOLデータの読み込みをモック
jest.mock('@/lib/eol-data', () => ({
  loadEOLData: jest.fn().mockResolvedValue({
    'python': {
      productName: 'python',
      cycles: [
        { cycle: '3.9', releaseDate: '2020-10-05', eol: '2025-10-05' },
        { cycle: '3.10', releaseDate: '2021-10-04', eol: '2026-10-04' }
      ]
    },
    'nodejs': {
      productName: 'nodejs',
      cycles: [
        { cycle: '18', releaseDate: '2022-04-19', eol: '2025-04-30' },
        { cycle: '20', releaseDate: '2023-04-18', eol: '2026-04-30' }
      ]
    }
  }),
  getAvailableTechnologies: jest.fn().mockReturnValue(['python', 'nodejs', 'react']),
  getVersionsForTechnology: jest.fn().mockImplementation((eolData, productName) => {
    if (!eolData || !productName) return [];
    const product = eolData[productName];
    if (!product || !product.cycles) return [];
    return product.cycles.map((cycle: { cycle: string }) => cycle.cycle).sort((a: string, b: string) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numB - numA;
      }
      return b.localeCompare(a);
    });
  })
}));

describe('ServiceForm', () => {
  const mockOnServicesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ローディング状態を表示する', async () => {
    render(<ServiceForm services={[]} onServicesChange={mockOnServicesChange} />);
    
    // ローディング状態の確認
    expect(screen.getByText('技術データを読み込み中...')).toBeInTheDocument();
  });

  it('既存のサービスがある場合はそれを表示する', async () => {
    const services: Service[] = [
      {
        id: 'service-1',
        name: 'テストサービス',
        technologies: []
      }
    ];
    
    await act(async () => {
      render(<ServiceForm services={services} onServicesChange={mockOnServicesChange} />);
    });
    
    // サービス名が入力されていることを確認
    const serviceNameInput = screen.getByPlaceholderText(/サービス名を入力/);
    expect(serviceNameInput).toHaveValue('テストサービス');
    
    // サービス一覧に表示されていることを確認
    expect(screen.getByText('テストサービス')).toBeInTheDocument();
  });

  it('サービス名を入力するとリアルタイムで保存される', async () => {
    const services: Service[] = [
      {
        id: 'service-1',
        name: '',
        technologies: []
      }
    ];
    
    await act(async () => {
      render(<ServiceForm services={services} onServicesChange={mockOnServicesChange} />);
    });
    
    const serviceNameInput = screen.getByPlaceholderText(/サービス名を入力/);
    
    await act(async () => {
      fireEvent.change(serviceNameInput, { target: { value: 'テストサービス' } });
    });
    
    // リアルタイムで保存されることを確認
    expect(mockOnServicesChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'service-1',
        name: 'テストサービス',
        technologies: []
      })
    ]);
  });

  it('技術を追加できる', async () => {
    const services: Service[] = [
      {
        id: 'service-1',
        name: 'テストサービス',
        technologies: []
      }
    ];
    
    await act(async () => {
      render(<ServiceForm services={services} onServicesChange={mockOnServicesChange} />);
    });
    
    const addTechButton = screen.getByText('+ 技術を追加');
    
    await act(async () => {
      fireEvent.click(addTechButton);
    });
    
    // 技術が追加されたことを確認
    expect(mockOnServicesChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'service-1',
        name: 'テストサービス',
        technologies: [
          expect.objectContaining({
            id: expect.any(String),
            name: '',
            currentVersion: ''
          })
        ]
      })
    ]);
  });

  it('サービスを削除できる', async () => {
    const services: Service[] = [
      {
        id: 'service-1',
        name: 'テストサービス1',
        technologies: []
      },
      {
        id: 'service-2',
        name: 'テストサービス2',
        technologies: []
      }
    ];
    
    await act(async () => {
      render(<ServiceForm services={services} onServicesChange={mockOnServicesChange} />);
    });
    
    // 削除ボタンをクリック（最初のサービスの削除ボタン）
    const deleteButtons = screen.getAllByText('削除');
    
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });
    
    expect(mockOnServicesChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'service-2',
        name: 'テストサービス2',
        technologies: []
      })
    ]);
  });

  it('既存のサービスを選択して編集できる', async () => {
    const services: Service[] = [
      {
        id: 'service-1',
        name: 'サービス1',
        technologies: []
      },
      {
        id: 'service-2',
        name: 'サービス2',
        technologies: [
          {
            id: 'tech-1',
            name: 'python',
            currentVersion: '3.9'
          }
        ]
      }
    ];
    
    await act(async () => {
      render(<ServiceForm services={services} onServicesChange={mockOnServicesChange} />);
    });
    
    // 2番目のサービスをクリックして選択（親要素のdivをクリック）
    const service2Card = screen.getByText('サービス2').closest('div[class*="cursor-pointer"]');
    
    await act(async () => {
      fireEvent.click(service2Card!);
    });
    
    // サービス名が切り替わったことを確認
    await waitFor(() => {
      const serviceNameInput = screen.getByPlaceholderText(/サービス名を入力/) as HTMLInputElement;
      expect(serviceNameInput.value).toBe('サービス2');
    });
  });

  it('新規サービスを追加できる', async () => {
    const services: Service[] = [
      {
        id: 'service-1',
        name: 'テストサービス',
        technologies: []
      }
    ];
    
    await act(async () => {
      render(<ServiceForm services={services} onServicesChange={mockOnServicesChange} />);
    });
    
    // 新規サービス追加ボタンをクリック
    const addButton = screen.getByText('+ サービスを追加');
    
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // 新規サービスが追加されたことを確認（自動でservice2という名前が付き、初期技術フォームが含まれる）
    expect(mockOnServicesChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'service-1',
        name: 'テストサービス',
        technologies: []
      }),
      expect.objectContaining({
        id: expect.any(String),
        name: 'service2',
        technologies: [
          expect.objectContaining({
            id: expect.any(String),
            name: '',
            currentVersion: ''
          })
        ]
      })
    ]);
  });

  it('選択中のサービスがハイライト表示される', async () => {
    const services: Service[] = [
      {
        id: 'service-1',
        name: 'サービス1',
        technologies: []
      },
      {
        id: 'service-2',
        name: 'サービス2',
        technologies: []
      }
    ];
    
    await act(async () => {
      render(<ServiceForm services={services} onServicesChange={mockOnServicesChange} />);
    });
    
    // 2番目のサービスを選択
    const service2Element = screen.getByText('サービス2').closest('div[class*="border"]');
    
    await act(async () => {
      fireEvent.click(service2Element!);
    });
    
    // 選択されたサービスがハイライトされていることを確認（border-blue-500クラス）
    const selectedElement = screen.getByText('サービス2').closest('div[class*="border-blue-500"]');
    expect(selectedElement).toBeInTheDocument();
  });
});
