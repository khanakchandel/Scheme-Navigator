import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import {
  UserCheck,
  Cpu,
  FileText,
  ExternalLink,
  ArrowRight,
  Compass,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HowItWorks: React.FC = () => {
  const { t } = useTranslation();

  const steps = [
    {
      step: '01',
      title: t('howItWorks.step1Title'),
      description: t('howItWorks.step1Desc'),
      icon: UserCheck,
      color: 'from-teal-600 to-emerald-600',
      highlight: t('survey.stepPersonal'),
    },
    {
      step: '02',
      title: t('howItWorks.step2Title'),
      description: t('howItWorks.step2Desc'),
      icon: Cpu,
      color: 'from-blue-600 to-indigo-600',
      highlight: t('explore.matchScore'),
    },
    {
      step: '03',
      title: t('howItWorks.step3Title'),
      description: t('howItWorks.step3Desc'),
      icon: FileText,
      color: 'from-amber-600 to-orange-600',
      highlight: t('detail.documentsTitle'),
    },
    {
      step: '04',
      title: t('explore.applyNow'),
      description: t('detail.officialPortalDisclaimer'),
      icon: ExternalLink,
      color: 'from-purple-600 to-pink-600',
      highlight: t('stats.direct'),
    },
  ];

  return (
    <section id="how-it-works" className="py-12 lg:py-16 bg-gradient-to-b from-white via-slate-50/70 to-slate-100/50 dark:from-slate-950 dark:via-slate-900/80 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800 relative overflow-hidden w-full max-w-full transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-teal-200/15 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full min-w-0">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100/90 dark:bg-teal-950/60 text-teal-950 dark:text-teal-300 text-xs font-bold border border-teal-300 dark:border-teal-800 shadow-2xs">
            <Compass className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <span>{t('howItWorks.badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            {t('howItWorks.title')}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        {/* 4 Connected Step Cards with visual connection track */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {/* Subtle connection line for desktop */}
          <div className="hidden lg:block absolute top-20 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-teal-300 via-blue-300 via-amber-300 to-purple-300 dark:opacity-40 z-0 pointer-events-none" />

          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative z-10 rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 hover:border-teal-400 dark:hover:border-teal-600"
              >
                {/* Step Header */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform duration-300`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-2xl font-black text-slate-200 dark:text-slate-700 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-teal-950 dark:group-hover:text-teal-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Step Footer Badge */}
                <div className="pt-4 mt-5 border-t border-slate-100 dark:border-slate-800">
                  <span className="inline-flex items-center text-xs font-bold text-teal-900 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-xl border border-teal-200/80 dark:border-teal-800/80 shadow-3xs">
                    ✓ {item.highlight}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Flow CTA */}
        <div className="mt-10 text-center">
          <Link
            to="/survey"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-950 hover:from-teal-800 hover:to-slate-900 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-teal-900/25 hover:shadow-xl transition-all duration-200 active:scale-[0.98] group cursor-pointer"
          >
            <span>{t('hero.checkEligibility')}</span>
            <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};
