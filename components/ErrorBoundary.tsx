'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

/**
 * ErrorBoundary - React Error Boundary Component
 * 
 * アプリケーション内で発生した予期しないエラーをキャッチし、
 * ユーザーフレンドリーなエラーメッセージを表示します。
 * 
 * 要件:
 * - 8.3: ネットワークエラーやデータ読み込みエラーが発生した場合、
 *        ユーザーフレンドリーなエラーメッセージを表示する
 * - 8.4: エラー発生時もアプリケーションがクラッシュせず、
 *        部分的に機能し続けるようにする
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // エラーIDを生成（デバッグ用）
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 詳細なエラーログを記録
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // コンソールに詳細ログを出力
    console.group('🚨 Error Boundary - エラーが発生しました');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error Details:', errorDetails);
    console.groupEnd();

    // 本番環境では外部ログサービスに送信することも可能
    // 例: Sentry, LogRocket, Bugsnag など
    if (process.env.NODE_ENV === 'production') {
      // 将来的にエラー報告サービスと統合可能
      // reportErrorToService(errorDetails);
    }

    this.setState({ errorInfo });
  }

  /**
   * エラー状態をリセットして部分的な機能継続を可能にする
   */
  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  /**
   * エラーの種類を判定してユーザーフレンドリーなメッセージを生成
   */
  getErrorMessage(error: Error): { title: string; message: string; suggestion: string } {
    const errorMessage = error.message.toLowerCase();
    
    // ネットワークエラーの検出
    if (errorMessage.includes('network') || 
        errorMessage.includes('fetch') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout')) {
      return {
        title: 'ネットワークエラー',
        message: 'インターネット接続に問題があるか、サーバーに接続できません。',
        suggestion: 'インターネット接続を確認して、もう一度お試しください。'
      };
    }

    // データ読み込みエラーの検出
    if (errorMessage.includes('json') || 
        errorMessage.includes('parse') || 
        errorMessage.includes('data') ||
        errorMessage.includes('load')) {
      return {
        title: 'データ読み込みエラー',
        message: 'データの読み込み中にエラーが発生しました。',
        suggestion: 'ページを再読み込みするか、しばらく時間をおいてからお試しください。'
      };
    }

    // その他のエラー
    return {
      title: 'アプリケーションエラー',
      message: 'アプリケーションで予期しないエラーが発生しました。',
      suggestion: 'ページを再読み込みしてください。問題が続く場合は、ブラウザのキャッシュをクリアしてお試しください。'
    };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // カスタムフォールバックコンポーネントが提供されている場合
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} reset={this.resetError} />;
      }

      // デフォルトのエラーUI
      const { title, message, suggestion } = this.getErrorMessage(this.state.error);

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-lg shadow-lg p-6">
            {/* エラーアイコン */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg 
                className="w-6 h-6 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>

            {/* エラータイトル */}
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              {title}
            </h2>

            {/* エラーメッセージ */}
            <p className="text-gray-600 text-center mb-4">
              {message}
            </p>

            {/* 提案 */}
            <p className="text-sm text-gray-500 text-center mb-6">
              {suggestion}
            </p>

            {/* アクションボタン */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.resetError}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                再試行
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                ページを再読み込み
              </button>
            </div>

            {/* エラー詳細（開発環境またはデバッグ用） */}
            {(process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.search.includes('debug=true'))) && (
              <details className="mt-6 text-sm">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  エラー詳細 (開発者向け)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded border text-xs">
                  <div className="mb-2">
                    <strong>エラーID:</strong> {this.state.errorId}
                  </div>
                  <div className="mb-2">
                    <strong>メッセージ:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div className="mb-2">
                      <strong>スタックトレース:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs overflow-x-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>コンポーネントスタック:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* フィードバックリンク（オプション） */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                問題が続く場合は、
                <button 
                  onClick={() => {
                    const subject = encodeURIComponent(`エラー報告 - ${this.state.errorId}`);
                    const body = encodeURIComponent(`エラーID: ${this.state.errorId}\nエラーメッセージ: ${this.state.error?.message}\nURL: ${window.location.href}\n\n詳細な状況:`);
                    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
                  }}
                  className="text-blue-500 hover:text-blue-700 underline"
                >
                  お問い合わせ
                </button>
                ください。
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}