import React from 'react';
import { CheckCircle2, Lock, Clock, Compass, Sparkles } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const TrustStrip: React.FC = () => {
  const { t } = useTranslation();

  const pillars = [
    {
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-700',
      bgGlow: 'group-hover:border-emerald-400/60 group-hover:shadow-emerald-900/10',
      title: t('trust.officialData'),
      description: t('trust.officialDataDesc'),
    },
    {
      icon: Lock,
      color: 'from-teal-600 to-cyan-700',
      bgGlow: 'group-hover:border-teal-400/60 group-hover:shadow-teal-900/10',
      title: t('trust.privacyFirst'),
      description: t('trust.privacyFirstDesc'),
    },
    {
      icon: Clock,
      color: 'from-blue-600 to-indigo-700',
      bgGlow: 'group-hover:border-blue-400/60 group-hover:shadow-blue-900/10',
      title: t('trust.multilingual'),
      description: t('trust.multilingualDesc'),
    },
    {
      icon: Compass,
      color: 'from-amber-500 to-orange-600',
      bgGlow: 'group-hover:border-amber-400/60 group-hover:shadow-amber-900/10',
      title: t('trust.freeAccess'),
      description: t('trust.freeAccessDesc'),
    },
  ];

  return (
    <section className="bg-slate-50/60 dark:bg-slate-950/80 py-8 sm:py-10 border-b border-slate-200/80 dark:border-slate-800 relative overflow-hidden w-full max-w-full transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className={`flex items-start gap-3.5 p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group ${pillar.bgGlow}`}
              >
                <div className={`p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br ${pillar.color} text-white shadow-md shadow-slate-900/10 shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-teal-950 dark:group-hover:text-teal-300 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
