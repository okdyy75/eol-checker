import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TechnologyInput from '../TechnologyInput';
import { Technology, EOLDataMap } from '@/lib/types';

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
  python: {
    productName: 'python',
    cycles: [
      { cycle: '3.11', releaseDate: '2022-10-24', eol: '2027-10-24' },
      { cycle: '3.10', releaseDate: '2021-10-04', eol: '2026-10-04' },
      { cycle: '3.9', releaseDate: '2020-10-05', eol: '2025-10-05' }
    ]
  },
  nodejs: {
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
        eolData={mockEOLData}
      />
    );

    expect(screen.getByDisplayValue('python')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3.9')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
  });

  it('新規追加直後の空入力ではエラーを表示しない', () => {
    render(
      <TechnologyInput
        technology={{ ...mockTechnology, name: '', currentVersion: '' }}
        availableTechnologies={mockAvailableTechnologies}
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        eolData={mockEOLData}
      />
    );

    expect(screen.queryByText('正しい技術を入力してください')).not.toBeInTheDocument();
    expect(screen.queryByText('正しいバージョンを入力してください')).not.toBeInTheDocument();
  });

  it('技術名の入力中は候補表示だけ行い、確定値は更新しない', () => {
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
    fireEvent.change(techNameInput, { target: { value: 'node' } });

    expect(mockOnChange).not.toHaveBeenCalled();
    expect(techNameInput).toHaveValue('node');
    expect(screen.getByText('nodejs')).toBeInTheDocument();
  });

  it('バージョンの入力中は候補表示だけ行い、確定値は更新しない', () => {
    render(
      <TechnologyInput
        technology={mockTechnology}
        availableTechnologies={mockAvailableTechnologies}
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        eolData={mockEOLData}
      />
    );

    const versionInput = screen.getByPlaceholderText('例: 3.9, 18');
    fireEvent.focus(versionInput);
    fireEvent.change(versionInput, { target: { value: '3.1' } });

    expect(mockOnChange).not.toHaveBeenCalled();
    expect(versionInput).toHaveValue('3.1');
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
      name: 'nodejs',
      currentVersion: ''
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

    fireEvent.keyDown(techNameInput, { key: 'ArrowDown' });
    fireEvent.keyDown(techNameInput, { key: 'Enter' });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockTechnology,
      name: 'nodejs',
      currentVersion: ''
    });
  });

  it('候補を選ばずに技術名入力を離れると元の値に戻る', async () => {
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

    const techNameInput = screen.getByPlaceholderText('例: python, nodejs, mysql');
    await user.clear(techNameInput);
    await user.type(techNameInput, 'unknown-tech');
    fireEvent.blur(techNameInput);

    expect(techNameInput).toHaveValue('python');
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('技術名を空にして離れると技術をクリアする', async () => {
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

    const techNameInput = screen.getByPlaceholderText('例: python, nodejs, mysql');
    await user.clear(techNameInput);
    fireEvent.blur(techNameInput);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockTechnology,
      name: '',
      currentVersion: ''
    });
  });

  it('候補を選ばずにバージョン入力を離れると元の値に戻る', async () => {
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

    const versionInput = screen.getByPlaceholderText('例: 3.9, 18');
    await user.clear(versionInput);
    await user.type(versionInput, '9.9');
    fireEvent.blur(versionInput);

    expect(versionInput).toHaveValue('3.9');
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('バージョンを空にして離れるとバージョンをクリアする', async () => {
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

    const versionInput = screen.getByPlaceholderText('例: 3.9, 18');
    await user.clear(versionInput);
    fireEvent.blur(versionInput);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockTechnology,
      currentVersion: ''
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

    await user.click(screen.getByTestId('outside'));

    await waitFor(() => {
      expect(screen.queryByText('nodejs')).not.toBeInTheDocument();
    });
  });
});
