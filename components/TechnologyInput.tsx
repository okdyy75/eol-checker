'use client';

import { useEffect, useMemo, useState } from 'react';
import { Technology, EOLDataMap } from '@/lib/types';
import { getVersionsForTechnology } from '@/lib/eol-data';

interface TechnologyInputProps {
  technology: Technology;
  availableTechnologies: string[];
  eolData: EOLDataMap | null;
  onChange: (technology: Technology) => void;
  onRemove: () => void;
}

type SuggestionField = 'tech' | 'version' | null;

export default function TechnologyInput({
  technology,
  availableTechnologies,
  eolData,
  onChange,
  onRemove,
}: TechnologyInputProps) {
  const [techNameInputValue, setTechNameInputValue] = useState(technology.name);
  const [versionInputValue, setVersionInputValue] = useState(technology.currentVersion);
  const [activeField, setActiveField] = useState<SuggestionField>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const closeSuggestions = () => {
    setActiveField(null);
  };

  useEffect(() => {
    setTechNameInputValue(technology.name);
  }, [technology.name]);

  useEffect(() => {
    setVersionInputValue(technology.currentVersion);
  }, [technology.currentVersion]);

  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [activeField, techNameInputValue, versionInputValue]);

  const availableVersions = useMemo(() => {
    if (!eolData || !technology.name) {
      return [];
    }

    return getVersionsForTechnology(eolData, technology.name);
  }, [eolData, technology.name]);

  const techSuggestions = useMemo(() => {
    if (!techNameInputValue.trim()) {
      return [];
    }

    return availableTechnologies.filter((tech) =>
      tech.toLowerCase().includes(techNameInputValue.toLowerCase())
    );
  }, [availableTechnologies, techNameInputValue]);

  const versionSuggestions = useMemo(() => {
    if (!availableVersions.length) {
      return [];
    }

    if (!versionInputValue.trim()) {
      return availableVersions;
    }

    return availableVersions.filter((version) =>
      version.toLowerCase().includes(versionInputValue.toLowerCase())
    );
  }, [availableVersions, versionInputValue]);

  const handleSuggestionKeyDown = (
    e: React.KeyboardEvent,
    suggestions: string[],
    inputValue: string,
    onSelect: (suggestion: string) => void
  ) => {
    if (suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          onSelect(suggestions[selectedSuggestionIndex]);
          return;
        }

        const exactMatch = suggestions.find(
          (suggestion) => suggestion.toLowerCase() === inputValue.trim().toLowerCase()
        );
        if (exactMatch) {
          onSelect(exactMatch);
        }
        break;
      case 'Escape':
        closeSuggestions();
        break;
    }
  };

  const selectTechnology = (suggestion: string) => {
    onChange({ ...technology, name: suggestion, currentVersion: '' });
    setTechNameInputValue(suggestion);
    setVersionInputValue('');
    closeSuggestions();
  };

  const selectVersion = (suggestion: string) => {
    onChange({ ...technology, currentVersion: suggestion });
    setVersionInputValue(suggestion);
    closeSuggestions();
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-col sm:flex-row gap-2 items-start py-2">
        <div className="flex-1 relative w-full sm:w-auto">
          <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">
            技術名
          </label>
          <input
            type="text"
            placeholder="例: python, nodejs, mysql"
            value={techNameInputValue}
            onChange={(e) => {
              setTechNameInputValue(e.target.value);
              setActiveField('tech');
            }}
            onFocus={() => {
              setActiveField('tech');
            }}
            onBlur={() => {
              if (techNameInputValue.trim() === '') {
                onChange({ ...technology, name: '', currentVersion: '' });
                setTechNameInputValue('');
                setVersionInputValue('');
              } else {
                setTechNameInputValue(technology.name);
              }

              closeSuggestions();
            }}
            onKeyDown={(e) => handleSuggestionKeyDown(e, techSuggestions, techNameInputValue, selectTechnology)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm sm:text-base transition-colors hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={activeField === 'tech' && techSuggestions.length > 0}
            aria-controls="technology-suggestions"
            aria-activedescendant={selectedSuggestionIndex >= 0 ? `technology-option-${selectedSuggestionIndex}` : undefined}
          />

          {activeField === 'tech' && techSuggestions.length > 0 && (
            <div id="technology-suggestions" role="listbox" className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {techSuggestions.map((suggestion, index) => (
                <div
                  id={`technology-option-${index}`}
                  key={suggestion}
                  role="option"
                  aria-selected={index === selectedSuggestionIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectTechnology(suggestion);
                  }}
                  className={`px-3 py-2 cursor-pointer text-sm ${
                    index === selectedSuggestionIndex ? 'bg-gray-100' : 'hover:bg-gray-100'
                  }`}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full sm:w-32 relative">
          <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">
            バージョン
          </label>
          <input
            type="text"
            placeholder="例: 3.9, 18"
            value={versionInputValue}
            onChange={(e) => {
              setVersionInputValue(e.target.value);
              setActiveField('version');
            }}
            onFocus={() => {
              setActiveField('version');
            }}
            onBlur={() => {
              if (versionInputValue.trim() === '') {
                onChange({ ...technology, currentVersion: '' });
                setVersionInputValue('');
              } else {
                setVersionInputValue(technology.currentVersion);
              }

              closeSuggestions();
            }}
            onKeyDown={(e) => handleSuggestionKeyDown(e, versionSuggestions, versionInputValue, selectVersion)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm sm:text-base transition-colors hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={activeField === 'version' && versionSuggestions.length > 0}
            aria-controls="version-suggestions"
            aria-activedescendant={selectedSuggestionIndex >= 0 ? `version-option-${selectedSuggestionIndex}` : undefined}
          />

          {activeField === 'version' && versionSuggestions.length > 0 && (
            <div id="version-suggestions" role="listbox" className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {versionSuggestions.map((suggestion, index) => (
                <div
                  id={`version-option-${index}`}
                  key={suggestion}
                  role="option"
                  aria-selected={index === selectedSuggestionIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectVersion(suggestion);
                  }}
                  className={`px-3 py-2 cursor-pointer text-sm ${
                    index === selectedSuggestionIndex ? 'bg-gray-100' : 'hover:bg-gray-100'
                  }`}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

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
    </div>
  );
}
