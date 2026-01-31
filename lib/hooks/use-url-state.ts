'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Service } from '@/lib/types';
import { 
  decodeURLState,
  setURLState as setURLStateToHistory, 
  clearURLState as clearURLStateFromHistory,
  encodeURLState 
} from '@/lib/url-state';

interface UseURLStateReturn {
  services: Service[];
  setServices: (services: Service[]) => void;
  clearServices: () => void;
  getShareableURL: () => string;
  isURLLoaded: boolean;
  urlError: string | null;
}

/**
 * URL状態管理用カスタムフック
 * サービスデータをURLパラメータとして保存・復元
 */
export function useURLState(): UseURLStateReturn {
  const searchParams = useSearchParams();
  const [services, setServicesState] = useState<Service[]>([]);
  const [isURLLoaded, setIsURLLoaded] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  // 初期化時にURLから状態を読み込み
  useEffect(() => {
    // すでに初期化済みの場合はスキップ
    if (isInitialized.current) return;
    
    try {
      const dataParam = searchParams.get('s');
      console.log('[useURLState] URL param s:', dataParam);
      
      if (dataParam) {
        const decoded = decodeURLState(dataParam);
        console.log('[useURLState] Decoded services:', decoded.services);
        setServicesState(decoded.services);
      }
      
      isInitialized.current = true;
    } catch (error) {
      console.error('[useURLState] Error decoding URL:', error);
      setUrlError(error instanceof Error ? error.message : 'URLのデコードに失敗しました');
    } finally {
      setIsURLLoaded(true);
    }
  }, [searchParams]);

  // サービス変更時にURLを更新
  const setServices = useCallback((newServices: Service[]) => {
    setServicesState(newServices);

    if (newServices.length > 0) {
      const result = setURLStateToHistory({ version: 1, services: newServices });
      if (!result.success && result.error?.type === 'URL_TOO_LONG') {
        setUrlError('データが大きすぎてURLに保存できません');
      }
    } else {
      clearURLStateFromHistory();
    }
  }, []);

  // サービスをクリア
  const clearServices = useCallback(() => {
    setServicesState([]);
    clearURLStateFromHistory();
  }, []);

  // 共有用URLを生成
  const getShareableURL = useCallback(() => {
    if (services.length === 0) return window.location.href.split('?')[0];
    
    const encoded = encodeURLState({ version: 1, services });
    const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    return encoded ? `${baseUrl}?s=${encoded}` : baseUrl;
  }, [services]);

  return {
    services,
    setServices,
    clearServices,
    getShareableURL,
    isURLLoaded,
    urlError,
  };
}
