'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Service, Technology } from '@/lib/types';
import { loadEOLData, getAvailableTechnologies } from '@/lib/eol-data';
import TechnologyInput from './TechnologyInput';

interface ServiceFormProps {
  services: Service[];
  onServicesChange: (services: Service[]) => void;
}

export default function ServiceForm({ services, onServicesChange }: ServiceFormProps) {
  const [availableTechnologies, setAvailableTechnologies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // 現在編集中のサービスのインデックス
  const [editingIndex, setEditingIndex] = useState<number>(0);

  // EOLデータの読み込み
  useEffect(() => {
    const loadTechnologies = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const eolData = await loadEOLData();
        const technologies = getAvailableTechnologies(eolData);
        setAvailableTechnologies(technologies);
      } catch (error) {
        console.error('Failed to load EOL data:', error);
        setLoadError('技術データの読み込みに失敗しました。ページを再読み込みしてください。');
        setAvailableTechnologies([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTechnologies();
  }, []);



  // 現在編集中のサービスを取得
  const editingService = services[editingIndex] || services[0];

  // サービスを更新（リアルタイム保存）
  const updateService = useCallback((index: number, updates: Partial<Service>) => {
    const updatedServices = services.map((service, i) =>
      i === index ? { ...service, ...updates } : service
    );
    onServicesChange(updatedServices);
  }, [services, onServicesChange]);

  // サービス名を更新
  const updateServiceName = (name: string) => {
    updateService(editingIndex, { name });
  };

  // 技術を追加
  const addTechnology = () => {
    const newTechnology: Technology = {
      id: `tech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      currentVersion: ''
    };
    
    const currentService = services[editingIndex];
    if (currentService) {
      updateService(editingIndex, {
        technologies: [...currentService.technologies, newTechnology]
      });
    }
  };

  // 技術を削除
  const removeTechnology = (technologyId: string) => {
    const currentService = services[editingIndex];
    if (currentService) {
      updateService(editingIndex, {
        technologies: currentService.technologies.filter(tech => tech.id !== technologyId)
      });
    }
  };

  // 技術を更新
  const updateTechnology = (technologyId: string, updatedTechnology: Technology) => {
    const currentService = services[editingIndex];
    if (currentService) {
      updateService(editingIndex, {
        technologies: currentService.technologies.map(tech =>
          tech.id === technologyId ? updatedTechnology : tech
        )
      });
    }
  };

  // 新規サービスを追加
  const addNewService = () => {
    const serviceNumber = services.length + 1;
    const newService: Service = {
      id: `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `service${serviceNumber}`,
      technologies: [
        {
          id: `tech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: '',
          currentVersion: ''
        }
      ]
    };
    onServicesChange([...services, newService]);
    setEditingIndex(services.length); // 新規追加したサービスを編集対象に
  };

  // サービスを削除
  const removeService = (index: number) => {
    const updatedServices = services.filter((_, i) => i !== index);
    onServicesChange(updatedServices);
    
    // 削除したサービスが編集中だった場合は、適切なインデックスに調整
    if (index === editingIndex) {
      setEditingIndex(Math.min(index, updatedServices.length - 1));
    } else if (index < editingIndex) {
      setEditingIndex(editingIndex - 1);
    }
  };

  // サービスを選択して編集
  const selectService = (index: number) => {
    setEditingIndex(index);
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">技術データを読み込み中...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-red-500">⚠</span>
          <span className="text-red-700">{loadError}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 左側：入力フォーム */}
      <div className="space-y-4">
        {services.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">まだサービスがありません</p>
            <p className="text-gray-400 text-sm mb-4">
              右の「サービスを追加」ボタンから新しいサービスを作成してください
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                サービスを編集
              </h3>
              <span className="text-sm text-gray-500">
                {editingIndex + 1} / {services.length}
              </span>
            </div>
            
            {/* サービス名入力 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                サービス名
              </label>
              <input
                type="text"
                placeholder="サービス名を入力（例: マイクロサービスA、Webアプリ）"
                value={editingService?.name || ''}
                onChange={(e) => updateServiceName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>

            {/* 技術スタック */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用技術
              </label>
              
              {(!editingService?.technologies || editingService.technologies.length === 0) ? (
                <div className="text-center py-4 bg-gray-50 rounded-md border-2 border-dashed border-gray-300 mb-3">
                  <p className="text-gray-500 text-sm">技術が追加されていません</p>
                </div>
              ) : (
                <div className="space-y-3 mb-3">
                  {editingService.technologies.map((technology) => (
                    <TechnologyInput
                      key={technology.id}
                      technology={technology}
                      availableTechnologies={availableTechnologies}
                      onChange={(updatedTechnology) => updateTechnology(technology.id, updatedTechnology)}
                      onRemove={() => removeTechnology(technology.id)}
                    />
                  ))}
                </div>
              )}
              
              {/* 技術を追加ボタン */}
              <button
                onClick={addTechnology}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors text-sm"
              >
                + 技術を追加
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 右側：サービスリスト */}
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            サービス一覧 ({services.length})
          </h3>
          
          {services.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-sm">まだサービスがありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {services.map((service, index) => (
                <div
                  key={service.id}
                  onClick={() => selectService(index)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    editingIndex === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {service.name || '(名前なし)'}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        技術: {service.technologies.length}件
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeService(index);
                      }}
                      className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors flex-shrink-0"
                      title="このサービスを削除"
                    >
                      削除
                    </button>
                  </div>
                  
                  {/* 技術一覧のプレビュー */}
                  {service.technologies.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex flex-wrap gap-1">
                        {service.technologies.slice(0, 3).map((tech) => (
                          <span
                            key={tech.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                          >
                            {tech.name || '?'}
                            {tech.currentVersion && ` ${tech.currentVersion}`}
                          </span>
                        ))}
                        {service.technologies.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                            +{service.technologies.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* サービスを追加ボタン */}
          <button
            onClick={addNewService}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
          >
            + サービスを追加
          </button>
        </div>
      </div>
    </div>
  );
}
