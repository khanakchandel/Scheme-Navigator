import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  GraduationCap,
  Sprout,
  Briefcase,
  HeartHandshake,
  Compass,
  CheckCircle2,
  Lock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '../../store/appStore';

export const Footer: React.FC = () => {
  const { t, tp } = useTranslation();
  const { startTour } = useAppStore();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Top Banner with Core Philosophy */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-2">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
            {t('footer.coreTitle')}
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-white">
            {t('footer.tagline')}
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            {t('footer.brandDesc')}
          </p>
        </div>
      </div>


      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand & Compass Intro */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-800 border border-teal-600 flex items-center justify-center text-white">
                <Compass className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Scheme<span className="text-emerald-400">Navigator</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed pr-4">
              {t('footer.brandDesc')}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-emerald-400 border border-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('stats.free')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-teal-400 border border-slate-700">
                <Lock className="w-3.5 h-3.5" />
                {t('trust.privacyFirst')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-blue-400 border border-slate-700">
                <ExternalLink className="w-3.5 h-3.5" />
                {t('stats.direct')}
              </span>
            </div>
          </div>

          {/* Col 2: Popular Categories */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>{t('footer.categories')}</span>
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/explore?category=Education" className="hover:text-emerald-400 transition-colors flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                  <span>{tp('Education')}</span>
                </Link>
              </li>
              <li>
                <Link to="/explore?category=Agriculture" className="hover:text-emerald-400 transition-colors flex items-center gap-2">
                  <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{tp('Agriculture')}</span>
                </Link>
              </li>
              <li>
                <Link to="/explore?category=Business" className="hover:text-emerald-400 transition-colors flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{tp('Business')}</span>
                </Link>
              </li>
              <li>
                <Link to="/explore?category=Women%20%26%20Child" className="hover:text-emerald-400 transition-colors flex items-center gap-2">
                  <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
                  <span>{tp('Women & Child')}</span>
                </Link>
              </li>
              <li>
                <Link to="/explore?category=Healthcare" className="hover:text-emerald-400 transition-colors">
                  {tp('Healthcare')}
                </Link>
              </li>
              <li>
                <Link to="/explore?category=Social%20Security" className="hover:text-emerald-400 transition-colors">
                  {tp('Social Security')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Navigation */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              {t('footer.platform')}
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={startTour}
                  className="hover:text-emerald-300 transition-colors text-emerald-400 font-bold inline-flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('nav.tour')} ✨</span>
                </button>
              </li>
              <li>
                <Link to="/survey" className="hover:text-white transition-colors text-slate-300 font-medium">
                  → {t('nav.checkEligibility')}
                </Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">
                  {t('nav.explore')}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  {t('nav.howItWorks')}
                </Link>
              </li>
              <li>
                <Link to="/assistant" className="hover:text-white transition-colors">
                  {t('nav.aiAdvisor')}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  {t('nav.dashboard')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Transparency */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              {t('footer.transparency')}
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  {t('about.title')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  {t('privacy.title')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  {t('terms.title')}
                </Link>
              </li>
              <li>
                <Link to="/about#what-we-are-not" className="hover:text-white transition-colors">
                  {t('footer.transparency')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Prominent Legal Disclaimer Box */}
        <div className="mt-12 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs leading-relaxed text-slate-400">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200 block mb-1">
                {t('footer.disclaimer')}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            © {new Date().getFullYear()} SchemeNavigator. {t('footer.copyright')}
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSelector variant="footer" align="right" />
            <span>•</span>
            <Link to="/privacy" className="hover:text-slate-300">{t('privacy.title')}</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-slate-300">{t('terms.title')}</Link>
            <span>•</span>
            <Link to="/about" className="hover:text-slate-300">{t('nav.about')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
