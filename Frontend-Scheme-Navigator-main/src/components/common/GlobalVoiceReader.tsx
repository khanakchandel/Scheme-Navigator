import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useVoiceReader } from '../../hooks/useVoiceReader';
import { useAppStore } from '../../store/appStore';
import { useTranslation } from '../../hooks/useTranslation';
import {
  Volume2,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  X,
  Minimize2,
  Maximize2,
  Gauge,
} from 'lucide-react';

export const GlobalVoiceReader: React.FC = () => {
  const location = useLocation();
  const { isVoiceReaderOpen, closeVoiceReader, selectedLanguage } = useAppStore();
  const { tp, langCode } = useTranslation();
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const {
    isSupported,
    isPlaying,
    isPaused,
    progress,
    rate,
    currentSentence,
    currentChunkIndex,
    totalChunks,
    setRate,
    play,
    pause,
    resume,
    stop,
    skipNext,
    skipPrevious,
  } = useVoiceReader();

  // Stop reading when route changes
  useEffect(() => {
    stop();
  }, [location.pathname, stop]);

  if (!isSupported || !isVoiceReaderOpen) {
    return null;
  }

  const handleTogglePlay = () => {
    if (isPlaying && !isPaused) {
      pause();
    } else if (isPlaying && isPaused) {
      resume();
    } else {
      play(undefined, selectedLanguage?.speechCode || langCode);
    }
  };

  const handleRestart = () => {
    stop();
    setTimeout(() => {
      play(undefined, selectedLanguage?.speechCode || langCode);
    }, 100);
  };

  const speeds = [0.75, 1.0, 1.25, 1.5];

  const handleCycleSpeed = () => {
    const currentIdx = speeds.indexOf(rate);
    const nextIdx = (currentIdx + 1) % speeds.length;
    setRate(speeds[nextIdx]);
  };

  const activeLangName = selectedLanguage?.nativeName || selectedLanguage?.name || 'English';

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-24 z-50 animate-fade-in">
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white shadow-2xl border border-teal-500/40 backdrop-blur-xl">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              isPlaying && !isPaused
                ? 'bg-emerald-400 text-slate-950 shadow-md animate-pulse'
                : 'bg-teal-800 hover:bg-teal-700 text-white'
            }`}
            title={isPlaying && !isPaused ? 'Pause Voice Reader' : 'Play Voice Reader'}
          >
            {isPlaying && !isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-teal-200 hover:text-white transition-colors cursor-pointer"
            title="Expand Voice Reader settings"
          >
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">
              {isPlaying ? (isPaused ? tp('Paused') : tp('Reading...')) : tp('Voice Reader')}
            </span>
            <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              stop();
              closeVoiceReader();
            }}
            className="p-1.5 text-teal-300 hover:text-white rounded-lg hover:bg-teal-800/60 transition-colors cursor-pointer"
            title="Close Voice Reader"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside
      aria-label="Universal Page Voice Reader"
      className="sticky top-15 sm:top-16 z-35 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-teal-200/80 dark:border-teal-800/80 shadow-md transition-colors duration-200"
    >
      {/* Top micro progress bar */}
      <div className="w-full bg-teal-100/60 dark:bg-slate-800 h-1 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left Cluster: Icon, Title, Language Badge & Subtitle */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                isPlaying && !isPaused
                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-md animate-pulse'
                  : 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
              }`}
            >
              {isPlaying && !isPaused ? (
                <Volume2 className="w-4 h-4 animate-bounce" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </div>

            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wide uppercase text-teal-950 dark:text-teal-300">
                  {isPlaying
                    ? isPaused
                      ? tp('Voice Reader Paused')
                      : tp('Voice Reader Speaking')
                    : tp('Page Voice Reader')}
                </span>
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800">
                  {activeLangName}
                </span>
                {totalChunks > 0 && (
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                    ({currentChunkIndex + 1}/{totalChunks})
                  </span>
                )}
              </div>

              {/* Live sentence subtitle display */}
              <p className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-xl">
                {currentSentence
                  ? `"${currentSentence}"`
                  : isPlaying
                  ? tp('Reading page content aloud...')
                  : tp('Click play to read this entire page aloud in') + ` ${activeLangName}`}
              </p>
            </div>
          </div>

          {/* Right Cluster: Audio Controls & Settings */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
            {/* Skip Previous Sentence */}
            <button
              type="button"
              onClick={skipPrevious}
              disabled={!isPlaying || currentChunkIndex <= 0}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Previous sentence"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause Primary Button */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-700 via-teal-800 to-teal-950 hover:from-teal-800 hover:to-slate-900 text-white text-xs font-extrabold shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
              title={isPlaying && !isPaused ? 'Pause' : 'Play'}
            >
              {isPlaying && !isPaused ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>{tp('Pause')}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isPlaying && isPaused ? tp('Resume') : tp('Listen to Page')}</span>
                </>
              )}
            </button>

            {/* Skip Next Sentence */}
            <button
              type="button"
              onClick={skipNext}
              disabled={!isPlaying || currentChunkIndex >= totalChunks - 1}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Next sentence"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Speed Rate Cycle Pill */}
            <button
              type="button"
              onClick={handleCycleSpeed}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              title="Adjust reading speed"
            >
              <Gauge className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{rate}x</span>
            </button>

            {/* Re-read From Beginning Button */}
            <button
              type="button"
              onClick={handleRestart}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-teal-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Restart reading from top of page"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Minimize to Floating Pill Button */}
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Minimize reader"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {/* Close Voice Reader Button */}
            <button
              type="button"
              onClick={() => {
                stop();
                closeVoiceReader();
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Close voice reader"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};