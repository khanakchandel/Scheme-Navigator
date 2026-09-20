import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  Sparkles,
  Bot,
  Bookmark,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useTranslation } from '../../hooks/useTranslation';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { savedSchemeIds, handleCheckEligibility } = useAppStore();
  const { t } = useTranslation();

  const getShortNavLabel = (type: 'home' | 'schemes' | 'check' | 'ai' | 'saved') => {
    switch (type) {
      case 'home':
        return t('nav.home');
      case 'schemes':
        return t('nav.schemes');
      case 'check':
        return t('nav.checkEligibility').split(' ')[0] || 'Check';
      case 'ai':
        return 'Mitra AI';
      case 'saved':
        return t('nav.savedSchemes').split(' ')[0] || 'Saved';
    }
  };

  const navItems = [
    {
      to: '/',
      label: getShortNavLabel('home'),
      icon: Home,
      exact: true,
    },
    {
      to: '/explore',
      label: getShortNavLabel('schemes'),
      icon: Compass,
    },
    {
      action: () => handleCheckEligibility(navigate),
      label: getShortNavLabel('check'),
      isCenterAction: true,
      icon: Sparkles,
    },
    {
      to: '/assistant',
      label: getShortNavLabel('ai'),
      icon: Bot,
      isAi: true,
    },
    {
      to: '/dashboard',
      label: getShortNavLabel('saved'),
      icon: Bookmark,
      badge: savedSchemeIds.length > 0 ? savedSchemeIds.length : null,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 w-full max-w-full overflow-visible bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-4px_25px_rgba(0,0,0,0.1)] transition-colors duration-200 touch-manipulation"
    >
      <div className="grid grid-cols-5 items-center justify-around px-2 max-w-lg mx-auto">
        {navItems.map((item, idx) => {
          if (item.isCenterAction) {
            const isSurveyActive =
              location.pathname.startsWith('/survey') ||
              location.pathname.startsWith('/analyzing');

            return (
              <button
                key={idx}
                type="button"
                onClick={item.action}
                className="flex flex-col items-center justify-center -mt-5 group cursor-pointer focus:outline-hidden active:scale-95 transition-transform w-full min-w-0 px-0.5 select-none relative z-10"
              >
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-tr from-teal-600 via-teal-700 to-emerald-500 text-white flex items-center justify-center shadow-lg transition-all group-hover:scale-105 shrink-0 ring-4 ring-white dark:ring-slate-950 ${
                    isSurveyActive
                      ? 'shadow-teal-500/40 ring-offset-2 ring-offset-teal-600 dark:ring-offset-emerald-400'
                      : 'shadow-teal-950/30 dark:shadow-emerald-950/60'
                  }`}
                >
                  <Sparkles className="w-5.5 h-5.5 text-emerald-100 animate-pulse" />
                </div>
                <span className="text-[10px] font-black text-teal-800 dark:text-emerald-400 mt-1 tracking-tight w-full max-w-full text-center truncate px-0.5 block">
                  {item.label}
                </span>
              </button>
            );
          }

          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to!);

          const Icon = item.icon;

          return (
            <NavLink
              key={idx}
              to={item.to!}
              className={`flex flex-col items-center justify-center py-1 min-h-[46px] transition-all relative w-full min-w-0 px-0.5 select-none active:scale-95 ${
                isActive
                  ? 'text-teal-700 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active Indicator Top Pill */}
              {isActive && (
                <span className="absolute top-0 w-6 h-0.5 bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full" />
              )}

              <div className="relative shrink-0">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                />

                {/* AI Online Glow Dot */}
                {item.isAi && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
                )}

                {/* Saved Badge Counter */}
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 bg-teal-600 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-950">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[9px] sm:text-[10px] font-bold mt-1 tracking-tight w-full max-w-full text-center truncate px-0.5 block">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
