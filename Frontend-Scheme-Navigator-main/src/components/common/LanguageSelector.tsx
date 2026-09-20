import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { TOP_INDIAN_LANGUAGES, LanguageInfo } from '../../constants/languages';
import { applySiteLanguage } from '../../utils/translator';
import {
  Globe,
  ChevronDown,
  Check,
  Search,
  Languages,
  Sparkles,
  X,
} from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'navbar' | 'compact' | 'pill' | 'footer';
  align?: 'left' | 'right';
  className?: string;
  onSelect?: (language: LanguageInfo) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'navbar',
  align = 'right',
  className = '',
  onSelect,
}) => {
  const { selectedLanguage, setSelectedLanguage } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredLanguages = TOP_INDIAN_LANGUAGES.filter((lang) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.region.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  const handleSelectLanguage = (lang: LanguageInfo) => {
    setSelectedLanguage(lang);
    applySiteLanguage(lang.code);
    if (onSelect) onSelect(lang);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Button rendering based on variant
  const renderTrigger = () => {
    if (variant === 'compact') {
      return (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          title={`Current Language: ${selectedLanguage.nativeName} (${selectedLanguage.name})`}
          className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0 min-w-0 max-w-[96px] sm:max-w-[120px] ${className}`}
        >
          <Globe className="w-3.5 h-3.5 text-teal-700 dark:text-emerald-400 shrink-0" />
          <span className="font-bold text-slate-900 dark:text-white truncate text-[11px] sm:text-xs">
            {selectedLanguage.nativeName}
          </span>
          <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      );
    }

    if (variant === 'pill') {
      return (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100/80 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 text-teal-950 dark:text-emerald-200 text-xs font-bold transition-all shadow-2xs cursor-pointer ${className}`}
        >
          <div className="w-5 h-5 rounded-md bg-teal-700 text-white flex items-center justify-center font-bold text-[10px]">
            {selectedLanguage.code.split('-')[0].toUpperCase()}
          </div>
          <div className="text-left flex flex-col">
            <span className="text-[10px] text-teal-700 dark:text-teal-400 font-medium leading-none">Language / भाषा</span>
            <span className="text-xs font-bold leading-tight">{selectedLanguage.nativeName}</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-teal-700 dark:text-teal-400 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      );
    }

    if (variant === 'footer') {
      return (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer ${className}`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{selectedLanguage.nativeName}</span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      );
    }

    // Default 'navbar' variant
    return (
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Change Language / भाषा बदलें"
        className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-teal-300 dark:hover:border-teal-500/60 shadow-2xs hover:shadow-xs transition-all text-slate-800 dark:text-slate-100 cursor-pointer shrink-0 min-w-0 ${
          isOpen ? 'ring-2 ring-teal-500/20 border-teal-500 bg-white dark:bg-slate-800 dark:border-teal-500/60' : ''
        } ${className}`}
      >
        <div className="w-5 h-5 rounded-lg bg-teal-800 dark:bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-teal-900 dark:group-hover:bg-teal-600 transition-colors">
          <Languages className="w-3 h-3 text-emerald-300 shrink-0" />
        </div>
        <div className="flex items-center min-w-0">
          <span className="font-extrabold text-slate-900 dark:text-white text-xs tracking-tight truncate max-w-[90px] xl:max-w-none">
            {selectedLanguage.nativeName}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform ${
            isOpen ? 'rotate-180 text-teal-700 dark:text-teal-400' : ''
          }`}
        />
      </button>
    );
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {renderTrigger()}

      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-80 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/90 dark:border-slate-800 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold leading-tight">Change Language</h4>
                <p className="text-[10px] text-teal-200/80 leading-none">भाषा चुनें (12 Regional Languages)</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language or state..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1 divide-y-0">
            {filteredLanguages.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No language matching "{searchQuery}"
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = selectedLanguage.code === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-700/80 text-teal-950 dark:text-emerald-300 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-teal-700 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {lang.nativeName.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {lang.nativeName}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            • {lang.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">
                          {lang.region}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                          {lang.code.split('-')[0]}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Info Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-[10px] text-teal-800 dark:text-emerald-400 font-semibold">
              <Sparkles className="w-3 h-3 text-teal-600 dark:text-emerald-400" />
              Applies to Voice Survey & AI Advisor
            </span>
            <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              12 Languages
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
