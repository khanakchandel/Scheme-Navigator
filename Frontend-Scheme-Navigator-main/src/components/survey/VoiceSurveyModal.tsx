import React, { useState, useEffect } from 'react';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { parseVoiceInput, ParsedEntity } from '../../utils/voiceParser';
import { UserProfile } from '../../types';
import { TOP_INDIAN_LANGUAGES, LanguageInfo } from '../../constants/languages';
import { useAppStore } from '../../store/appStore';
import { useTranslation } from '../../hooks/useTranslation';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Volume2,
  RotateCcw,
  Languages,
  ChevronDown,
} from 'lucide-react';

interface VoiceSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (extracted: Partial<UserProfile>, entities: ParsedEntity[]) => void;
  currentStep?: number;
  initialProfile?: UserProfile;
}

export const VoiceSurveyModal: React.FC<VoiceSurveyModalProps> = ({
  isOpen,
  onClose,
  onApply,
  currentStep = 1,
}) => {
  const { selectedLanguage, setSelectedLanguage } = useAppStore();
  const { t } = useTranslation();
  const [showLanguageGrid, setShowLanguageGrid] = useState(false);
  const [fullText, setFullText] = useState('');
  const [parsedData, setParsedData] = useState<ReturnType<typeof parseVoiceInput>>({
    profile: {},
    entities: [],
    rawText: '',
  });

  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage,
  } = useVoiceRecognition({
    language: selectedLanguage.speechCode,
    onResult: (text) => {
      setFullText(text);
      const parsed = parseVoiceInput(text);
      setParsedData(parsed);
    },
  });

  // When modal opens, start speech recognition
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setFullText('');
        setParsedData({ profile: {}, entities: [], rawText: '' });
        resetTranscript();
        startListening();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      stopListening();
    }
  }, [isOpen, startListening, stopListening, resetTranscript]);

  const handleLanguageChange = (lang: LanguageInfo) => {
    setSelectedLanguage(lang);
    setLanguage(lang.speechCode);
    setShowLanguageGrid(false);
    resetTranscript();
    setFullText('');
    setParsedData({ profile: {}, entities: [], rawText: '' });
    setTimeout(() => {
      startListening();
    }, 200);
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleReset = () => {
    resetTranscript();
    setFullText('');
    setParsedData({ profile: {}, entities: [], rawText: '' });
    startListening();
  };

  const handleApply = () => {
    if (Object.keys(parsedData.profile).length > 0) {
      onApply(parsedData.profile, parsedData.entities);
      stopListening();
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentPrompt = selectedLanguage.stepPrompts[currentStep] || selectedLanguage.stepPrompts[1];
  const displayedSpeech = fullText || transcript || interimTranscript;
  const hasRecognizedFields = parsedData.entities.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-emerald-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">{t('voice.title', undefined, 'Voice Survey Assistant')}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-extrabold uppercase">
                  12 Indian Languages
                </span>
              </div>
              <p className="text-xs text-teal-200 mt-0.5">
                {selectedLanguage.nativeName} ({selectedLanguage.name}) • {selectedLanguage.speakLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Active Language Bar & Dropdown Toggle */}
          <div className="relative">
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded-2xl">
              <div className="flex items-center gap-2 px-2 text-xs font-bold text-slate-700">
                <Languages className="w-4 h-4 text-teal-700" />
                <span>{t('voice.selected_lang', undefined, 'Selected Language:')}</span>
                <span className="px-2.5 py-1 rounded-xl bg-teal-800 text-white text-xs font-bold">
                  {selectedLanguage.nativeName} ({selectedLanguage.name})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLanguageGrid(!showLanguageGrid)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-teal-900 hover:bg-teal-50 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <span>{t('voice.change_lang', undefined, 'Change Language')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLanguageGrid ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Regional Languages Grid Selector (Top 11 Indian Languages + English) */}
            {showLanguageGrid && (
              <div className="mt-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 animate-in zoom-in-95 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TOP_INDIAN_LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguage.code === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-teal-800 text-white border-teal-800 shadow-xs ring-2 ring-teal-500/20'
                          : 'bg-slate-50 hover:bg-teal-50/60 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{lang.nativeName}</span>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                      </div>
                      <div className={`text-[11px] font-medium ${isSelected ? 'text-teal-200' : 'text-slate-500'}`}>
                        {lang.name}
                      </div>
                      <div className={`text-[9px] mt-0.5 truncate ${isSelected ? 'text-teal-300' : 'text-slate-400'}`}>
                        {lang.region}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unsupported Browser Warning */}
          {!isSupported && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">{t('voice.unsupported_title', undefined, 'Browser Unsupported:')}</span>
                {t('voice.unsupported_desc', undefined, 'Your browser does not support the Web Speech API. Please use Google Chrome, Microsoft Edge, or Safari for voice input.')}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && isSupported && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Central Microphone Visualizer */}
          <div className="flex flex-col items-center justify-center py-3 space-y-2.5">
            <div className="relative flex items-center justify-center">
              {/* Ripple animation waves when listening */}
              {isListening && (
                <>
                  <div className="absolute w-28 h-28 rounded-full bg-teal-500/20 animate-ping" />
                  <div className="absolute w-24 h-24 rounded-full bg-emerald-500/30 animate-pulse" />
                </>
              )}

              <button
                type="button"
                onClick={handleToggleListening}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer ${
                  isListening
                    ? 'bg-gradient-to-tr from-rose-600 to-rose-500 text-white ring-4 ring-rose-300 scale-105'
                    : 'bg-gradient-to-tr from-teal-700 to-emerald-600 text-white hover:scale-105 ring-4 ring-teal-100'
                }`}
              >
                {isListening ? (
                  <Mic className="w-8 h-8 animate-pulse" />
                ) : (
                  <MicOff className="w-8 h-8" />
                )}
              </button>
            </div>

            <div className="text-center">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 block">
                {isListening ? `${t('voice.listening_in', undefined, 'Listening in')} ${selectedLanguage.nativeName}...` : t('voice.paused', undefined, 'Microphone Paused')}
              </span>
              <span className="text-[11px] text-slate-500">
                {isListening ? t('voice.speak_hint', undefined, 'Speak naturally in your native language') : t('voice.resume_hint', undefined, 'Tap the microphone to resume speaking')}
              </span>
            </div>
          </div>

          {/* Spoken Transcript Live Feed */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 min-h-[70px]">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                <span>{t('voice.transcript_title', undefined, 'Live Speech Transcript:')}</span>
              </div>
              {displayedSpeech && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-teal-800 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('voice.clear_btn', undefined, 'Clear')}</span>
                </button>
              )}
            </div>
            <p className="text-sm font-medium text-slate-900 italic leading-relaxed">
              {displayedSpeech ? `“${displayedSpeech}”` : (
                <span className="text-slate-400 not-italic font-normal">
                  {t('voice.speak_example_prefix', undefined, 'Speak in')} {selectedLanguage.nativeName} (e.g. "{currentPrompt.examples[0]}")
                </span>
              )}
            </p>
          </div>

          {/* Recognized Structured Fields Cards */}
          {hasRecognizedFields && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('voice.recognized_fields', { count: parsedData.entities.length }, `Recognized Form Fields (${parsedData.entities.length})`)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {parsedData.entities.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-emerald-950 shadow-2xs"
                  >
                    <span className="text-emerald-700 font-semibold">{item.label}:</span>
                    <span>{item.value}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Example Suggestions tailored in the Active Regional Language */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {t('voice.try_saying', undefined, 'Try saying in')} {selectedLanguage.nativeName} ({currentPrompt.title}):
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {currentPrompt.examples.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setFullText(ex);
                    const parsed = parseVoiceInput(ex);
                    setParsedData(parsed);
                  }}
                  className="text-left text-xs text-slate-700 hover:text-teal-950 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors border border-dashed border-slate-200 cursor-pointer flex items-center justify-between"
                >
                  <span className="font-medium">"{ex}"</span>
                  <span className="text-[10px] text-teal-700 font-bold ml-2 shrink-0">{t('voice.click_to_test', undefined, 'Click to test')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-200/70 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            {t('common.cancel', undefined, 'Cancel')}
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!hasRecognizedFields}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer ${
              hasRecognizedFields
                ? 'bg-teal-800 hover:bg-teal-900 text-white shadow-teal-900/20 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('voice.fill_form_fields', undefined, 'Fill Form Fields')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
