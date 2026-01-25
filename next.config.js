/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静的エクスポート設定（要件 7.1）
  output: 'export',
  
  // 画像最適化設定（要件 7.3）
  images: {
    unoptimized: true,
  },
  
  // 静的ホスティング対応
  trailingSlash: true,
  
  // ESLint設定
  eslint: {
    dirs: ['app', 'lib', 'components', 'scripts'],
  },
  
  // TypeScript設定
  typescript: {
    // 型チェックエラーでもビルドを続行（本番では false にすることを推奨）
    ignoreBuildErrors: false,
  },
  
  // 実験的機能
  experimental: {
    // App Routerの最適化
    optimizePackageImports: ['@svar-ui/react-gantt'],
  },
  
  // 静的ファイル配信設定
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // ビルド時の設定
  generateBuildId: async () => {
    // カスタムビルドIDを生成（デプロイ時のキャッシュ管理用）
    return `eol-timeline-viewer-${new Date().toISOString().slice(0, 10)}`;
  },
};

module.exports = nextConfig;