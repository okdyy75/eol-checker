'use client';

import { Service } from '@/lib/types';

interface ServiceListItemProps {
  service: Service;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export default function ServiceListItem({
  service,
  isSelected,
  onSelect,
  onRemove,
}: ServiceListItemProps) {
  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">
            {service.name.trim() || '（未設定）'}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            技術: {service.technologies.length}件
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors flex-shrink-0 flex items-center gap-1"
          title="このサービスを削除"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          削除
        </button>
      </div>

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
  );
}
