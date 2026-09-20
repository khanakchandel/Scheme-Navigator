import React from 'react';
import { Scheme, UserProfile } from '../../types';
import { calculateSchemeMatch } from '../../services/matchingEngine';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

interface ExplainabilityBoxProps {
  scheme: Scheme;
  userProfile: UserProfile | null;
}

export const ExplainabilityBox: React.FC<ExplainabilityBoxProps> = ({
  scheme,
  userProfile,
}) => {
  const { t } = useTranslation();

  if (!userProfile) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 text-white p-6 sm:p-8 border border-teal-800/40 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>{t('scheme_detail.explainability_badge', undefined, 'Personalized Match Explainability')}</span>
        </div>
        <h3 className="text-xl font-bold text-white">
          {t('scheme_detail.explainability_prompt_title', undefined, 'Want to know if this scheme applies directly to you?')}
        </h3>
        <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
          {t('scheme_detail.explainability_prompt_desc', undefined, 'Complete our quick 2-minute eligibility survey to get an exact match breakdown, verified document checklist, and step-by-step guidance.')}
        </p>
        <Link
          to="/survey"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
        >
          <span>{t('scheme_detail.calculate_match_btn', undefined, 'Calculate My Personal Match')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const match = calculateSchemeMatch(scheme, userProfile);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 text-white p-6 sm:p-8 border border-teal-800/40 shadow-lg space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-800/60 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-800 border border-teal-600 flex items-center justify-center text-emerald-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              {t('scheme_detail.why_recommended_title', undefined, 'Why SchemeNavigator Recommended This')}
            </h3>
            <span className="text-xs text-teal-200">
              {t('scheme_detail.why_recommended_subtitle', undefined, 'Transparent explanation based on your active profile')}
            </span>
          </div>
        </div>

        <div className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
          {match.matchScore}% {t('scheme_detail.compatibility_badge', undefined, 'Profile Compatibility')}
        </div>
      </div>

      {/* 0-Based Score Tracking Ledger Table */}
      {match.factors && match.factors.length > 0 && match.matchScore > 0 && (
        <div className="p-4 rounded-2xl bg-black/30 border border-teal-800/60 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-teal-800/40 pb-2">
            <span className="font-extrabold uppercase tracking-wider text-emerald-400">
              Score Tracked From 0 Baseline
            </span>
            <span className="font-mono font-bold text-emerald-300">
              Total: {match.matchScore} / 100 pts
            </span>
          </div>

          <div className="space-y-2.5">
            {match.factors.slice(0, 4).map((f, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium">{f.criterion}</span>
                  <span className="font-mono font-bold text-emerald-400">
                    +{f.score} / {f.weight} pts
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                    style={{ width: `${Math.min(100, (f.score / f.weight) * 100)}%` }}
                  />
                </div>
                {f.explanation && (
                  <span className="text-[10px] text-teal-200/80 block">{f.explanation}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matched Reasons List */}
      <div className="space-y-2.5">
        {match.matchedReasons.map((reason, idx) => (
          <div key={idx} className="flex items-start gap-2.5 text-xs text-teal-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{reason}</span>
          </div>
        ))}
      </div>

      {/* Warnings / Exclusions if any */}
      {match.unmatchedWarnings.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-800/60 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{match.unmatchedWarnings[0]}</span>
        </div>
      )}

      {/* Disclaimer */}
      <div className="pt-2 text-[11px] text-teal-300/60 leading-relaxed border-t border-teal-800/40">
        {t('scheme_detail.compatibility_note', undefined, 'Note: The compatibility score is computed deterministically against publicly notified scheme guidelines. Final admission and disbursement decisions rest solely with the administrative authority.')}
      </div>
    </div>
  );
};
