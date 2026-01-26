import React from 'react';

interface GradientBarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  stage: 'current' | 'active' | 'maintenance' | 'eol';
  isCurrentVersion: boolean;
}

/**
 * グラデーションバーコンポーネント
 * ライフサイクルステージに応じたグラデーションを表示
 */
export const GradientBar: React.FC<GradientBarProps> = ({
  x,
  y,
  width,
  height,
  stage,
  isCurrentVersion,
}) => {
  const gradientId = `gradient-${stage}-${x}-${y}`;
  
  // ステージに応じたグラデーション定義
  const getGradientStops = () => {
    switch (stage) {
      case 'current':
        // 緑(0-75%) → 青(75-90%) → グレー(90-100%)
        return (
          <>
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="75%" stopColor="#22c55e" />
            <stop offset="75%" stopColor="#3b82f6" />
            <stop offset="90%" stopColor="#3b82f6" />
            <stop offset="90%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#94a3b8" />
          </>
        );
      case 'active':
        // 青(0-80%) → グレー(80-100%)
        return (
          <>
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="80%" stopColor="#3b82f6" />
            <stop offset="80%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#94a3b8" />
          </>
        );
      case 'maintenance':
        // グレー(100%)
        return <stop offset="0%" stopColor="#94a3b8" />;
      case 'eol':
        // 赤(100%)
        return <stop offset="0%" stopColor="#ef4444" />;
      default:
        return <stop offset="0%" stopColor="#3b82f6" />;
    }
  };

  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          {getGradientStops()}
        </linearGradient>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`url(#${gradientId})`}
        rx={3}
        ry={3}
        stroke={isCurrentVersion ? '#f59e0b' : 'none'}
        strokeWidth={isCurrentVersion ? 3 : 0}
        style={{
          filter: isCurrentVersion ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))' : 'none',
        }}
      />
    </g>
  );
};
