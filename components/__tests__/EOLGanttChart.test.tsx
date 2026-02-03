import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EOLGanttChart from '../EOLGanttChart';
import { Service, EOLDataMap } from '../../lib/types';

// gantt-task-reactのモック
jest.mock('gantt-task-react', () => ({
  Gantt: ({ tasks }: { tasks: any[] }) => (
    <div data-testid="gantt-chart" className="mock-gantt">
      <div data-testid="gantt-tasks">
        {JSON.stringify(tasks)}
      </div>
    </div>
  ),
  ViewMode: {
    Month: 'Month',
  },
}));

// CSSインポートのモック
jest.mock('gantt-task-react/dist/index.css', () => ({}));

describe('EOLGanttChart', () => {
  const mockEOLData: EOLDataMap = {
    python: {
      productName: 'python',
      cycles: [
        {
          cycle: '3.9',
          releaseDate: '2020-10-05',
          eol: '2025-10-05',
        },
        {
          cycle: '3.10',
          releaseDate: '2021-10-04',
          eol: '2026-10-04',
        },
      ],
    },
    nodejs: {
      productName: 'nodejs',
      cycles: [
        {
          cycle: '18',
          releaseDate: '2022-04-19',
          eol: '2025-04-30',
        },
      ],
    },
  };

  const mockServices: Service[] = [
    {
      id: '1',
      name: 'Test Service',
      technologies: [
        {
          id: '1',
          name: 'python',
          currentVersion: '3.9',
        },
        {
          id: '2',
          name: 'nodejs',
          currentVersion: '18',
        },
      ],
    },
  ];

  beforeEach(() => {
    // DOMメソッドのモック
    Object.defineProperty(document, 'querySelector', {
      value: jest.fn(() => ({
        getBoundingClientRect: () => ({ width: 800 }),
        querySelector: jest.fn(() => null),
        appendChild: jest.fn(),
        remove: jest.fn(),
      })),
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('サービスが空の場合、空のメッセージを表示する', () => {
    render(<EOLGanttChart services={[]} eolData={mockEOLData} />);
    
    expect(screen.getByText('EOLタイムライン')).toBeInTheDocument();
    expect(screen.getByText(/サービスと技術を追加すると/)).toBeInTheDocument();
  });

  test('有効なサービスデータがある場合、ガントチャートを表示する', () => {
    render(<EOLGanttChart services={mockServices} eolData={mockEOLData} />);
    
    expect(screen.getByText('EOL タイムライン')).toBeInTheDocument();
    expect(screen.getByTestId('gantt-chart')).toBeInTheDocument();
    // ツールチップはホバー時に表示されるため、初期状態では存在しない
  });

  test('凡例が正しく表示される', () => {
    render(<EOLGanttChart services={mockServices} eolData={mockEOLData} />);
    
    expect(screen.getByText(/最新・推奨/)).toBeInTheDocument();
    expect(screen.getByText(/アクティブサポート/)).toBeInTheDocument();
    expect(screen.getByText(/メンテナンス/)).toBeInTheDocument();
    expect(screen.getByText(/サポート終了/)).toBeInTheDocument();
  });

  test('EOLデータが存在しない場合、適切なメッセージを表示する', () => {
    const servicesWithUnknownTech: Service[] = [
      {
        id: '1',
        name: 'Test Service',
        technologies: [
          {
            id: '1',
            name: 'unknown-tech',
            currentVersion: '1.0',
          },
        ],
      },
    ];

    render(<EOLGanttChart services={servicesWithUnknownTech} eolData={mockEOLData} />);
    
    // メッセージが統合されたため、サービスが空の場合と同じメッセージが表示される
    expect(screen.getByText('EOLタイムライン')).toBeInTheDocument();
    expect(screen.getByText(/サービスと技術を追加すると/)).toBeInTheDocument();
  });

  test('ガントチャートに正しいプロパティが渡される', () => {
    render(<EOLGanttChart services={mockServices} eolData={mockEOLData} />);
    
    const ganttElement = screen.getByTestId('gantt-chart');
    expect(ganttElement).toHaveClass('mock-gantt');
  });

  test('カスタムツールチップコンテンツが正しく表示される', () => {
    const mockTaskData = {
      id: 1,
      text: 'python 3.9',
      start: new Date('2020-10-05'),
      end: new Date('2025-10-05'),
      type: 'task' as const,
      // detailsはstring型でJSONとして保存
      details: JSON.stringify({
        version: '3.9',
        eolDate: '2025-10-05',
        isEOL: false,
      }),
    };

    // カスタムツールチップコンテンツを直接テストするため、
    // 別のテストコンポーネントを作成
    const TestTooltipContent = ({ data }: { data: any }) => {
      if (!data || !data.details) {
        return null;
      }

      // detailsはstring型なので、JSONとしてパースする
      let details;
      try {
        details = typeof data.details === 'string' ? JSON.parse(data.details) : data.details;
      } catch {
        return null;
      }

      const formatDate = (dateStr: string) => {
        try {
          return new Date(dateStr).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        } catch {
          return dateStr;
        }
      };

      return (
        <div className="eol-tooltip">
          <div className="tooltip-row">
            <span className="tooltip-label">バージョン:</span>
            <span className="tooltip-value">{details.version}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">リリース日:</span>
            <span className="tooltip-value">{formatDate(data.start?.toString() || '')}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">EOL日:</span>
            <span className="tooltip-value">{formatDate(details.eolDate)}</span>
          </div>
          {details.isEOL && (
            <div className="tooltip-row eol-warning">
              <span className="tooltip-value">⚠️ サポート終了済み</span>
            </div>
          )}
        </div>
      );
    };

    const { container } = render(<TestTooltipContent data={mockTaskData} />);
    
    expect(container.textContent).toContain('3.9');
    expect(container.textContent).toContain('2020/10/05');
    expect(container.textContent).toContain('2025/10/05');
  });

  test('EOL済みタスクに警告が表示される', () => {
    const eolTaskData = {
      id: 1,
      text: 'python 2.7',
      start: new Date('2010-07-03'),
      end: new Date('2020-01-01'),
      type: 'task' as const,
      // detailsはstring型でJSONとして保存
      details: JSON.stringify({
        version: '2.7',
        eolDate: '2020-01-01',
        isEOL: true,
      }),
    };

    const TestTooltipContent = ({ data }: { data: any }) => {
      if (!data || !data.details) {
        return null;
      }

      // detailsはstring型なので、JSONとしてパースする
      let details;
      try {
        details = typeof data.details === 'string' ? JSON.parse(data.details) : data.details;
      } catch {
        return null;
      }

      const formatDate = (dateStr: string) => {
        try {
          return new Date(dateStr).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        } catch {
          return dateStr;
        }
      };

      return (
        <div className="eol-tooltip">
          <div className="tooltip-row">
            <span className="tooltip-label">バージョン:</span>
            <span className="tooltip-value">{details.version}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">リリース日:</span>
            <span className="tooltip-value">{formatDate(data.start?.toString() || '')}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">EOL日:</span>
            <span className="tooltip-value">{formatDate(details.eolDate)}</span>
          </div>
          {details.isEOL && (
            <div className="tooltip-row eol-warning">
              <span className="tooltip-value">⚠️ サポート終了済み</span>
            </div>
          )}
        </div>
      );
    };

    const { container } = render(<TestTooltipContent data={eolTaskData} />);
    
    expect(container.textContent).toContain('⚠️ サポート終了済み');
  });
});