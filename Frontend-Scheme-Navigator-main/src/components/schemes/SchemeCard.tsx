import React, { useMemo } from 'react';
import { SchemeMatchResult } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { MatchScoreBadge } from '../common/MatchScoreBadge';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building,
  MapPin,
  Sparkles,
  Info,
  ExternalLink,
} from 'lucide-react';
import { isSchemeSaved, toggleSaveScheme } from '../../services/storageService';
import { getSafeOfficialUrl } from '../common/ExternalPortalModal';
import { useTranslation } from '../../hooks/useTranslation';
import { translateSchemeContent } from '../../utils/schemeTranslator';
import { DeadlineTicker } from '../calendar/DeadlineTicker';

interface SchemeCardProps {
  matchResult: SchemeMatchResult;
  onSaveChange?: () => void;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({ matchResult, onSaveChange }) => {
  const { t, tp, tState, langCode } = useTranslation();
  const { scheme, matchScore, matchGrade, matchedReasons, unmatchedWarnings, factors, whyGood, toNote } = matchResult;
  
  const localizedScheme = useMemo(() => {
    if (!scheme) return scheme;
    return translateSchemeContent(scheme, langCode);
  }, [scheme, langCode]);
  const activeScheme = localizedScheme || scheme;

  const isSaved = isSchemeSaved(activeScheme?.id || activeScheme?.slug);
  const mainBenefit = Array.isArray(activeScheme?.benefits) ? activeScheme.benefits[0] : undefined;
  const coveredStates = Array.isArray(activeScheme?.coveredStates) ? activeScheme.coveredStates : ['All India'];
  const isAllIndia = coveredStates.includes('All India') || coveredStates.length === 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (activeScheme) {
      toggleSaveScheme(activeScheme);
      if (onSaveChange) onSaveChange();
    }
  };

  if (!activeScheme) return null;

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 hover:border-teal-400 dark:hover:border-teal-600">
      <div className="space-y-4">
        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill type="category" value={activeScheme.category || 'General'} size="sm" />
            <StatusPill type="level" value={activeScheme.level || 'Central'} size="sm" />
            <DeadlineTicker scheme={activeScheme} variant="badge" />
          </div>

          <div className="flex items-center gap-2">
            <MatchScoreBadge score={matchScore} grade={matchGrade} factors={factors} size="sm" />
            <button
              onClick={handleToggle}
              className={`p-2 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isSaved
                  ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
              title={isSaved ? t('explore.saved') : t('explore.save')}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-teal-700 dark:fill-teal-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Scheme Name & Department */}
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-teal-900 dark:group-hover:text-teal-400 transition-colors leading-snug line-clamp-1">
            <Link to={`/schemes/${activeScheme.slug || activeScheme.id}`}>{activeScheme.name}</Link>
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{activeScheme.verification?.ministryOrAuthority || activeScheme.verification?.sourceDepartment || 'Government Authority'}</span>
          </div>
        </div>

        {/* Tagline / Plain Language Summary */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 font-normal">
          {activeScheme.shortDescription || activeScheme.tagline}
        </p>

        {/* Primary Benefit Callout */}
        {mainBenefit && (
          <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/60 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold text-teal-900 dark:text-teal-300 uppercase tracking-wider block">
                {t('explore.benefits')}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm block mt-0.5">
                {mainBenefit.amountOrValue || (mainBenefit as any).amount || mainBenefit.title}
              </span>
              {mainBenefit.description && (
                <span className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 font-normal">
                  {mainBenefit.description}
                </span>
              )}
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-teal-100 dark:bg-teal-900 text-[10px] font-bold text-teal-950 dark:text-teal-200 shrink-0 border border-teal-200 dark:border-teal-800">
              {tp(mainBenefit.type || 'Benefit')}
            </span>
          </div>
        )}

        {/* AI Personalized Recommendation Highlight */}
        {whyGood && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">AI Recommendation Insight</span>
              <p className="leading-snug text-emerald-900 dark:text-emerald-200 font-medium">{whyGood}</p>
            </div>
          </div>
        )}

        {/* 0-Based Score Matching Tracking Ledger */}
        {factors && factors.length > 0 && matchScore > 0 && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Score Tracked From 0
              </span>
              <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs">
                {matchScore} / 100 pts
              </span>
            </div>

            {/* 4-Factor Breakdown Pills */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {factors.slice(0, 4).map((f, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between shadow-2xs"
                  title={`${f.criterion}: ${f.explanation || ''}`}
                >
                  <span className="truncate pr-1 text-slate-600 dark:text-slate-400 font-medium">
                    {f.criterion === 'Occupation Alignment'
                      ? '💼 Occupation'
                      : f.criterion === 'Age & Life Stage'
                      ? '🎂 Age / Stage'
                      : f.criterion === 'State Location'
                      ? '📍 Location'
                      : '💰 Economic'}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 font-mono">
                    +{f.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* "Why This Matches" Explainability Signals */}
        {matchedReasons && matchedReasons.length > 0 && !whyGood && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              {t('recommendations.whyEligible')}
            </span>
            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {matchedReasons.slice(0, 2).map((reason, rIdx) => (
                <li key={rIdx} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-tight">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings / Action Note */}
        {unmatchedWarnings && unmatchedWarnings.length > 0 ? (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-tight font-medium">{unmatchedWarnings[0]}</span>
          </div>
        ) : toNote ? (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
            <span className="leading-tight font-medium">{toNote}</span>
          </div>
        ) : null}
      </div>

      {/* Footer CTAs */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate max-w-[130px]">
            {isAllIndia ? tState('All India') : coveredStates.map((s) => tState(s)).join(', ')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getSafeOfficialUrl(scheme)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-teal-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 text-xs font-bold transition-all cursor-pointer shadow-3xs"
            title="Open official government portal directly"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Portal</span>
            <ExternalLink className="w-3 h-3 text-teal-600 dark:text-teal-400" />
          </a>

          <Link
            to={`/schemes/${scheme.slug || scheme.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-700 to-teal-900 hover:from-teal-800 hover:to-slate-950 text-white text-xs font-extrabold shadow-sm hover:shadow-md transition-all group-hover:scale-102"
          >
            <span>{t('explore.viewDetails')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
