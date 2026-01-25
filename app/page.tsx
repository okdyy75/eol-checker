'use client';

import { useState, useEffect, useCallback } from 'react';
import { Service, EOLDataMap } from '@/lib/types';
import ServiceForm from '@/components/ServiceForm';
import EOLGanttChart from '@/components/EOLGanttChart';
import ErrorBoundary from '@/components/ErrorBoundary';
import { loadEOLData } from '@/lib/eol-data';
import { 
  getURLStateFromCurrentURL, 
  setURLState, 
  clearURLState, 
  createEmptyURLState,
  isEmptyURLState 
} from '@/lib/url-state';
import { 
  loadDataWithPriority, 
  saveDataWithNotification, 
  clearLocalStorage 
} from '@/lib/storage';

/**
 * メインページコンポーネント
 * 
 * 実装する要件:
 * - 1.4: すべての入力データをURL_Stateとして保存する
 * - 4.2: ユーザーがデータを入力または変更した場合、URLを自動的に更新する
 * - 6.1: 入力されたデータをブラウザのローカルストレージに保存する
 * - 6.2: ユーザーがアプリケーションを再度開いた場合、ローカルストレージからデータを読み込む
 * - 6.3: URL_Stateが存在する場合、URL_Stateをローカルストレージよりも優先する
 * - 6.4: ユーザーがデータをクリアできる機能を提供する
 */
export default function Home() {
  // 状態管理
  const [services, setServices] = useState<Service[]>([]);
  const [eolData, setEolData] = useState<EOLDataMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // 通知を表示するヘルパー関数
  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // 初期化処理
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. EOLデータを読み込み
        const loadedEOLData = await loadEOLData();
        setEolData(loadedEOLData);

        // 2. URL状態を確認
        const urlStateResult = getURLStateFromCurrentURL();
        let initialServices: Service[] = [];

        if (urlStateResult.success && urlStateResult.data) {
          // URL状態が存在する場合はそれを使用（要件 6.3）
          initialServices = urlStateResult.data.services;
        } else {
          // URL状態がない場合はローカルストレージから読み込み（要件 6.2）
          initialServices = loadDataWithPriority();
        }

        setServices(initialServices);

      } catch (err) {
        console.error('アプリケーションの初期化に失敗しました:', err);
        setError('アプリケーションの初期化に失敗しました。ページを再読み込みしてください。');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // サービス変更時の処理
  const handleServicesChange = useCallback((newServices: Service[]) => {
    setServices(newServices);

    // URL状態を更新（要件 1.4, 4.2）
    if (newServices.length > 0) {
      const urlState = {
        version: 1,
        services: newServices
      };
      
      const urlResult = setURLState(urlState);
      if (!urlResult.success) {
        console.warn('URL状態の更新に失敗しました:', urlResult.error);
        if (urlResult.error?.type === 'URL_TOO_LONG') {
          showNotification('データが大きすぎてURLに保存できません。ローカルストレージのみに保存されます。');
        }
      }
    } else {
      // サービスが空の場合はURL状態をクリア
      clearURLState();
    }

    // ローカルストレージに保存（要件 6.1）
    const storageResult = saveDataWithNotification(newServices);
    if (!storageResult.success && storageResult.message) {
      showNotification(storageResult.message);
    }
  }, [showNotification]);

  // データクリア機能（要件 6.4）
  const handleClearData = useCallback(() => {
    if (window.confirm('すべてのデータをクリアしますか？この操作は元に戻せません。')) {
      // 状態をクリア
      setServices([]);
      
      // URL状態をクリア
      clearURLState();
      
      // ローカルストレージをクリア
      const clearResult = clearLocalStorage();
      if (clearResult.success) {
        showNotification('すべてのデータがクリアされました。');
      } else {
        showNotification('データのクリアに失敗しました。');
      }
    }
  }, [showNotification]);

  // ローディング状態
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">アプリケーションを初期化しています...</p>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
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
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">EOL Timeline Viewer</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  技術スタックのEnd of Life情報を視覚的に確認
                </p>
              </div>
              
              {/* データクリアボタン */}
              {services.length > 0 && (
                <button
                  onClick={handleClearData}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium w-full sm:w-auto"
                  title="すべてのデータをクリア"
                >
                  データクリア
                </button>
              )}
            </div>
          </div>
        </header>

        {/* 通知 */}
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

        {/* メインコンテンツ */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* サービスフォーム */}
            <div className="order-2 xl:order-1">
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                <ServiceForm 
                  services={services} 
                  onServicesChange={handleServicesChange} 
                />
              </div>
            </div>

            {/* ガントチャート */}
            <div className="order-1 xl:order-2">
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                <EOLGanttChart 
                  services={services} 
                  eolData={eolData} 
                />
              </div>
            </div>
          </div>

          {/* フッター情報 */}
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