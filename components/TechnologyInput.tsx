'use client';

import { useState, useRef, useEffect } from 'react';
import { Technology } from '@/lib/types';
import { validateTechnologyNameField, validateVersionField } from '@/lib/validation';

interface TechnologyInputProps {
  technology: Technology;
  availableTechnologies: string[];
  onChange: (technology: Technology) => void;
  onRemove: () => void;
}

export default function TechnologyInput({ 
  technology, 
  availableTechnologies, 
  onChange, 
  onRemove 
}: TechnologyInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [techNameError, setTechNameError] = useState<string | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const techNameInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 技術名の変更処理
  const handleTechNameChange = (value: string) => {
    onChange({ ...technology, name: value });
    
    // バリデーション
    const validation = validateTechnologyNameField(value);
    setTechNameError(validation.error);
    
    // オートコンプリートのフィルタリング
    if (value.trim()) {
      const filtered = availableTechnologies.filter(tech =>
        tech.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  };

  // バージョンの変更処理
  const handleVersionChange = (value: string) => {
    onChange({ ...technology, currentVersion: value });
    
    // バリデーション
    const validation = validateVersionField(value);
    setVersionError(validation.error);
  };

  // 候補選択処理
  const handleSuggestionClick = (suggestion: string) => {
    onChange({ ...technology, name: suggestion });
    setTechNameError(null);
    setShowSuggestions(false);
    setFilteredSuggestions([]);
  };

  // キーボード操作処理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(filteredSuggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // 外部クリックで候補を閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        techNameInputRef.current && 
        !techNameInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasErrors = techNameError || versionError;

  return (
    <div className="space-y-2">
      <div className={`flex flex-col sm:flex-row gap-2 items-start p-3 border rounded ${
        hasErrors ? 'border-red-300 bg-red-50' : 'border-gray-200'
      }`}>
        {/* 技術名入力フィールド（オートコンプリート付き） */}
        <div className="flex-1 relative w-full sm:w-auto">
          <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">
            技術名
          </label>
          <input
            ref={techNameInputRef}
            type="text"
            placeholder="技術名（例: python, nodejs）"
            value={technology.name}
            onChange={(e) => handleTechNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (technology.name.trim() && filteredSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className={`w-full px-3 py-2 border rounded text-sm sm:text-base ${
              techNameError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          
          {/* オートコンプリート候補 */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-3 py-2 cursor-pointer text-sm ${
                    index === selectedSuggestionIndex
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* バージョン入力フィールド */}
        <div className="w-full sm:w-32">
          <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">
            バージョン
          </label>
          <input
            type="text"
            placeholder="バージョン（例: 3.9）"
            value={technology.currentVersion}
            onChange={(e) => handleVersionChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded text-sm sm:text-base ${
              versionError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>

        {/* 削除ボタン */}
        <button
          onClick={onRemove}
          className="w-full sm:w-auto px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-sm sm:text-base"
          title="この技術を削除"
        >
          削除
        </button>
      </div>

      {/* バリデーションエラー表示 */}
      {(techNameError || versionError) && (
        <div className="text-sm text-red-600 space-y-1">
          {techNameError && (
            <div className="flex items-center gap-1">
              <span className="text-red-500">⚠</span>
              <span>技術名: {techNameError}</span>
            </div>
          )}
          {versionError && (
            <div className="flex items-center gap-1">
              <span className="text-red-500">⚠</span>
              <span>バージョン: {versionError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}