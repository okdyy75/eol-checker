'use client';

import { useState, useEffect } from 'react';
import { Service, Technology, EOLDataMap } from '@/lib/types';
import { validateServiceNameField, validateForm, ValidationResult } from '@/lib/validation';
import { loadEOLData, getAvailableTechnologies } from '@/lib/eol-data';
import TechnologyInput from './TechnologyInput';

interface ServiceFormProps {
  services: Service[];
  onServicesChange: (services: Service[]) => void;
}

export default function ServiceForm({ services, onServicesChange }: ServiceFormProps) {
  const [availableTechnologies, setAvailableTechnologies] = useState<string[]>([]);
  const [formValidation, setFormValidation] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  // フォーム全体のバリデーション
  useEffect(() => {
    const validation = validateForm(services);
    setFormValidation(validation);
  }, [services]);

  // 新しいサービスを追加
  const addService = () => {
    const newService: Service = {
      id: `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      technologies: []
    };
    onServicesChange([...services, newService]);
  };

  // サービスを削除
  const removeService = (serviceId: string) => {
    const updatedServices = services.filter(service => service.id !== serviceId);
    onServicesChange(updatedServices);
  };

  // サービス名を更新
  const updateServiceName = (serviceId: string, name: string) => {
    const updatedServices = services.map(service =>
      service.id === serviceId ? { ...service, name } : service
    );
    onServicesChange(updatedServices);
  };

  // 技術を追加
  const addTechnology = (serviceId: string) => {
    const newTechnology: Technology = {
      id: `tech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      currentVersion: ''
    };

    const updatedServices = services.map(service =>
      service.id === serviceId
        ? { ...service, technologies: [...service.technologies, newTechnology] }
        : service
    );
    onServicesChange(updatedServices);
  };

  // 技術を削除
  const removeTechnology = (serviceId: string, technologyId: string) => {
    const updatedServices = services.map(service =>
      service.id === serviceId
        ? {
            ...service,
            technologies: service.technologies.filter(tech => tech.id !== technologyId)
          }
        : service
    );
    onServicesChange(updatedServices);
  };

  // 技術を更新
  const updateTechnology = (serviceId: string, technologyId: string, updatedTechnology: Technology) => {
    const updatedServices = services.map(service =>
      service.id === serviceId
        ? {
            ...service,
            technologies: service.technologies.map(tech =>
              tech.id === technologyId ? updatedTechnology : tech
            )
          }
        : service
    );
    onServicesChange(updatedServices);
  };

  // データをクリア
  const clearAllData = () => {
    if (confirm('すべてのデータをクリアしますか？この操作は元に戻せません。')) {
      onServicesChange([]);
    }
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
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800">
          サービスと技術スタック
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={addService}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm sm:text-base"
          >
            + サービス追加
          </button>
          {services.length > 0 && (
            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors text-sm sm:text-base"
            >
              すべてクリア
            </button>
          )}
        </div>
      </div>

      {/* フォーム全体のバリデーションエラー */}
      {!formValidation.isValid && formValidation.errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium mb-2">入力エラー</h3>
          <ul className="space-y-1">
            {formValidation.errors.map((error, index) => (
              <li key={index} className="text-red-700 text-sm flex items-center space-x-1">
                <span className="text-red-500">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* サービスリスト */}
      {services.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4 text-sm sm:text-base">まだサービスが追加されていません</p>
          <button
            onClick={addService}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm sm:text-base"
          >
            最初のサービスを追加
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service, serviceIndex) => (
            <ServiceCard
              key={service.id}
              service={service}
              serviceIndex={serviceIndex}
              availableTechnologies={availableTechnologies}
              onUpdateServiceName={(name) => updateServiceName(service.id, name)}
              onRemoveService={() => removeService(service.id)}
              onAddTechnology={() => addTechnology(service.id)}
              onRemoveTechnology={(technologyId) => removeTechnology(service.id, technologyId)}
              onUpdateTechnology={(technologyId, technology) => 
                updateTechnology(service.id, technologyId, technology)
              }
            />
          ))}
        </div>
      )}

      {/* フォーム状態の表示 */}
      <div className="text-sm text-gray-500 border-t pt-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <span className="text-center sm:text-left">
            サービス数: {services.length} | 
            技術数: {services.reduce((total, service) => total + service.technologies.length, 0)}
          </span>
          <span className={`px-2 py-1 rounded text-xs self-center sm:self-auto ${
            formValidation.isValid 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {formValidation.isValid ? '入力OK' : 'エラーあり'}
          </span>
        </div>
      </div>
    </div>
  );
}

// サービスカードコンポーネント
interface ServiceCardProps {
  service: Service;
  serviceIndex: number;
  availableTechnologies: string[];
  onUpdateServiceName: (name: string) => void;
  onRemoveService: () => void;
  onAddTechnology: () => void;
  onRemoveTechnology: (technologyId: string) => void;
  onUpdateTechnology: (technologyId: string, technology: Technology) => void;
}

function ServiceCard({
  service,
  serviceIndex,
  availableTechnologies,
  onUpdateServiceName,
  onRemoveService,
  onAddTechnology,
  onRemoveTechnology,
  onUpdateTechnology
}: ServiceCardProps) {
  const [serviceNameError, setServiceNameError] = useState<string | null>(null);

  // サービス名のバリデーション
  const handleServiceNameChange = (name: string) => {
    onUpdateServiceName(name);
    const validation = validateServiceNameField(name);
    setServiceNameError(validation.error);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      {/* サービス名入力 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-3 sm:space-y-0 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            サービス名 {serviceIndex + 1}
          </label>
          <input
            type="text"
            placeholder="サービス名を入力（例: マイクロサービスA、Webアプリ）"
            value={service.name}
            onChange={(e) => handleServiceNameChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${
              serviceNameError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base`}
          />
          {serviceNameError && (
            <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
              <span className="text-red-500">⚠</span>
              <span>{serviceNameError}</span>
            </p>
          )}
        </div>
        <button
          onClick={onRemoveService}
          className="sm:mt-6 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-sm sm:text-base w-full sm:w-auto"
          title="このサービスを削除"
        >
          削除
        </button>
      </div>

      {/* 技術スタック */}
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
          <label className="block text-sm font-medium text-gray-700">
            使用技術
          </label>
          <button
            onClick={onAddTechnology}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors w-full sm:w-auto"
          >
            + 技術追加
          </button>
        </div>

        {service.technologies.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-sm mb-2">技術が追加されていません</p>
            <button
              onClick={onAddTechnology}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            >
              技術を追加
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {service.technologies.map((technology) => (
              <TechnologyInput
                key={technology.id}
                technology={technology}
                availableTechnologies={availableTechnologies}
                onChange={(updatedTechnology) => onUpdateTechnology(technology.id, updatedTechnology)}
                onRemove={() => onRemoveTechnology(technology.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}