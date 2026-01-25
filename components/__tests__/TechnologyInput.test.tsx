import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TechnologyInput from '../TechnologyInput';
import { Technology } from '@/lib/types';

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
      />
    );

    const techNameInput = screen.getByPlaceholderText('技術名（例: python, nodejs）');
    
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
      />
    );

    const versionInput = screen.getByPlaceholderText('バージョン（例: 3.9）');
    
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
      />
    );

    const techNameInput = screen.getByPlaceholderText('技術名（例: python, nodejs）');
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
      />
    );

    const techNameInput = screen.getByPlaceholderText('技術名（例: python, nodejs）');
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
      />
    );

    const techNameInput = screen.getByPlaceholderText('技術名（例: python, nodejs）');
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
      />
    );

    const techNameInput = screen.getByPlaceholderText('技術名（例: python, nodejs）');
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
      />
    );

    const techNameInput = screen.getByPlaceholderText('技術名（例: python, nodejs）');
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
      />
    );

    const versionInput = screen.getByPlaceholderText('バージョン（例: 3.9）');
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
      />
    );

    const techNameInput = screen.getByPlaceholderText('技術名（例: python, nodejs）');
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
        />
        <div data-testid="outside">外部要素</div>
      </div>
    );

    const techNameInput = screen.getByPlaceholderText('技術名（例: python, nodejs）');
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