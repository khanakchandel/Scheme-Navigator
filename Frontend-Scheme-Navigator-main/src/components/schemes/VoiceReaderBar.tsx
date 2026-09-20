import React, { useMemo } from 'react';
import { Scheme } from '../../types';
import { useVoiceReader } from '../../hooks/useVoiceReader';
import { useTranslation } from '../../hooks/useTranslation';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface VoiceReaderBarProps {
  scheme: Scheme;
  className?: string;
}

export const VoiceReaderBar: React.FC<VoiceReaderBarProps> = ({ scheme, className = '' }) => {
  const { t, tCategory, currentLanguage, langCode } = useTranslation();
  const {
    isSupported,
    isPlaying,
    isPaused,
    progress,
    rate,
    setRate,
    play,
    pause,
    resume,
    stop,
  } = useVoiceReader();

  // Construct structured text to speak based on the scheme details
  const speechText = useMemo(() => {
    const parts: string[] = [];

    // 1. Title & Category
    const categoryName = tCategory(scheme.category);
    parts.push(`${scheme.name}.`);
    if (categoryName) {
      parts.push(`${t('explore.category', undefined, 'Category')}: ${categoryName}.`);
    }

    // 2. Summary
    if (scheme.shortDescription || scheme.detailedDescription) {
      parts.push(scheme.shortDescription || scheme.detailedDescription);
    }

    // 3. Benefits
    if (Array.isArray(scheme.benefits) && scheme.benefits.length > 0) {
      const topBenefits = scheme.benefits.slice(0, 3).map((b) => b.title || b.description || b.amountOrValue).filter(Boolean);
      if (topBenefits.length > 0) {
        parts.push(`${t('scheme_detail.benefits_title', undefined, 'Key Benefits')}: ${topBenefits.join('. ')}.`);
      }
    }

    // 4. Documents
    if (Array.isArray(scheme.documents) && scheme.documents.length > 0) {
      const docNames = scheme.documents.slice(0, 4).map((d) => d.name).filter(Boolean);
      if (docNames.length > 0) {
        parts.push(`${t('scheme_detail.documents_title', undefined, 'Required Documents')}: ${docNames.join(', ')}.`);
      }
    }

    return parts.join(' ');
  }, [scheme, t, tCategory]);

  if (!isSupported) {
    return null;
  }

  const handleTogglePlay = () => {
    if (isPlaying && !isPaused) {
      pause();
    } else if (isPlaying && isPaused) {
      resume();
    } else {
      play(speechText, currentLanguage?.speechCode || langCode);
    }
  };

  const handleStop = () => {
    stop();
  };

  const cycleSpeed = () => {
    const nextRate = rate === 1.0 ? 1.2 : rate === 1.2 ? 0.8 : 1.0;
    setRate(nextRate);
    if (isPlaying) {
      // restart with new rate
      play(speechText, currentLanguage?.speechCode || langCode);
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 transition-all border ${
        isPlaying
          ? 'bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white border-teal-500/50 shadow-lg shadow-teal-950/30 ring-2 ring-teal-400/30'
          : 'bg-teal-50/80 hover:bg-teal-50 border-teal-200/90 text-slate-800'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Icon, Title & Language Info */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
              isPlaying
                ? 'bg-emerald-400 text-slate-950 shadow-md animate-pulse'
                : 'bg-teal-800 text-white'
            }`}
          >
            {isPlaying && !isPaused ? (
              <Volume2 className="w-5 h-5 animate-bounce" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black tracking-wide uppercase ${isPlaying ? 'text-emerald-300' : 'text-teal-900'}`}>
                {isPlaying ? (isPaused ? 'Voice Reader Paused' : 'Voice Reader Speaking') : 'Scheme Voice Reader'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isPlaying
                    ? 'bg-teal-800 text-teal-200 border border-teal-700'
                    : 'bg-white text-teal-800 border border-teal-200 shadow-2xs'
                }`}
              >
                {currentLanguage?.nativeName || 'English'}
              </span>
            </div>
            <p className={`text-xs truncate max-w-sm ${isPlaying ? 'text-teal-100/80' : 'text-slate-600'}`}>
              {isPlaying
                ? isPaused
                  ? 'Click resume to continue listening'
                  : 'Reading scheme details aloud...'
                : `Listen to scheme details in ${currentLanguage?.nativeName || 'your language'}`}
            </p>
          </div>
        </div>

        {/* Right: Audio Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Speed Selector Button */}
          <button
            type="button"
            onClick={cycleSpeed}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-teal-800/80 hover:bg-teal-700 text-teal-200 border border-teal-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
            }`}
            title="Change speech speed (0.8x, 1x, 1.2x)"
          >
            {rate}x
          </button>

          {/* Play / Pause Main Action Button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer ${
              isPlaying && !isPaused
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                : isPlaying && isPaused
                ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 animate-pulse'
                : 'bg-teal-800 hover:bg-teal-900 text-white'
            }`}
          >
            {isPlaying && !isPaused ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : isPlaying && isPaused ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Listen ({currentLanguage?.nativeName || 'English'})</span>
              </>
            )}
          </button>

          {/* Stop / Reset Button */}
          {isPlaying && (
            <button
              type="button"
              onClick={handleStop}
              className="p-2 rounded-xl bg-teal-800/80 hover:bg-rose-600 hover:text-white text-teal-200 border border-teal-700 transition-colors cursor-pointer"
              title="Stop Reading"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Live Speaking Progress Bar */}
      {isPlaying && (
        <div className="mt-3 pt-3 border-t border-teal-800/60 flex items-center gap-3">
          <div className="flex-1 bg-teal-950 rounded-full h-1.5 overflow-hidden border border-teal-800">
            <div
              className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-teal-300 shrink-0">
            {progress}%
          </span>
        </div>
      )}
    </div>
  );
};
