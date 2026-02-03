import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TechnologyInput from '../TechnologyInput';
import { Technology, EOLDataMap } from '@/lib/types';

// モックデータ
const mockTechnology: Technology = {
  id: 'tech-1',
  name: 'python',
  currentVersion: '3.9'
};

const mockAvailableTechnologies = [
  'python',
  'nodejs',
  'react',
  'typescript',
  'java',
  'postgresql'
];

const mockEOLData: EOLDataMap = {
  'python': {
    productName: 'python',
    cycles: [
      { cycle: '3.11', releaseDate: '2022-10-24', eol: '2027-10-24' },
      { cycle: '3.10', releaseDate: '2021-10-04', eol: '2026-10-04' },
      { cycle: '3.9', releaseDate: '2020-10-05', eol: '2025-10-05' }
    ]
  },
  'nodejs': {
    productName: 'nodejs',
    cycles: [
      { cycle: '20', releaseDate: '2023-04-18', eol: '2026-04-30' },
      { cycle: '18', releaseDate: '2022-04-19', eol: '2025-04-30' }
    ]
  }
};

const mockOnChange = jest.fn();
const mockOnRemove = jest.fn();

describe('TechnologyInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期状態で正しくレンダリングされる', () => {
    render(
      <TechnologyInput
        technology={mockTechnology}
        availableTechnologies={mockAvailableTechnologies}
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        eolData={null}
      />
    );

    expect(screen.getByDisplayValue('python')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3.9')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
  });

  it('技術名を入力できる', async () => {
    const user = userEvent.setup();
    
    render(
      <TechnologyInput
        technology={{ ...mockTechnology, name: '' }}
        availableTechnologies={mockAvailableTechnologies}
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        eolData={mockEOLData}
      />
    );

    const techNameInput = screen.getByPlaceholderText('例: python, nodejs, mysql');
    
    // fireEventを使用して直接changeイベントを発火
    fireEvent.change(techNameInput, { target: { value: 'node' } });

    // onChangeが正しい値で呼ばれたことを確認
    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockTechnology,
      name: 'node'
    });
  });

  it('バージョンを入力できる', async () => {
    const user = userEvent.setup();
    
    render(
      <TechnologyInput
        technology={{ ...mockTechnology, currentVersion: '' }}
        availableTechnologies={mockAvailableTechnologies}
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        eolData={mockEOLData}
      />
    );

    const versionInput = screen.getByPlaceholderText('例: 3.9, 18');
    
    // fireEventを使用して直接changeイベントを発火
    fireEvent.change(versionInput, { target: { value: '18.0' } });

    // onChangeが正しい値で呼ばれたことを確認
    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockTechnology,
      currentVersion: '18.0'
    });
  });

  it('削除ボタンをクリックすると削除処理が呼ばれる', async () => {
    const user = userEvent.setup();
    
    render(
      <TechnologyInput
        technology={mockTechnology}
        availableTechnologies={mockAvailableTechnologies}
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        eolData={mockEOLData}
      />
    );

    const removeButton = screen.getByRole('button', { name: '削除' });
    await user.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  it('技術名入力時にオートコンプリート候補が表示される', async () => {
    const user = userEvent.setup();
    
    render(
      <TechnologyInput
        technology={{ ...mockTechnology, name: '' }}
        availableTechnologies={mockAvailableTechnologies}
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        eolData={mockEOLData}
      />
    );

    const techNameInput = screen.getByPlaceholderText('例: python, nodejs, mysql');
    await user.type(techNameInput, 'node');

    await waitFor(() => {
      expect(screen.getByText('nodejs')).toBeInTheDocument();
    });
  });

  it('オートコンプリート候補をクリックすると選択される', async () => {
    const user = userEvent.setup();
    
    render(
      <TechnologyInput
        technology={{ ...mockTechnology, name: '' }}
        availableTechnologies={mockAvailableTechnologies}
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        eolData={mockEOLData}
      />
    );

    const techNameInput = screen.getByPlaceholderText('例: python, nodejs, mysql');
    await user.type(techNameInput, 'node');

    await waitFor(() => {
      expect(screen.getByText('nodejs')).toBeInTheDocument();
    });

    await user.click(screen.getByText('nodejs'));

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockTechnology,
      name: 'nodejs'
    });
  });

  it('キーボードでオートコンプリート候補を選択できる', async () => {
    const user = userEvent.setup();
    
    render(
      <TechnologyInput
        technology={{ ...mockTechnology, name: '' }}
        availableTechnologies={mockAvailableTechnologies}
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        eolData={mockEOLData}
      />
    );

    const techNameInput = screen.getByPlaceholderText('例: python, nodejs, mysql');
    await user.type(techNameInput, 'node');

    await waitFor(() => {
      expect(screen.getByText('nodejs')).toBeInTheDocument();
    });

    // 下矢印キーで候補を選択
    fireEvent.keyDown(techNameInput, { key: 'ArrowDown' });
    // Enterキーで確定
    fireEvent.keyDown(techNameInput, { key: 'Enter' });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockTechnology,
      name: 'nodejs'
    });
  });

  it('Escapeキーでオートコンプリート候補を閉じる', async () => {
    const user = userEvent.setup();
    
    render(
      <TechnologyInput
        technology={{ ...mockTechnology, name: '' }}
        availableTechnologies={mockAvailableTechnologies}
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        eolData={mockEOLData}
      />
    );

    const techNameInput = screen.getByPlaceholderText('例: python, nodejs, mysql');
    await user.type(techNameInput, 'node');

    await waitFor(() => {
      expect(screen.getByText('nodejs')).toBeInTheDocument();
    });

    fireEvent.keyDown(techNameInput, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('nodejs')).not.toBeInTheDocument();
    });
  });

  it('空の技術名でバリデーションエラーが表示される', async () => {
    const user = userEvent.setup();
    
    render(
      <TechnologyInput
        technology={{ ...mockTechnology, name: '' }}
        availableTechnologies={mockAvailableTechnologies}
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        eolData={mockEOLData}
      />
    );

    const techNameInput = screen.getByPlaceholderText('例: python, nodejs, mysql');
    await user.type(techNameInput, ' '); // 空白文字を入力
    await user.clear(techNameInput); // クリア

    await waitFor(() => {
      expect(screen.getByText(/技術名:/)).toBeInTheDocument();
    });
  });

  it('空のバージョンでバリデーションエラーが表示される', async () => {
    const user = userEvent.setup();
    
    render(
      <TechnologyInput
        technology={{ ...mockTechnology, currentVersion: '' }}
        availableTechnologies={mockAvailableTechnologies}
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        eolData={mockEOLData}
      />
    );

    const versionInput = screen.getByPlaceholderText('例: 3.9, 18');
    await user.type(versionInput, ' '); // 空白文字を入力
    await user.clear(versionInput); // クリア

    await waitFor(() => {
      expect(screen.getByText(/バージョン:/)).toBeInTheDocument();
    });
  });

  it('バリデーションエラーがある場合、フィールドが赤色で表示される', async () => {
    const user = userEvent.setup();
    
    render(
      <TechnologyInput
        technology={{ ...mockTechnology, name: '', currentVersion: '' }}
        availableTechnologies={mockAvailableTechnologies}
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        eolData={mockEOLData}
      />
    );

    const techNameInput = screen.getByPlaceholderText('例: python, nodejs, mysql');
    await user.type(techNameInput, ' ');
    await user.clear(techNameInput);

    await waitFor(() => {
      expect(techNameInput).toHaveClass('border-red-500');
    });
  });

  it('外部クリックでオートコンプリート候補が閉じる', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <TechnologyInput
          technology={{ ...mockTechnology, name: '' }}
          availableTechnologies={mockAvailableTechnologies}
          onChange={mockOnChange}
          onRemove={mockOnRemove}
          eolData={mockEOLData}
        />
        <div data-testid="outside">外部要素</div>
      </div>
    );

    const techNameInput = screen.getByPlaceholderText('例: python, nodejs, mysql');
    await user.type(techNameInput, 'node');

    await waitFor(() => {
      expect(screen.getByText('nodejs')).toBeInTheDocument();
    });

    // 外部要素をクリック
    await user.click(screen.getByTestId('outside'));

    await waitFor(() => {
      expect(screen.queryByText('nodejs')).not.toBeInTheDocument();
    });
  });
});