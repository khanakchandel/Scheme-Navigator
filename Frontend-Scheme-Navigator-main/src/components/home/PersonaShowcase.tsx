import React, { useState } from 'react';
import { AUDIENCE_PERSONAS } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import {
  GraduationCap,
  Sprout,
  Rocket,
  Heart,
  Briefcase,
  Home,
  Shield,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveUserProfile, DEFAULT_DEMO_PROFILE } from '../../services/storageService';

export const PersonaShowcase: React.FC = () => {
  const [selectedPersonaId, setSelectedPersonaId] = useState('students');
  const { t, tp } = useTranslation();
  const navigate = useNavigate();

  const getPersonaIcon = (icon: string) => {
    switch (icon) {
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" />;
      case 'Sprout':
        return <Sprout className="w-5 h-5" />;
      case 'Rocket':
        return <Rocket className="w-5 h-5" />;
      case 'Heart':
        return <Heart className="w-5 h-5" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5" />;
      case 'Home':
        return <Home className="w-5 h-5" />;
      case 'Shield':
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const currentPersona = AUDIENCE_PERSONAS.find((p) => p.id === selectedPersonaId) || AUDIENCE_PERSONAS[0];

  const handleLaunchWithPersona = () => {
    const sample = currentPersona.sampleProfile as Partial<typeof DEFAULT_DEMO_PROFILE>;
    const profile = {
      ...DEFAULT_DEMO_PROFILE,
      ...sample,
    };
    saveUserProfile(profile);
    navigate('/recommendations');
  };

  return (
    <section className="py-12 lg:py-16 bg-white dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800 relative overflow-hidden w-full max-w-full transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>{t('persona.title')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            {t('persona.exploreProfiles')}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            {t('persona.subtitle')}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="w-full min-w-0 flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-3 no-scrollbar overscroll-x-contain touch-pan-x">
          {AUDIENCE_PERSONAS.map((p) => {
            const isSelected = p.id === selectedPersonaId;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPersonaId(p.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-teal-800 via-teal-900 to-slate-950 text-white shadow-lg shadow-teal-950/20 scale-102 border border-teal-500/40'
                    : 'bg-slate-100/80 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white border border-transparent dark:border-slate-800'
                }`}
              >
                {getPersonaIcon(p.icon)}
                <span>{tp(p.label)}</span>
              </button>
            );
          })}
        </div>

        {/* Active Persona Spotlight Card */}
        <div className="mt-6 rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950 to-slate-950 text-white p-6 sm:p-10 shadow-2xl border border-teal-700/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-800/80 border border-teal-500/50 text-emerald-300 text-xs font-bold shadow-xs">
                <span>{tp(currentPersona.label)}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                {tp(currentPersona.headline)}
              </h3>
              <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed font-normal">
                {tp(currentPersona.description)}
              </p>

              <div className="pt-3">
                <span className="text-xs font-extrabold text-teal-300 uppercase tracking-wider block mb-3">
                  {t('explore.benefits')}:
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {currentPersona.keySchemes.map((scheme, sIdx) => (
                    <span
                      key={sIdx}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-900/90 border border-teal-600/60 text-xs font-semibold text-white shadow-xs backdrop-blur-md"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{tp(scheme)}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-teal-900/30 backdrop-blur-xl p-7 rounded-3xl border border-teal-500/40 space-y-5 text-center lg:text-left shadow-xl">
              <div>
                <span className="text-xs text-emerald-300 font-bold tracking-wide uppercase">{t('hero.guidance')}</span>
                <div className="text-lg font-black text-white mt-1">
                  {t('persona.oneClickMatching')}
                </div>
              </div>

              <div className="space-y-2 text-xs text-teal-100/90 bg-slate-950/70 p-4 rounded-2xl border border-teal-800/60 text-left font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>{t('stats.free')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>{t('trust.privacyFirst')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>{t('stats.direct')}</span>
                </div>
              </div>

              <button
                onClick={handleLaunchWithPersona}
                className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-950/50 hover:shadow-2xl transition-all duration-300 cursor-pointer active:scale-[0.98]"
              >
                <span>{t('hero.exploreSchemes')} ({tp(currentPersona.label)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
