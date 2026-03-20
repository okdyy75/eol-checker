'use client';

import { useState, useCallback } from 'react';
import { Service, Technology, EOLDataMap } from '@/lib/types';
import ServiceEditor from './ServiceEditor';
import ServiceListItem from './ServiceListItem';

interface ServiceFormProps {
  services: Service[];
  onServicesChange: (services: Service[]) => void;
  availableTechnologies: string[];
  eolData: EOLDataMap;
}

export default function ServiceForm({ 
  services, 
  onServicesChange, 
  availableTechnologies, 
  eolData 
}: ServiceFormProps) {
  const [editingIndex, setEditingIndex] = useState<number>(0);



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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 左側：入力フォーム */}
      <div className="space-y-4">
        {services.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500 text-sm font-medium mb-1">
              サービスを追加してください
            </p>
            <p className="text-gray-400 text-xs">
              右側の「サービスを追加」ボタンをクリック
            </p>
          </div>
        ) : (
          <ServiceEditor
            editingIndex={editingIndex}
            servicesCount={services.length}
            service={editingService}
            availableTechnologies={availableTechnologies}
            eolData={eolData}
            onServiceNameChange={updateServiceName}
            onTechnologyChange={updateTechnology}
            onTechnologyRemove={removeTechnology}
            onTechnologyAdd={addTechnology}
          />
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
              <p className="text-gray-500 text-sm">サービスがありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {services.map((service, index) => (
                <ServiceListItem
                  key={service.id}
                  service={service}
                  isSelected={editingIndex === index}
                  onSelect={() => selectService(index)}
                  onRemove={() => removeService(index)}
                />
              ))}
            </div>
          )}

          <button
            onClick={addNewService}
            className="w-full mt-4 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            サービスを追加
          </button>
        </div>
      </div>
    </div>
  );
}
