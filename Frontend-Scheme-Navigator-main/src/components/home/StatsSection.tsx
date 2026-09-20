import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Sparkles, Info, ShieldCheck, Database, Languages } from 'lucide-react';

export const StatsSection: React.FC = () => {
  const { t } = useTranslation();

  const stats = [
    {
      icon: Database,
      value: '3,866+',
      label: t('stats.schemes'),
      note: t('stats.centralState'),
      color: 'from-emerald-300 via-teal-200 to-white',
    },
    {
      icon: ShieldCheck,
      value: '100%',
      label: t('stats.free'),
      note: t('stats.noMiddlemen'),
      color: 'from-cyan-300 via-teal-200 to-white',
    },
    {
      icon: Languages,
      value: '12+',
      label: t('trust.multilingual'),
      note: t('stats.nativeLanguages'),
      color: 'from-purple-200 via-indigo-200 to-white',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-slate-950 text-white py-12 lg:py-16 border-y border-teal-800/40">
      {/* Background Decorative Rings & Ambient Orbs */}
      <div className="absolute top-0 right-10 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div className="absolute inset-0 bg-dot-pattern opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-900/80 border border-teal-500/40 text-emerald-300 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('stats.scaleTrust')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {t('stats.empowering')}
          </h2>
          <p className="text-sm sm:text-base text-teal-100/80 leading-relaxed font-normal">
            {t('stats.coverageDesc')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="text-center p-7 rounded-3xl bg-teal-900/25 border border-teal-700/40 backdrop-blur-md hover:border-teal-400/70 hover:bg-teal-900/40 transition-all duration-300 group hover:-translate-y-1 shadow-lg"
              >
                <div className="w-10 h-10 mx-auto mb-4 rounded-2xl bg-teal-800/60 border border-teal-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div className={`text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.color} tracking-tight group-hover:scale-105 transition-transform`}>
                  {stat.value}
                </div>
                <div className="text-base font-extrabold text-white mt-2">
                  {stat.label}
                </div>
                <div className="text-xs text-teal-200/70 mt-1 font-medium">
                  {stat.note}
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer / Demo Notice */}
        <div className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-teal-200/70">
          <Info className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            {t('footer.disclaimer')}
          </span>
        </div>
      </div>
    </section>
  );
};
