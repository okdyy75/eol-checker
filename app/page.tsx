'use client';

import { useState, useCallback, Suspense } from 'react';
import ServiceForm from '@/components/ServiceForm';
import EOLGanttChart from '@/components/EOLGanttChart';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useEOLData } from '@/lib/hooks/use-eol-data';
import { useURLState } from '@/lib/hooks/use-url-state';

function HomeContent() {
  const { eolData, availableTechnologies, isLoading, error: eolError } = useEOLData();
  const { services, setServices, clearServices, getShareableURL, isURLLoaded, urlError } = useURLState();
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const handleServicesChange = useCallback((newServices: typeof services) => {
    setServices(newServices);
  }, [setServices]);

  const handleClearData = useCallback(() => {
    if (window.confirm('すべてのデータをクリアしますか？この操作は元に戻せません。')) {
      clearServices();
      showNotification('すべてのデータがクリアされました。');
    }
  }, [clearServices, showNotification]);

  const handleCopyURL = useCallback(() => {
    try {
      const shareUrl = getShareableURL();
      navigator.clipboard.writeText(shareUrl)
        .then(() => showNotification('URLをクリップボードにコピーしました。'))
        .catch(() => showNotification('URLのコピーに失敗しました。'));
    } catch {
      showNotification('URLの生成に失敗しました。');
    }
  }, [getShareableURL, showNotification]);

  if (isLoading || !isURLLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">アプリケーションを初期化しています...</p>
        </div>
      </div>
    );
  }

  if (eolError || urlError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{eolError || urlError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
              <div className="text-center sm:text-left">
                <a href="/" className="inline-block hover:opacity-80 transition-opacity">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">EOL Timeline Viewer</h1>
                </a>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  技術スタックのEnd of Life情報を視覚的に確認
                </p>
              </div>

              {services.length > 0 && (
                <div className="flex flex-row gap-2">
                  <button
                    onClick={handleCopyURL}
                    className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline">URLコピー</span>
                    <span className="sm:hidden">コピー</span>
                  </button>

                  <button
                    onClick={handleClearData}
                    className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">データクリア</span>
                    <span className="sm:hidden">クリア</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {notification && (
          <div
            className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 cursor-pointer"
            onClick={() => setNotification(null)}
          >
            <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 pr-3 animate-fade-in max-w-md w-full relative group hover:bg-blue-700 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium flex-1">{notification}</p>
                <button
                  onClick={() => setNotification(null)}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-500 text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                  title="閉じる"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-6 py-3 sm:py-6">
          <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
            <div>
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">サービスと技術スタック</h2>
                <ServiceForm
                  services={services}
                  onServicesChange={handleServicesChange}
                  availableTechnologies={availableTechnologies}
                  eolData={eolData}
                />
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-6">
                <EOLGanttChart
                  services={services}
                  eolData={eolData}
                />
              </div>
            </div>
          </div>

          <footer className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
            <div className="text-center text-xs sm:text-sm text-gray-500">
              <p>
                EOL情報は{' '}
                <a
                  href="https://endoflife.date"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  endoflife.date
                </a>
                {' '}から取得されています
              </p>
              <p className="mt-2">
                データは定期的に更新されますが、最新情報については公式ドキュメントをご確認ください
              </p>
            </div>
          </footer>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">アプリケーションを初期化しています...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
