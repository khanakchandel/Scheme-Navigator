import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CompassVisual } from './CompassVisual';
import { useAppStore } from '../../store/appStore';
import { useTranslation } from '../../hooks/useTranslation';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { handleCheckEligibility } = useAppStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/70 via-slate-50/50 to-white dark:from-slate-950 dark:via-slate-900/90 dark:to-slate-950 pt-4 pb-8 sm:pt-8 sm:pb-12 lg:pt-10 lg:pb-14 border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      {/* Background Decorative Ambient Lighting & Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 dark:opacity-20 pointer-events-none" />
      <div className="absolute top-6 left-1/4 w-[400px] h-[400px] bg-teal-300/20 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div className="absolute top-10 right-1/4 w-[380px] h-[380px] bg-emerald-300/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center w-full min-w-0">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 min-w-0 w-full text-center lg:text-left space-y-4 sm:space-y-5">
            {/* Category / Compass Live Status Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 border border-teal-300/80 dark:border-teal-700/60 text-teal-950 dark:text-teal-200 text-[11px] sm:text-xs font-bold shadow-xs backdrop-blur-md max-w-full">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="tracking-wide truncate sm:hidden">Official Scheme Directory</span>
              <span className="tracking-wide truncate hidden sm:inline">{t('hero.badge')}</span>
              <span className="px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/80 text-teal-800 dark:text-teal-300 text-[10px] font-extrabold shrink-0">
                3,866+
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-[1.25] sm:leading-[1.2]">
              {t('hero.title1')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-700 dark:from-teal-400 dark:via-emerald-400 dark:to-cyan-400">
                {t('hero.title2')}
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-xs sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              {t('hero.subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 sm:gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => handleCheckEligibility(navigate)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-950 hover:from-teal-800 hover:to-slate-900 text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-xl shadow-teal-900/25 hover:shadow-teal-900/35 transition-all duration-300 active:scale-[0.98] group cursor-pointer border border-teal-500/30"
              >
                <Compass className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-300 group-hover:rotate-45 transition-transform duration-500" />
                <span>{t('hero.checkEligibility')}</span>
                <ArrowRight className="w-4 h-4 text-teal-200 group-hover:translate-x-1 transition-transform" />
              </button>

              <Link
                to="/explore"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-white/95 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xs hover:shadow-md transition-all backdrop-blur-md active:scale-[0.98]"
              >
                <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>{t('hero.exploreSchemes')}</span>
              </Link>
            </div>

            {/* Trust Badges below CTA */}
            <div className="pt-1 flex items-center justify-center lg:justify-start gap-1.5 sm:gap-3 text-[10.5px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              <div className="flex items-center gap-1 bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="sm:hidden">Verified Info</span>
                <span className="hidden sm:inline">{t('hero.verified')}</span>
              </div>
              <div className="flex items-center gap-1 bg-teal-50/80 dark:bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-200/80 dark:border-teal-800/60 text-teal-900 dark:text-teal-300 shrink-0">
                <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="sm:hidden">100% Private</span>
                <span className="hidden sm:inline">{t('hero.secure')}</span>
              </div>
              <div className="flex items-center gap-1 bg-amber-50/80 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="sm:hidden">Step-by-Step</span>
                <span className="hidden sm:inline">{t('hero.guidance')}</span>
              </div>
            </div>

            {/* Citizen Persona Quick Bar */}
            <div className="pt-3.5 border-t border-slate-200/80 dark:border-slate-800 w-full min-w-0">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-400 block mb-2 tracking-wide text-center lg:text-left">
                {t('hero.popularPaths')}
              </span>
              <div className="w-full min-w-0 flex items-center justify-start sm:justify-center lg:justify-start gap-1.5 overflow-x-auto pb-1.5 no-scrollbar sm:flex-wrap overscroll-x-contain touch-pan-x -mx-1 px-1">
                {[
                  { label: t('hero.students'), link: '/explore?category=Education' },
                  { label: t('hero.farmers'), link: '/explore?category=Agriculture' },
                  { label: t('hero.entrepreneurs'), link: '/explore?category=Business' },
                  { label: t('hero.women'), link: '/explore?category=Women%20%26%20Child' },
                  { label: t('hero.jobSeekers'), link: '/explore?category=Employment' },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.link}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 hover:text-teal-950 dark:text-slate-300 dark:hover:text-teal-300 border border-slate-200/90 dark:border-slate-800 hover:border-teal-400 text-xs font-bold transition-all shadow-3xs shrink-0 whitespace-nowrap active:scale-95"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {/* Right Column: Interactive Compass & Scheme Visual */}
          <div className="lg:col-span-5 min-w-0 w-full flex items-center justify-center">
            <CompassVisual />
          </div>
        </div>
      </div>
    </section>
  );
};
