import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'EOL Timeline Viewer',
  description: 'End of Life情報を視覚的に確認できる静的Webサイト。開発中のサービスで使用している言語やフレームワークのEOL情報をガントチャート形式で表示し、URLを共有することで誰でも確認できます。',
  keywords: ['EOL', 'End of Life', 'Timeline', 'Gantt Chart', 'Technology', 'Framework', 'Language'],
  authors: [{ name: 'EOL Timeline Viewer' }],
  robots: 'index, follow',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'EOL Timeline Viewer',
    description: 'End of Life情報を視覚的に確認できる静的Webサイト',
    type: 'website',
    locale: 'ja_JP',
    siteName: 'EOL Timeline Viewer',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EOL Timeline Viewer',
    description: 'End of Life情報を視覚的に確認できる静的Webサイト',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="ja">
      <body>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}