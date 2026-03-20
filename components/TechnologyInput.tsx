'use client';

import { useState, useRef, useEffect } from 'react';
import { Technology, EOLDataMap } from '@/lib/types';
import { validateTechnologyName } from '@/lib/validation';
import { getVersionsForTechnology } from '@/lib/eol-data';

function isKnownTechnology(value: string, availableTechnologies: string[]): boolean {
  return availableTechnologies.some((tech) => tech === value);
}

interface TechnologyInputProps {
  technology: Technology;
  availableTechnologies: string[];
  eolData: EOLDataMap | null;
  onChange: (technology: Technology) => void;
  onRemove: () => void;
}

export default function TechnologyInput({ 
  technology, 
  availableTechnologies,
  eolData,
  onChange, 
  onRemove 
}: TechnologyInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [hasTechNameBlurred, setHasTechNameBlurred] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  
  const techNameInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const validateTechnology = (value: string): string | null => {
    const baseError = validateTechnologyName(value);
    if (baseError) {
      return baseError;
    }

    if (!isKnownTechnology(value.trim(), availableTechnologies)) {
      return '正しい技術を入力してください';
    }

    return null;
  };

  const techNameError = validateTechnology(technology.name);

  // 技術名の変更処理
  const handleTechNameChange = (value: string) => {
    onChange({ ...technology, name: value });

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
  };

  // 候補選択処理
  const handleSuggestionClick = (suggestion: string) => {
    onChange({ ...technology, name: suggestion });
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
  
  // 技術名が変更された時にバージョンリストを更新
  useEffect(() => {
    if (!eolData) {
      setAvailableVersions([]);
      return;
    }

    if (technology.name) {
      const versions = getVersionsForTechnology(eolData, technology.name);
      setAvailableVersions(versions);

      const latestVersion = versions[0] || '';
      if (technology.currentVersion !== latestVersion && !versions.includes(technology.currentVersion)) {
        onChange({ ...technology, currentVersion: latestVersion });
      }
    } else {
      setAvailableVersions([]);

      if (technology.currentVersion !== '') {
        onChange({ ...technology, currentVersion: '' });
      }
    }
  }, [technology, eolData, onChange]);

  const hasErrors = hasTechNameBlurred && techNameError;

  return (
    <div className="space-y-1">
      <div className={`flex flex-col sm:flex-row gap-2 items-start py-2 ${
        hasErrors ? 'bg-red-50 rounded px-2 -mx-2' : ''
      }`}>
        {/* 技術名入力フィールド（オートコンプリート付き） */}
        <div className="flex-1 relative w-full sm:w-auto">
          <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">
            技術名
          </label>
          <input
            ref={techNameInputRef}
            type="text"
            placeholder="例: python, nodejs, mysql"
            value={technology.name}
            onChange={(e) => handleTechNameChange(e.target.value)}
            onFocus={() => {
              setHasTechNameBlurred(false);
              if (technology.name.trim() && filteredSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => setHasTechNameBlurred(true)}
            onKeyDown={handleKeyDown}
            className={`w-full px-3 py-2 bg-gray-50 border rounded text-sm sm:text-base transition-colors ${
              hasTechNameBlurred && techNameError ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:bg-white focus:bg-white'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          
          {/* オートコンプリート候補 */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
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

        {/* バージョン選択フィールド */}
        <div className="w-full sm:w-32">
          <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">
            バージョン
          </label>
          <select
            value={technology.currentVersion}
            onChange={(e) => handleVersionChange(e.target.value)}
            disabled={availableVersions.length === 0}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm sm:text-base transition-colors hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {availableVersions.length === 0 && <option value=""></option>}
            {availableVersions.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
        </div>

        {/* 削除ボタン */}
        <button
          onClick={onRemove}
          className="w-full sm:w-auto px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-sm flex items-center justify-center gap-1"
          title="この技術を削除"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          削除
        </button>
      </div>

      {/* バリデーションエラー表示 */}
      {hasTechNameBlurred && techNameError && (
        <div className="text-sm text-red-600 space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-red-500">⚠</span>
            <span>{techNameError}</span>
          </div>
        </div>
      )}
    </div>
  );
}
