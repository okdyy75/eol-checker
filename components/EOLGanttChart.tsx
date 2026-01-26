'use client';

import React, { useMemo, useCallback } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { Service, EOLDataMap } from '../lib/types';
import { convertToGanttData } from '../lib/gantt-adapter';

// ライフサイクルステージの型定義
// - current: 最新・推奨バージョン（緑 #22c55e）
// - active: アクティブサポート中（青 #3b82f6）
// - maintenance: メンテナンスモード（グレー #94a3b8）
// - eol: サポート終了（赤 #ef4444）
type SegmentStage = 'current' | 'active' | 'maintenance' | 'eol';
type SegmentWithStage = {
  start: Date;
  end: Date;
  stage: SegmentStage;
};
type TaskWithSegments = Task & {
  segments?: Array<{
    start: Date;
    end: Date;
    color?: string;
  }>;
};

/**
 * EOLGanttChartコンポーネントのProps
 */
interface EOLGanttChartProps {
  services: Service[];
  eolData: EOLDataMap;
}

/**
 * EOLGanttChartコンポーネント
 * 
 * 要件を満たす機能:
 * - 3.1: 入力されたすべてのServiceとTechnologyをGantt_Chartとして表示する
 * - 3.2: Serviceが複数のTechnologyを持つ場合、各Technologyを個別の行として表示する
 * - 3.3: Technologyに現在のVersionが指定されている場合、現在のVersionから最新Versionまでのすべてのバージョンを表示する
 * - 3.4: 各Versionのバーを、リリース日からEOL_Dateまでの期間として表示する
 * - 3.5: 現在日付を示す垂直線をチャート上に表示する
 * - 3.6: すでにEOLを迎えたVersionを視覚的に区別できるようにする（例：異なる色で表示）
 * - 3.7: ユーザーがチャート上のバーにホバーした場合、Version番号、リリース日、EOL_Dateを含む詳細情報を表示する
 * - 5.2: 画面幅が狭い場合、Gantt_Chartを水平スクロール可能にする
 */
export default function EOLGanttChart({ services, eolData }: EOLGanttChartProps) {
  // カスタムタスクリストヘッダー（From/Toカラムを表示しない）
  const TaskListHeaderComponent = useCallback(() => {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '50px',
          borderBottom: '2px solid #e5e7eb',
          backgroundColor: '#f3f4f6',
          fontWeight: 'bold',
          fontSize: '14px',
          paddingLeft: '10px',
        }}
      >
        <div style={{ width: '200px' }}>技術 / バージョン</div>
      </div>
    );
  }, []);

  // カスタムタスクリストテーブル（From/Toカラムを表示しない）
  const TaskListTableComponent = useCallback(({ tasks, rowHeight }: any) => {
    return (
      <div>
        {tasks.map((task: Task) => (
          <div
            key={task.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: `${rowHeight}px`,
              borderBottom: '1px solid #e5e7eb',
              fontSize: '14px',
              paddingLeft: '10px',
            }}
          >
            <div style={{ width: '200px' }}>{task.name}</div>
          </div>
        ))}
      </div>
    );
  }, []);

  // ステージに応じた色を取得する関数
  // current: 緑 #22c55e, active: 青 #3b82f6, maintenance: グレー #94a3b8, eol: 赤 #ef4444
  const getStageColor = useCallback((stage: string): string => {
    const colors: Record<string, string> = {
      current: '#22c55e',      // 最新・推奨
      active: '#3b82f6',       // アクティブサポート
      maintenance: '#94a3b8',  // メンテナンス
      eol: '#ef4444'           // サポート終了
    };
    return colors[stage] || '#3b82f6';
  }, []);

  // サービスごとにガントチャートデータを生成
  const serviceCharts = useMemo(() => {
    return services.map(service => {
      const data = convertToGanttData([service], eolData);
      
      // gantt-task-react用のTask配列に変換
      const tasks: TaskWithSegments[] = data.tasks.map((task, index) => {
        let details;
        try {
          details = task.details ? JSON.parse(task.details as string) : {};
        } catch {
          details = {};
        }

        const rawSegments = (task as { segments?: SegmentWithStage[] }).segments;
        const segments = rawSegments && rawSegments.length
          ? rawSegments.map(segment => ({
              start: segment.start,
              end: segment.end,
              color: getStageColor(segment.stage),
            }))
          : undefined;

        return {
          start: task.start || new Date(),
          end: task.end || new Date(),
          name: task.text || '',
          id: task.id?.toString() || index.toString(),
          type: 'task', // すべてtaskタイプに
          progress: task.progress || 0,
          isDisabled: false,
          styles: {
            backgroundColor: getStageColor(details.stage || 'active'),
            backgroundSelectedColor: getStageColor(details.stage || 'active'),
            progressColor: '#ffbb54',
            progressSelectedColor: '#ff9e0d',
          },
          ...(segments ? { segments } : {}),
        };
      });

      return {
        serviceName: service.name,
        tasks,
      };
    });
  }, [services, eolData, getStageColor]);

  // データが空の場合の表示
  if (!services.length) {
    return (
      <div className="eol-gantt-empty">
        <div className="empty-message">
          <h3>ガントチャートを表示するには、サービスと技術を追加してください</h3>
          <p>上のフォームからサービスを追加し、使用している技術とバージョンを入力してください。</p>
        </div>
      </div>
    );
  }

  // タスクが存在しない場合（EOLデータが見つからない場合など）
  if (!serviceCharts.length || serviceCharts.every(chart => !chart.tasks.length)) {
    return (
      <div className="eol-gantt-empty">
        <div className="empty-message">
          <h3>表示可能なEOLデータがありません</h3>
          <p>入力された技術のEOL情報が見つからないか、有効なバージョン情報がありません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="eol-gantt-container">
      {/* ヘッダー */}
      <div className="eol-gantt-header">
        <h2>EOL タイムライン</h2>
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color current"></div>
            <span>最新・推奨 (Current)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color active"></div>
            <span>アクティブサポート (Active)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color maintenance"></div>
            <span>メンテナンス (Maintenance)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color eol"></div>
            <span>サポート終了 (EOL)</span>
          </div>
        </div>
      </div>

      {/* サービスごとにガントチャートを表示 */}
      {serviceCharts.map((chart, index) => (
        <div key={index} className="service-gantt-section">
          <h3 className="service-title">{chart.serviceName}</h3>
          <div className="eol-gantt-wrapper">
            <Gantt
              tasks={chart.tasks}
              viewMode={ViewMode.Month}
              locale="ja"
              columnWidth={60}
              listCellWidth="200px"
              rowHeight={50}
              ganttHeight={Math.max(300, chart.tasks.length * 50 + 100)}
              barCornerRadius={0}
              handleWidth={8}
              fontFamily="Arial, sans-serif"
              fontSize="14"
              barFill={60}
              barProgressColor="#a3a3a3"
              barProgressSelectedColor="#8884d8"
              barBackgroundColor="#b8c2cc"
              barBackgroundSelectedColor="#aeb8c2"
              projectProgressColor="#7db46c"
              projectProgressSelectedColor="#59a14f"
              projectBackgroundColor="#fac465"
              projectBackgroundSelectedColor="#f7bb53"
              milestoneBackgroundColor="#f1c453"
              milestoneBackgroundSelectedColor="#f29e4c"
              rtl={false}
              todayColor="rgba(239, 68, 68, 0.2)"
              TaskListHeader={TaskListHeaderComponent}
              TaskListTable={TaskListTableComponent}
              TooltipContent={({ task }) => {
                let details;
                try {
                  const taskData = chart.tasks.find(t => t.id === task.id);
                  if (taskData && taskData.name) {
                    const match = taskData.name.match(/^(.+?)\s+(.+?)(\s+★)?$/);
                    if (match) {
                      details = {
                        techName: match[1],
                        version: match[2],
                        isCurrentVersion: !!match[3],
                        releaseDate: task.start.toLocaleDateString('ja-JP'),
                        eolDate: task.end.toLocaleDateString('ja-JP'),
                      };
                    }
                  }
                } catch {
                  details = null;
                }
                
                if (!details) return null;
                
                return (
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    fontSize: '14px',
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {details.techName} {details.version}
                      {details.isCurrentVersion && <span style={{ color: '#f59e0b', marginLeft: '4px' }}>★ 現在使用中</span>}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>
                      リリース: {details.releaseDate}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>
                      EOL: {details.eolDate}
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </div>
      ))}

      <style jsx>{`
        .eol-gantt-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .eol-gantt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 1rem;
        }

        .eol-gantt-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
        }

        .legend {
          display: flex;
          gap: 1rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }

        .legend-color.current {
          background-color: #22c55e;
        }

        .legend-color.active {
          background-color: #3b82f6;
        }

        .legend-color.maintenance {
          background-color: #94a3b8;
        }

        .legend-color.eol {
          background-color: #ef4444;
        }

        .service-gantt-section {
          margin-bottom: 2rem;
        }

        .service-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
          padding: 0.5rem 1rem;
          background-color: #f3f4f6;
          border-left: 4px solid #3b82f6;
        }

        .eol-gantt-wrapper {
          flex: 1;
          overflow: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          position: relative;
        }

        /* 現在日付の縦線を強調 */
        .eol-gantt-wrapper :global(.today-highlight) {
          background-color: rgba(239, 68, 68, 0.15) !important;
          border-left: 2px solid #ef4444 !important;
        }

        .eol-gantt-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          background-color: #f9fafb;
        }

        .empty-message {
          text-align: center;
          max-width: 400px;
          padding: 2rem;
        }

        .empty-message h3 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
        }

        .empty-message p {
          margin: 0;
          color: #6b7280;
          line-height: 1.5;
        }

        /* レスポンシブデザイン */
        @media (max-width: 1024px) {
          .eol-gantt-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .legend {
            align-self: stretch;
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .eol-gantt-header h2 {
            font-size: 1.25rem;
          }

          .legend {
            flex-wrap: wrap;
          }
        }

        @media (max-width: 640px) {
          .legend {
            flex-direction: column;
            gap: 0.5rem;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
