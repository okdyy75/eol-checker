'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Gantt, Tooltip, ITask } from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';
import { Service, EOLDataMap } from '../lib/types';
import { convertToGanttData } from '../lib/gantt-adapter';

/**
 * EOLGanttChartコンポーネントのProps
 */
interface EOLGanttChartProps {
  services: Service[];
  eolData: EOLDataMap;
}

/**
 * カスタムツールチップコンポーネント
 * バージョン番号、リリース日、EOL日を表示
 * 要件 3.7 を満たす実装
 */
function CustomTooltipContent({ data }: { data: ITask }) {
  // dataがnullまたは詳細情報がない場合は何も表示しない
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
  const [api, setApi] = useState<any>(null);

  // ガントチャートデータを生成
  const ganttData = useMemo(() => {
    return convertToGanttData(services, eolData);
  }, [services, eolData]);

  // 現在日付の垂直線を表示するための設定
  // 要件 3.5 を満たす実装
  // 注意: @svar-ui/react-ganttのマーカー機能はPRO版でのみ利用可能なため、
  // CSSとJavaScriptを使用して現在日付線を実装
  useEffect(() => {
    if (api && ganttData.tasks.length > 0) {
      // ガントチャートが初期化された後に現在日付線を描画
      const drawTodayLine = () => {
        const ganttElement = document.querySelector('.wx-gantt-timeline');
        if (!ganttElement) return;

        // 既存の今日線を削除
        const existingLine = ganttElement.querySelector('.today-line');
        if (existingLine) {
          existingLine.remove();
        }

        try {
          // 現在日付の位置を計算
          const today = new Date();
          
          // タスクの日付範囲を取得
          const allTasks = ganttData.tasks.filter(task => task.type === 'task');
          if (allTasks.length === 0) return;

          const minDate = new Date(Math.min(...allTasks.map(task => task.start ? task.start.getTime() : Date.now())));
          const maxDate = new Date(Math.max(...allTasks.map(task => task.end ? task.end.getTime() : Date.now())));
          
          // 今日がタスクの日付範囲内にある場合のみ線を描画
          if (today >= minDate && today <= maxDate) {
            const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
            const todayDays = (today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
            
            const timelineRect = ganttElement.getBoundingClientRect();
            const leftPosition = (todayDays / totalDays) * timelineRect.width;

            // 今日線要素を作成
            const todayLine = document.createElement('div');
            todayLine.className = 'today-line';
            todayLine.style.cssText = `
              position: absolute;
              top: 0;
              left: ${leftPosition}px;
              width: 2px;
              height: 100%;
              background-color: #ef4444;
              z-index: 10;
              pointer-events: none;
            `;

            // ラベルを追加
            const todayLabel = document.createElement('div');
            todayLabel.className = 'today-label';
            todayLabel.textContent = '今日';
            todayLabel.style.cssText = `
              position: absolute;
              top: -25px;
              left: -15px;
              background: #ef4444;
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              white-space: nowrap;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            `;

            todayLine.appendChild(todayLabel);
            ganttElement.appendChild(todayLine);
          }
        } catch (error) {
          console.warn('今日線の描画に失敗しました:', error);
        }
      };

      // 初期描画（少し遅延させてガントチャートの描画完了を待つ）
      const initialTimer = setTimeout(drawTodayLine, 200);

      // スケール変更時に再描画
      const handleScaleChange = () => {
        setTimeout(drawTodayLine, 100);
      };

      // イベントリスナーを追加
      if (api.on) {
        api.on('zoom-scale', handleScaleChange);
        api.on('scroll-timeline', handleScaleChange);
      }

      return () => {
        clearTimeout(initialTimer);
        if (api.off) {
          api.off('zoom-scale', handleScaleChange);
          api.off('scroll-timeline', handleScaleChange);
        }
      };
    }
  }, [api, ganttData.tasks]);

  // データが空の場合の表示
  if (!services.length) {
    return (
      <div className="eol-gantt-empty">
        <div className="empty-message">
          <h3>ガントチャートを表示するには、サービスと技術を追加してください</h3>
          <p>左側のフォームからサービスを追加し、使用している技術とバージョンを入力してください。</p>
        </div>
      </div>
    );
  }

  // タスクが存在しない場合（EOLデータが見つからない場合など）
  if (!ganttData.tasks.length) {
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
            <div className="legend-color active"></div>
            <span>サポート中</span>
          </div>
          <div className="legend-item">
            <div className="legend-color eol"></div>
            <span>サポート終了</span>
          </div>
        </div>
      </div>

      {/* ガントチャート */}
      {/* 要件 5.2: レスポンシブデザイン（水平スクロール対応） */}
      <div className="eol-gantt-wrapper">
        <Tooltip api={api} content={CustomTooltipContent}>
          <Gantt
            tasks={ganttData.tasks}
            scales={ganttData.scales}
            init={setApi}
            zoom={true}
            readonly={true}
          />
        </Tooltip>
      </div>

      <style jsx>{`
        .eol-gantt-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
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

        .legend-color.active {
          background-color: #3b82f6;
        }

        .legend-color.eol {
          background-color: #ef4444;
        }

        .eol-gantt-wrapper {
          flex: 1;
          min-height: 400px;
          overflow: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          position: relative;
        }

        /* ガントチャート本体のスタイリング */
        :global(.eol-gantt) {
          width: 100% !important;
          height: 100% !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        /* グリッド部分のスタイリング */
        :global(.wx-gantt .wx-gantt-grid) {
          border-right: 1px solid #e5e7eb !important;
          background-color: #f9fafb !important;
        }

        /* タイムライン部分のスタイリング */
        :global(.wx-gantt .wx-gantt-timeline) {
          background-color: white !important;
          position: relative !important;
        }

        /* スケールヘッダーのスタイリング */
        :global(.wx-gantt .wx-gantt-scale) {
          background-color: #f3f4f6 !important;
          border-bottom: 1px solid #e5e7eb !important;
          font-weight: 600 !important;
          color: #374151 !important;
        }

        /* タスク行のスタイリング */
        :global(.wx-gantt .wx-gantt-row) {
          border-bottom: 1px solid #f3f4f6 !important;
        }

        :global(.wx-gantt .wx-gantt-row:hover) {
          background-color: #f9fafb !important;
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

        /* ツールチップのスタイル */
        :global(.eol-tooltip) {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          font-size: 14px;
          min-width: 200px;
        }

        :global(.tooltip-row) {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        :global(.tooltip-row:last-child) {
          margin-bottom: 0;
        }

        :global(.tooltip-label) {
          font-weight: 600;
          color: #374151;
          margin-right: 8px;
        }

        :global(.tooltip-value) {
          color: #6b7280;
        }

        :global(.eol-warning .tooltip-value) {
          color: #ef4444;
          font-weight: 600;
        }

        /* 現在日付線のスタイル（要件 3.5） */
        :global(.today-line) {
          position: absolute !important;
          background-color: #ef4444 !important;
          width: 2px !important;
          z-index: 10 !important;
          pointer-events: none !important;
        }

        :global(.today-label) {
          position: absolute !important;
          background: #ef4444 !important;
          color: white !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          white-space: nowrap !important;
        }

        /* EOL済みタスクのスタイル（要件 3.6） */
        /* カスタムCSSクラスを使用したスタイリング */
        :global(.wx-gantt .eol-task),
        :global(.wx-gantt .wx-gantt-task.eol-task),
        :global(.wx-gantt .wx-gantt-task-bar.eol-task) {
          background-color: #ef4444 !important;
          border-color: #dc2626 !important;
        }

        :global(.wx-gantt .active-task),
        :global(.wx-gantt .wx-gantt-task.active-task),
        :global(.wx-gantt .wx-gantt-task-bar.active-task) {
          background-color: #3b82f6 !important;
          border-color: #2563eb !important;
        }

        /* progressベースのフォールバックスタイリング */
        :global(.wx-gantt .wx-gantt-task-bar[data-progress="100"]),
        :global(.wx-gantt .wx-gantt-task[data-progress="100"]) {
          background-color: #ef4444 !important;
          border-color: #dc2626 !important;
        }

        :global(.wx-gantt .wx-gantt-task-bar[data-progress="0"]),
        :global(.wx-gantt .wx-gantt-task[data-progress="0"]) {
          background-color: #3b82f6 !important;
          border-color: #2563eb !important;
        }

        /* タスクバーのホバー効果 */
        :global(.wx-gantt .wx-gantt-task-bar:hover) {
          opacity: 0.8 !important;
          transform: scaleY(1.1) !important;
          transition: all 0.2s ease !important;
        }

        /* サマリータスクのスタイル */
        :global(.wx-gantt .wx-gantt-summary),
        :global(.wx-gantt .wx-gantt-task[data-type="summary"]) {
          background-color: #6b7280 !important;
          border-color: #4b5563 !important;
          height: 8px !important;
        }

        /* レスポンシブデザイン（要件 5.2） */
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

          .eol-gantt-wrapper {
            min-height: 350px;
          }
        }

        @media (max-width: 768px) {
          .eol-gantt-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .eol-gantt-header h2 {
            font-size: 1.25rem;
          }

          .legend {
            align-self: stretch;
            justify-content: center;
            flex-wrap: wrap;
          }

          .eol-gantt-wrapper {
            min-height: 300px;
          }

          .empty-message {
            padding: 1rem;
          }

          .empty-message h3 {
            font-size: 1.125rem;
          }

          /* ガントチャートのフォントサイズ調整 */
          :global(.wx-gantt) {
            font-size: 14px !important;
          }

          :global(.wx-gantt .wx-gantt-scale) {
            font-size: 12px !important;
          }

          :global(.wx-gantt .wx-gantt-grid) {
            min-width: 150px !important;
          }
        }

        @media (max-width: 640px) {
          .eol-gantt-header h2 {
            font-size: 1.125rem;
          }

          .legend {
            flex-direction: column;
            gap: 0.5rem;
            align-items: center;
          }

          .eol-gantt-wrapper {
            min-height: 250px;
          }

          .empty-message {
            padding: 0.75rem;
          }

          .empty-message h3 {
            font-size: 1rem;
          }

          .empty-message p {
            font-size: 0.875rem;
          }

          /* モバイル向けガントチャート調整 */
          :global(.wx-gantt) {
            font-size: 12px !important;
          }

          :global(.wx-gantt .wx-gantt-scale) {
            font-size: 11px !important;
          }

          :global(.wx-gantt .wx-gantt-grid) {
            min-width: 120px !important;
          }

          /* ツールチップのモバイル対応 */
          :global(.eol-tooltip) {
            font-size: 12px !important;
            min-width: 180px !important;
            max-width: 250px !important;
          }
        }

        /* タッチデバイス対応（要件 5.3） */
        @media (hover: none) and (pointer: coarse) {
          :global(.wx-gantt .wx-gantt-task-bar) {
            min-height: 20px !important;
          }

          :global(.eol-tooltip) {
            padding: 16px !important;
            font-size: 14px !important;
          }

          .eol-gantt-wrapper {
            overflow-x: auto !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
        }
      `}</style>
    </div>
  );
}