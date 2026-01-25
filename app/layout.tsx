import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EOL Timeline Viewer',
  description: 'End of Life情報を視覚的に確認できる静的Webサイト。開発中のサービスで使用している言語やフレームワークのEOL情報をガントチャート形式で表示し、URLを共有することで誰でも確認できます。',
  keywords: ['EOL', 'End of Life', 'Timeline', 'Gantt Chart', 'Technology', 'Framework', 'Language'],
  authors: [{ name: 'EOL Timeline Viewer' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'EOL Timeline Viewer',
    description: 'End of Life情報を視覚的に確認できる静的Webサイト',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EOL Timeline Viewer',
    description: 'End of Life情報を視覚的に確認できる静的Webサイト',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}