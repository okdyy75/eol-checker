import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  getAvailableTechnologies: jest.fn().mockReturnValue(['python', 'nodejs', 'react'])
}));

describe('ServiceForm', () => {
  const mockOnServicesChange = jest.fn();
  const defaultProps = {
    services: [] as Service[],
    onServicesChange: mockOnServicesChange
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期状態で正しくレンダリングされる', async () => {
    render(<ServiceForm {...defaultProps} />);
    
    // ローディング状態の確認
    expect(screen.getByText('技術データを読み込み中...')).toBeInTheDocument();
    
    // データ読み込み後の確認
    await waitFor(() => {
      expect(screen.getByText('サービスと技術スタック')).toBeInTheDocument();
    });
    
    expect(screen.getByText('まだサービスが追加されていません')).toBeInTheDocument();
    expect(screen.getByText('最初のサービスを追加')).toBeInTheDocument();
  });

  it('サービスを追加できる', async () => {
    render(<ServiceForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('サービスと技術スタック')).toBeInTheDocument();
    });
    
    const addButton = screen.getByText('最初のサービスを追加');
    fireEvent.click(addButton);
    
    expect(mockOnServicesChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: expect.any(String),
        name: '',
        technologies: []
      })
    ]);
  });

  it('サービス名を入力できる', async () => {
    const serviceWithEmptyName: Service = {
      id: 'service-1',
      name: '',
      technologies: []
    };
    
    render(<ServiceForm services={[serviceWithEmptyName]} onServicesChange={mockOnServicesChange} />);
    
    await waitFor(() => {
      expect(screen.getByText('サービスと技術スタック')).toBeInTheDocument();
    });
    
    const serviceNameInput = screen.getByPlaceholderText(/サービス名を入力/);
    fireEvent.change(serviceNameInput, { target: { value: 'テストサービス' } });
    
    expect(mockOnServicesChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'service-1',
        name: 'テストサービス',
        technologies: []
      })
    ]);
  });

  it('技術を追加できる', async () => {
    const serviceWithName: Service = {
      id: 'service-1',
      name: 'テストサービス',
      technologies: []
    };
    
    render(<ServiceForm services={[serviceWithName]} onServicesChange={mockOnServicesChange} />);
    
    await waitFor(() => {
      expect(screen.getByText('サービスと技術スタック')).toBeInTheDocument();
    });
    
    const addTechButton = screen.getByText('技術を追加');
    fireEvent.click(addTechButton);
    
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
    
    render(<ServiceForm services={services} onServicesChange={mockOnServicesChange} />);
    
    await waitFor(() => {
      expect(screen.getByText('サービスと技術スタック')).toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByText('削除');
    fireEvent.click(deleteButtons[0]); // 最初のサービスを削除
    
    expect(mockOnServicesChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'service-2',
        name: 'テストサービス2',
        technologies: []
      })
    ]);
  });

  it('バリデーションエラーが表示される', async () => {
    const serviceWithInvalidData: Service = {
      id: 'service-1',
      name: '', // 空のサービス名
      technologies: [
        {
          id: 'tech-1',
          name: '', // 空の技術名
          currentVersion: '' // 空のバージョン
        }
      ]
    };
    
    render(<ServiceForm services={[serviceWithInvalidData]} onServicesChange={mockOnServicesChange} />);
    
    await waitFor(() => {
      expect(screen.getByText('サービスと技術スタック')).toBeInTheDocument();
    });
    
    // バリデーションエラーが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('入力エラー')).toBeInTheDocument();
    });
  });

  it('すべてのデータをクリアできる', async () => {
    const services: Service[] = [
      {
        id: 'service-1',
        name: 'テストサービス',
        technologies: []
      }
    ];
    
    // window.confirmをモック
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(<ServiceForm services={services} onServicesChange={mockOnServicesChange} />);
    
    await waitFor(() => {
      expect(screen.getByText('サービスと技術スタック')).toBeInTheDocument();
    });
    
    const clearButton = screen.getByText('すべてクリア');
    fireEvent.click(clearButton);
    
    expect(confirmSpy).toHaveBeenCalledWith('すべてのデータをクリアしますか？この操作は元に戻せません。');
    expect(mockOnServicesChange).toHaveBeenCalledWith([]);
    
    confirmSpy.mockRestore();
  });
});