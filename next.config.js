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
  
  // ベースパス設定（要件 2.1, 2.5, 5.2）
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // アセットプレフィックス設定（要件 4.4）
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // ESLint設定
  eslint: {
    dirs: ['app', 'lib', 'components', 'scripts'],
  },
  
  // TypeScript設定
  typescript: {
    // 型チェックエラーでもビルドを続行（本番では false にすることを推奨）
    ignoreBuildErrors: false,
  },
  
  // ビルド時の設定
  generateBuildId: async () => {
    // カスタムビルドIDを生成（デプロイ時のキャッシュ管理用）
    return `eol-timeline-viewer-${new Date().toISOString().slice(0, 10)}`;
  },
};

module.exports = nextConfig;