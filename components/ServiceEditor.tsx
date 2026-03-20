'use client';

import { useState } from 'react';
import { Service, Technology, EOLDataMap } from '@/lib/types';
import { validateServiceName } from '@/lib/validation';
import TechnologyInput from './TechnologyInput';

interface ServiceEditorProps {
  editingIndex: number;
  servicesCount: number;
  service?: Service;
  availableTechnologies: string[];
  eolData: EOLDataMap;
  onServiceNameChange: (name: string) => void;
  onTechnologyChange: (technologyId: string, technology: Technology) => void;
  onTechnologyRemove: (technologyId: string) => void;
  onTechnologyAdd: () => void;
}

export default function ServiceEditor({
  editingIndex,
  servicesCount,
  service,
  availableTechnologies,
  eolData,
  onServiceNameChange,
  onTechnologyChange,
  onTechnologyRemove,
  onTechnologyAdd,
}: ServiceEditorProps) {
  const [hasServiceNameBlurred, setHasServiceNameBlurred] = useState(false);

  if (!service) {
    return null;
  }

  const serviceNameError = validateServiceName(service.name);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">
            サービスを編集
          </h3>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            {editingIndex + 1} / {servicesCount}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          サービス名
        </label>
        <input
          type="text"
          placeholder="例: マイクロサービスA, Webアプリ"
          value={service.name}
          onChange={(e) => onServiceNameChange(e.target.value)}
          onFocus={() => setHasServiceNameBlurred(false)}
          onBlur={() => setHasServiceNameBlurred(true)}
          className={`w-full px-3 py-2 bg-gray-50 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base transition-colors ${
            hasServiceNameBlurred && serviceNameError ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:bg-white focus:bg-white'
          }`}
        />
        {hasServiceNameBlurred && serviceNameError && (
          <div className="mt-2 text-sm text-red-600">
            <div className="flex items-center gap-1">
              <span className="text-red-500">⚠</span>
              <span>{serviceNameError}</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            使用技術
          </label>
          <span className="text-xs text-gray-500" title="入力したバージョンから最新バージョンまでのEOL情報が自動的に表示されます">
            <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            入力したバージョンから最新まで自動表示
          </span>
        </div>

        {service.technologies.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-md border-2 border-dashed border-gray-300 mb-3">
            <p className="text-gray-500 text-sm">技術がありません</p>
          </div>
        ) : (
          <div className="space-y-1 mb-3">
            {service.technologies.map((technology) => (
              <TechnologyInput
                key={technology.id}
                technology={technology}
                availableTechnologies={availableTechnologies}
                eolData={eolData}
                onChange={(updatedTechnology) => onTechnologyChange(technology.id, updatedTechnology)}
                onRemove={() => onTechnologyRemove(technology.id)}
              />
            ))}
          </div>
        )}

        <button
          onClick={onTechnologyAdd}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors text-sm"
        >
          + 技術を追加
        </button>
      </div>
    </div>
  );
}
