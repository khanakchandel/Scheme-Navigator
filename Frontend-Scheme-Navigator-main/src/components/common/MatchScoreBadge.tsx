import React, { useState } from 'react';
import { Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { MatchFactor } from '../../types';

interface MatchScoreBadgeProps {
  score: number;
  grade?: string;
  size?: 'sm' | 'md' | 'lg';
  factors?: MatchFactor[];
  showDetails?: boolean;
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({
  score,
  grade,
  size = 'md',
  factors = [],
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getScoreTheme = (val: number) => {
    if (val >= 85) {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-500/20',
        bar: 'bg-emerald-600',
        glow: 'text-emerald-700',
        label: 'High Potential Match',
      };
    }
    if (val >= 70) {
      return {
        bg: 'bg-teal-50 text-teal-800 border-teal-300 ring-teal-500/20',
        bar: 'bg-teal-600',
        glow: 'text-teal-700',
        label: 'Good Compatibility',
      };
    }
    if (val >= 50) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-500/20',
        bar: 'bg-amber-500',
        glow: 'text-amber-700',
        label: 'Moderate Match',
      };
    }
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-400/20',
      bar: 'bg-slate-500',
      glow: 'text-slate-700',
      label: 'General Match',
    };
  };

  const theme = getScoreTheme(score);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base font-semibold',
  };

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`inline-flex items-center gap-2 rounded-full border font-medium shadow-xs ring-2 transition-all cursor-pointer select-none ${theme.bg} ${sizeClasses[size]}`}
      >
        {/* Visual percentage ring or dot */}
        <span className="flex h-2 w-2 relative">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.bar}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.bar}`} />
        </span>

        <span className="font-bold tracking-tight">{score}% Match</span>
        {grade && <span className="hidden sm:inline text-xs opacity-85 font-normal">• {grade}</span>}
        <Info className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
      </div>

      {/* Interactive Explainability Tooltip */}
      {showTooltip && (
        <div className="absolute top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 z-50 w-72 sm:w-84 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 text-xs animate-in fade-in zoom-in-95 space-y-2.5">
          <div className="flex items-start justify-between pb-2 border-b border-slate-800">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Score Tracked From 0</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 font-mono font-bold text-xs border border-slate-700">
              {score} / 100
            </span>
          </div>

          <p className="text-slate-300 text-[11px] leading-relaxed">
            Starting from <strong>0 baseline</strong>, points are accumulated across statutory alignment factors:
          </p>

          {factors.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {factors.slice(0, 4).map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-slate-750">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate text-slate-200 font-medium">{f.criterion}</span>
                    {f.explanation && (
                      <span className="truncate text-[10px] text-slate-400">{f.explanation}</span>
                    )}
                  </div>
                  <span className={`font-mono font-bold shrink-0 ${f.status === 'matched' || f.score > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    +{f.score} pts
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">Score evaluated based on general public criteria.</div>
          )}

          <div className="p-2 rounded-xl bg-slate-800/80 text-[10.5px] text-amber-300/90 flex items-start gap-1.5 border border-slate-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Informational fit indicator. Official approval is governed by department verification.</span>
          </div>
        </div>
      )}
    </div>
  );
};
