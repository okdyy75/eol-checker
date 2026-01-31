'use client';

import { useState, useEffect, useCallback } from 'react';
import { EOLDataMap } from '@/lib/types';
import { loadEOLData, getAvailableTechnologies } from '@/lib/eol-data';

interface UseEOLDataReturn {
  eolData: EOLDataMap;
  availableTechnologies: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * EOLデータを読み込むカスタムフック
 * キャッシング機能付きで、複数コンポーネント間でデータを共有
 */
export function useEOLData(): UseEOLDataReturn {
  const [eolData, setEolData] = useState<EOLDataMap>({});
  const [availableTechnologies, setAvailableTechnologies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await loadEOLData();
      setEolData(data);
      setAvailableTechnologies(getAvailableTechnologies(data));
    } catch (err) {
      console.error('Failed to load EOL data:', err);
      setError('EOLデータの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    eolData,
    availableTechnologies,
    isLoading,
    error,
    refetch,
  };
}
