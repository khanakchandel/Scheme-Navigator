import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { CompassLogo } from './CompassLogo';
import {
  Bookmark,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Compass,
  Moon,
  Sun,
  Volume2,
  Store,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useTranslation } from '../../hooks/useTranslation';
import { LanguageSelector } from './LanguageSelector';
import { KendraFinderModal } from '../kendra/KendraFinderModal';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isKendraModalOpen, setIsKendraModalOpen] = useState(false);

  const { savedSchemeIds, handleCheckEligibility, startTour, theme, toggleTheme, isVoiceReaderOpen, toggleVoiceReader } = useAppStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleHowItWorksClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (location.pathname === '/' || location.pathname === '') {
      const element = document.getElementById('how-it-works');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById('how-it-works');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full max-w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors duration-200">
      <div className="w-full max-w-7xl 2xl:max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-4 xl:px-6 2xl:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20 gap-2 xl:gap-4 min-w-0">
          {/* Brand Logo */}
          <div className="shrink-0 flex items-center">
            <CompassLogo size="sm" />
          </div>

          {/* Center Navigation Links - Clean, open, direct */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 2xl:gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                }`
              }
            >
              {t('nav.home')}
            </NavLink>

            <NavLink
              id="nav-explore"
              to="/explore"
              className={({ isActive }) =>
                `px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                }`
              }
            >
              {t('nav.explore', undefined, 'Explore Schemes')}
            </NavLink>

            <a
              href="#how-it-works"
              onClick={handleHowItWorksClick}
              className="px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
            >
              {t('nav.howItWorks')}
            </a>

            <NavLink
              id="nav-ai-advisor"
              to="/assistant"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100/70'
                }`
              }
            >
              <Sparkles className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-emerald-500 animate-pulse shrink-0" />
              <span>{t('nav.aiAdvisor')}</span>
            </NavLink>

            <NavLink
              id="nav-kendra-finder"
              to="/kendra-finder"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                }`
              }
            >
              <Store className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-teal-600 dark:text-emerald-400 shrink-0" />
              <span>{t('nav.kendraFinder', undefined, 'Kendra Finder')}</span>
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                }`
              }
            >
              {t('nav.about')}
            </NavLink>
          </nav>

          {/* Right Actions & Utilities - Seamless, cohesive arrangement */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0">
            {/* Interactive Tour Button (Wide desktop) */}
            <button
              type="button"
              onClick={startTour}
              className="hidden 2xl:flex p-1.5 xl:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Take interactive tour"
              aria-label="Interactive Tour"
            >
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
            </button>

            {/* Universal Voice Reader */}
            <button
              type="button"
              onClick={toggleVoiceReader}
              className={`p-1.5 xl:p-2 rounded-xl transition-all cursor-pointer ${
                isVoiceReaderOpen
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Listen to this page (Voice Reader)"
              aria-label="Toggle Page Voice Reader"
            >
              <Volume2 className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
            </button>

            {/* Language Selector Dropdown */}
            <LanguageSelector variant="compact" align="right" />

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 xl:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Bookmarks Save Icon (Navigates to Saved Schemes / Dashboard) */}
            <Link
              id="nav-saved-schemes"
              to="/dashboard"
              className="relative p-2 text-slate-700 dark:text-slate-200 hover:text-teal-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title={t('nav.savedSchemes', undefined, 'Saved Schemes & Tracker')}
            >
              <Bookmark className="w-5 h-5" />
              {savedSchemeIds.length > 0 && (
                <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[17px] h-[17px] text-[9.5px] font-black text-white bg-teal-700 dark:bg-emerald-600 rounded-full px-1 shadow-xs ring-2 ring-white dark:ring-slate-950">
                  {savedSchemeIds.length}
                </span>
              )}
            </Link>

            {/* Check Eligibility CTA Button - Guaranteed visibility */}
            <button
              id="nav-check-eligibility"
              type="button"
              onClick={() => handleCheckEligibility(navigate)}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer group whitespace-nowrap shrink-0 ml-1"
            >
              <Compass className="w-4 h-4 text-emerald-300 group-hover:rotate-45 transition-transform duration-300 shrink-0" />
              <span>{t('nav.check', undefined, 'Check')}</span>
            </button>
          </div>

          {/* Mobile & Tablet Controls */}
          <div className="flex lg:hidden items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Tablet Check Eligibility Button */}
            <button
              type="button"
              onClick={() => handleCheckEligibility(navigate)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 cursor-pointer shrink-0"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>{t('nav.check', undefined, 'Check')}</span>
            </button>

            {/* Theme Toggle on mobile bar */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 active:scale-95 transition-all shrink-0 cursor-pointer"
              aria-label="Toggle Theme"
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
              )}
            </button>

            {/* Compact Language Selector */}
            <LanguageSelector variant="compact" align="right" className="shrink-0" />

            {/* Mobile Drawer Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:outline-hidden cursor-pointer active:scale-95 transition-all shrink-0"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2.5 animate-in slide-in-from-top-2 duration-200 shadow-xl max-w-full overflow-hidden">
          <div className="space-y-1">
            <NavLink
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-emerald-300 border border-teal-200/60 dark:border-teal-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`
              }
            >
              <span>{t('nav.home')}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>

            <NavLink
              to="/explore"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-emerald-300 border border-teal-200/60 dark:border-teal-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`
              }
            >
              <span>{t('nav.explore')}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>

            <NavLink
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-emerald-300 border border-teal-200/60 dark:border-teal-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
                <span>{t('nav.savedSchemes', undefined, 'Saved Schemes & Tracker')}</span>
                {savedSchemeIds.length > 0 && (
                  <span className="px-2 py-0.5 bg-teal-800 text-white rounded-full text-[10px] font-bold">
                    {savedSchemeIds.length}
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>

            <a
              href="#how-it-works"
              onClick={handleHowItWorksClick}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
            >
              <span>{t('nav.howItWorks')}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>

            <NavLink
              to="/assistant"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-teal-900 dark:bg-teal-800 text-white shadow-xs'
                    : 'bg-teal-50 dark:bg-emerald-950/50 text-teal-900 dark:text-emerald-300 border border-teal-200/60 dark:border-emerald-700/60'
                }`
              }
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>{t('nav.aiAdvisor')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>

            <NavLink
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-emerald-300 border border-teal-200/60 dark:border-teal-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`
              }
            >
              <span>{t('nav.about')}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>

            <NavLink
              to="/kendra-finder"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-emerald-300 border border-teal-200/60 dark:border-teal-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
                <span>{t('nav.kendraFinder', undefined, 'Kendra Finder (CSC / e-Mitra)')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>

            {/* Mobile Voice Reader Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                toggleVoiceReader();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
                <span>{isVoiceReaderOpen ? 'Close Voice Reader' : 'Listen to this page (Voice Reader)'}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Mobile Interactive Tour Trigger */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                startTour();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
                <span>Take Interactive Tour</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Mobile CTA */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleCheckEligibility(navigate);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-700 to-emerald-700 text-white font-black text-sm rounded-xl shadow-md cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>{t('nav.checkEligibility')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Kendra Finder Modal Mount */}
      <KendraFinderModal
        isOpen={isKendraModalOpen}
        onClose={() => setIsKendraModalOpen(false)}
      />
    </header>
  );
};
