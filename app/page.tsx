'use client';

import { useState, useCallback } from 'react';
import ServiceForm from '@/components/ServiceForm';
import EOLGanttChart from '@/components/EOLGanttChart';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useEOLData } from '@/lib/hooks/use-eol-data';
import { useURLState } from '@/lib/hooks/use-url-state';

export default function Home() {
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">EOL Timeline Viewer</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  技術スタックのEnd of Life情報を視覚的に確認
                </p>
              </div>
              
              {services.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopyURL}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    URLコピー
                  </button>
                  
                  <button
                    onClick={handleClearData}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    データクリア
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {notification && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">{notification}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
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
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
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
