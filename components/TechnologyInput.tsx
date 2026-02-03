'use client';

import { useState, useRef, useEffect } from 'react';
import { Technology, EOLDataMap } from '@/lib/types';
import { validateTechnologyName, validateVersion } from '@/lib/validation';
import { getVersionsForTechnology } from '@/lib/eol-data';

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
  const [techNameError, setTechNameError] = useState<string | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  // バージョンsuggest用のstate
  const [showVersionSuggestions, setShowVersionSuggestions] = useState(false);
  const [filteredVersionSuggestions, setFilteredVersionSuggestions] = useState<string[]>([]);
  const [selectedVersionSuggestionIndex, setSelectedVersionSuggestionIndex] = useState(-1);
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  
  const techNameInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);
  const versionSuggestionsRef = useRef<HTMLDivElement>(null);

  // 技術名の変更処理
  const handleTechNameChange = (value: string) => {
    onChange({ ...technology, name: value });
    
    // バリデーション
    setTechNameError(validateTechnologyName(value));
    
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
    setVersionError(validateVersion(value));
    
    // バージョンsuggestのフィルタリング
    if (value.trim() && availableVersions.length > 0) {
      const filtered = availableVersions.filter(version =>
        version.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredVersionSuggestions(filtered);
      setShowVersionSuggestions(filtered.length > 0);
      setSelectedVersionSuggestionIndex(-1);
    } else {
      setShowVersionSuggestions(false);
      setFilteredVersionSuggestions([]);
    }
  };

  // バージョン候補選択処理
  const handleVersionSuggestionClick = (suggestion: string) => {
    onChange({ ...technology, currentVersion: suggestion });
    setVersionError(null);
    setShowVersionSuggestions(false);
    setFilteredVersionSuggestions([]);
  };

  // 候補選択処理
  const handleSuggestionClick = (suggestion: string) => {
    onChange({ ...technology, name: suggestion });
    setTechNameError(null);
    setShowSuggestions(false);
    setFilteredSuggestions([]);
    
    // 技術名が選択されたら、利用可能なバージョンリストを更新
    if (eolData) {
      const versions = getVersionsForTechnology(eolData, suggestion);
      setAvailableVersions(versions);
    }
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

  // バージョン入力用キーボード操作処理
  const handleVersionKeyDown = (e: React.KeyboardEvent) => {
    if (!showVersionSuggestions || filteredVersionSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedVersionSuggestionIndex(prev =>
          prev < filteredVersionSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedVersionSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : filteredVersionSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedVersionSuggestionIndex >= 0) {
          handleVersionSuggestionClick(filteredVersionSuggestions[selectedVersionSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowVersionSuggestions(false);
        setSelectedVersionSuggestionIndex(-1);
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
      
      if (
        versionInputRef.current &&
        !versionInputRef.current.contains(event.target as Node) &&
        versionSuggestionsRef.current &&
        !versionSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowVersionSuggestions(false);
        setSelectedVersionSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // 技術名が変更された時にバージョンリストを更新
  useEffect(() => {
    if (eolData && technology.name) {
      const versions = getVersionsForTechnology(eolData, technology.name);
      setAvailableVersions(versions);
    } else {
      setAvailableVersions([]);
    }
  }, [technology.name, eolData]);

  const hasErrors = techNameError || versionError;

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
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (technology.name.trim() && filteredSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className={`w-full px-3 py-2 bg-gray-50 border rounded text-sm sm:text-base transition-colors ${
              techNameError ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:bg-white focus:bg-white'
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

        {/* バージョン入力フィールド（オートコンプリート付き） */}
        <div className="w-full sm:w-32 relative">
          <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">
            バージョン
          </label>
          <input
            ref={versionInputRef}
            type="text"
            placeholder="例: 3.9, 18"
            value={technology.currentVersion}
            onChange={(e) => handleVersionChange(e.target.value)}
            onKeyDown={handleVersionKeyDown}
            onFocus={() => {
              if (availableVersions.length > 0) {
                setFilteredVersionSuggestions(availableVersions);
                setShowVersionSuggestions(true);
              }
            }}
            className={`w-full px-3 py-2 bg-gray-50 border rounded text-sm sm:text-base transition-colors ${
              versionError ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:bg-white focus:bg-white'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          
          {/* バージョンオートコンプリート候補 */}
          {showVersionSuggestions && filteredVersionSuggestions.length > 0 && (
            <div
              ref={versionSuggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {filteredVersionSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  onClick={() => handleVersionSuggestionClick(suggestion)}
                  className={`px-3 py-2 cursor-pointer text-sm ${
                    index === selectedVersionSuggestionIndex
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