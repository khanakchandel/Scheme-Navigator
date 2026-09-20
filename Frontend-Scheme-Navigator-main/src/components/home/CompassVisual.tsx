import React, { useState } from 'react';
import {
  GraduationCap,
  Sprout,
  Briefcase,
  Home,
  ArrowUpRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

export const CompassVisual: React.FC = () => {
  const { t, tp } = useTranslation();
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const satelliteCards = [
    {
      id: 'edu',
      title: t('visual.scholarshipsGrants', undefined, 'Scholarships & Grants'),
      badge: tp('Education'),
      match: `96% ${t('explore.matchScore', undefined, 'Match')}`,
      amount: tp('Up to ₹20,000/yr'),
      icon: GraduationCap,
      color: 'from-blue-600 via-indigo-600 to-indigo-700',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
      position: 'top-0 left-1 sm:top-1 sm:left-2',
      rotate: '-rotate-2',
      animClass: 'animate-float-slow',
      link: '/explore?category=Education',
    },
    {
      id: 'agri',
      title: t('visual.pmKisanSubsidies', undefined, 'PM-KISAN & Subsidies'),
      badge: tp('Agriculture'),
      match: `94% ${t('explore.matchScore', undefined, 'Match')}`,
      amount: tp('₹6,000/yr DBT'),
      icon: Sprout,
      color: 'from-emerald-500 via-teal-600 to-teal-800',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      position: 'top-0 right-1 sm:top-2 sm:right-2',
      rotate: 'rotate-3',
      animClass: 'animate-float-delayed',
      link: '/explore?category=Agriculture',
    },
    {
      id: 'biz',
      title: t('visual.mudraLoans', undefined, 'Mudra & MSME Loans'),
      badge: tp('Business'),
      match: `91% ${t('explore.matchScore', undefined, 'Match')}`,
      amount: tp('Collateral-Free ₹20L'),
      icon: Briefcase,
      color: 'from-purple-600 via-violet-600 to-indigo-800',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
      position: 'bottom-10 left-0 sm:bottom-3 sm:left-2',
      rotate: 'rotate-1',
      animClass: 'animate-float-subtle',
      link: '/explore?category=Business',
    },
    {
      id: 'housing',
      title: t('visual.puccaHouseSubsidy', undefined, 'Pucca House Subsidy'),
      badge: tp('Housing'),
      match: `88% ${t('explore.matchScore', undefined, 'Match')}`,
      amount: tp('₹1.30 Lakh Grant'),
      icon: Home,
      color: 'from-amber-500 via-orange-600 to-red-600',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      position: 'bottom-0 right-1 sm:bottom-1 sm:right-2',
      rotate: '-rotate-2',
      animClass: 'animate-float-subtle-alt',
      link: '/explore?category=Housing',
    },
  ];

  return (
    <>
      {/* Mobile App Radar & Quick Entitlements Widget (sm:hidden) */}
      <div className="sm:hidden w-full max-w-sm mx-auto p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-teal-500/20 dark:border-teal-500/30 shadow-xl shadow-teal-950/5 space-y-3 relative overflow-hidden">
        {/* Subtle Ambient Background Light */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Mobile Radar Status Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-800 to-slate-950 flex items-center justify-center text-emerald-300 shadow-xs">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{t('visual.liveRadar', undefined, 'Live Welfare Radar')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {t('visual.verifiedEntitlements', undefined, '3,866 Verified Entitlements')}
              </span>
            </div>
          </div>
          <Link
            to="/explore"
            className="text-[11px] font-extrabold text-teal-800 dark:text-emerald-400 hover:underline flex items-center gap-0.5 active:scale-95 transition-transform"
          >
            <span>{t('visual.exploreAll', undefined, 'Explore All')}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 2x2 Grid of Mobile Quick Scheme Cards */}
        <div className="grid grid-cols-2 gap-2">
          {satelliteCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                to={card.link}
                className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 active:scale-95 transition-all flex flex-col justify-between space-y-2.5 group shadow-3xs hover:border-teal-400 dark:hover:border-teal-600"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded-md border border-emerald-300/50 dark:border-emerald-800">
                    {card.match}
                  </span>
                </div>

                <div>
                  <h4 className="text-[11.5px] font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-700 dark:group-hover:text-teal-300">
                    {card.title}
                  </h4>
                  <p className="text-[10px] text-teal-800 dark:text-emerald-400 font-bold truncate mt-0.5">
                    {card.amount}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Live Footnote */}
        <div className="pt-0.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium px-1">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>{t('visual.updatedHourly', undefined, 'Updated hourly from data.gov.in')}</span>
          </span>
          <span className="text-teal-700 dark:text-emerald-400 font-bold">{t('cta.free', undefined, '100% Free')}</span>
        </div>
      </div>

      {/* Desktop Full 3D Gyroscope Compass & Floating Satellites (hidden sm:flex) */}
      <div className="hidden sm:flex relative w-full max-w-xl mx-auto h-[380px] sm:h-[430px] items-center justify-center select-none">
        {/* Background Ambient Glow & Multi-Ring Gyroscope */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Deep ambient blur sphere */}
          <div className="absolute w-[280px] sm:w-[340px] h-[280px] sm:h-[340px] rounded-full bg-gradient-to-tr from-teal-400/25 via-emerald-300/20 to-cyan-300/20 dark:from-teal-500/15 dark:via-emerald-500/10 dark:to-cyan-500/10 blur-3xl animate-glow-pulse" />

          {/* Outer Orbit Dashed Ring */}
          <div className="w-[340px] sm:w-[400px] h-[340px] sm:h-[400px] rounded-full border border-teal-300/40 dark:border-teal-500/20 border-dashed animate-spin-slow opacity-70" />
          
          {/* Middle Counter-Rotating Ring with Nodes */}
          <div className="absolute w-[260px] sm:w-[310px] h-[260px] sm:h-[310px] rounded-full border border-emerald-400/30 dark:border-emerald-500/20 animate-spin-reverse-slow">
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/80" />
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-teal-400 shadow-xs shadow-teal-400/80" />
          </div>
          
          {/* Radar Sweep Effect */}
          <div className="absolute w-[250px] sm:w-[300px] h-[250px] sm:h-[300px] rounded-full overflow-hidden opacity-30 animate-radar">
            <div className="w-1/2 h-1/2 bg-gradient-to-br from-emerald-400/50 via-teal-300/25 to-transparent origin-bottom-right rounded-tl-full" />
          </div>

          {/* Fine crosshairs */}
          <div className="absolute w-[300px] sm:w-[360px] h-[1px] bg-gradient-to-r from-transparent via-teal-400/20 to-transparent" />
          <div className="absolute h-[300px] sm:h-[360px] w-[1px] bg-gradient-to-b from-transparent via-teal-400/20 to-transparent" />
        </div>

        {/* Central Compass Instrument */}
        <div className="relative z-10 w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 p-2 shadow-2xl shadow-teal-950/60 border-4 border-teal-500/50 flex items-center justify-center group ring-8 ring-teal-900/20">
          {/* Dial Ticks & Radial Coordinates */}
          <div className="absolute inset-2 rounded-full border border-teal-400/30 flex items-center justify-center bg-radial from-teal-950/80 to-slate-950">
            {/* Cardinal Directions */}
            <span className="absolute top-2 text-[11px] font-black text-emerald-300 tracking-widest drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]">N</span>
            <span className="absolute bottom-1.5 text-[9px] font-bold text-teal-400/60">S</span>
            <span className="absolute left-2 text-[9px] font-bold text-teal-400/60">W</span>
            <span className="absolute right-2 text-[9px] font-bold text-teal-400/60">E</span>

            {/* Compass Needle Assembly */}
            <div className="relative w-full h-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-1000 ease-out">
              {/* Compass Diamond Needle */}
              <div className="w-8 sm:w-10 h-28 sm:h-34 relative flex flex-col items-center">
                {/* North Pointer (Neon Emerald) */}
                <div className="w-0 h-0 border-l-[13px] border-l-transparent border-r-[13px] border-r-transparent border-b-[56px] sm:border-b-[68px] border-b-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                {/* South Pointer (Teal / Slate) */}
                <div className="w-0 h-0 border-l-[13px] border-l-transparent border-r-[13px] border-r-transparent border-t-[56px] sm:border-t-[68px] border-t-teal-700/80" />
              </div>

              {/* Center Pivot Jewel */}
              <div className="absolute w-7 h-7 rounded-full bg-slate-950 border-2 border-emerald-400 shadow-md shadow-emerald-400/40 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white shadow-xs animate-ping opacity-75" />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-200" />
              </div>
            </div>
          </div>

          {/* Center Badge Floating Label */}
          <div className="absolute -bottom-4 px-3 py-1 rounded-full bg-gradient-to-r from-teal-900 to-slate-950 backdrop-blur-md border border-emerald-400/50 text-[10px] font-extrabold text-emerald-300 shadow-xl flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-300 animate-pulse" />
            <span>{t('visual.intelligentCompass', undefined, 'Intelligent Compass')}</span>
          </div>
        </div>

        {/* Floating Connected Scheme Cards */}
        {satelliteCards.map((card) => {
          const isHovered = activeCard === card.id;
          const Icon = card.icon;

          return (
            <Link
              key={card.id}
              to={card.link}
              onMouseEnter={() => setActiveCard(card.id)}
              onMouseLeave={() => setActiveCard(null)}
              className={`absolute ${card.position} ${card.rotate} ${card.animClass} z-20 transition-all duration-300 group`}
            >
              <div
                className={`p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border transition-all duration-300 ${
                  isHovered
                    ? 'scale-105 -translate-y-1.5 shadow-2xl border-teal-500 ring-4 ring-teal-500/20 bg-white dark:bg-slate-900'
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-lg hover:shadow-2xl'
                } w-44 sm:w-52`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1.5 min-w-0">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border truncate min-w-0 ${card.badgeBg}`}>
                    {card.badge}
                  </span>
                  <span className="text-[9.5px] font-extrabold text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded-md border border-emerald-300/60 dark:border-emerald-800 shadow-3xs shrink-0">
                    {card.match}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11.5px] font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">
                      {card.amount}
                    </p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all ml-auto shrink-0" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
};
