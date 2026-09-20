import React from 'react';
import { ShieldCheck, Lock, EyeOff, Server, Trash2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export const PrivacyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-slate-50/80 dark:bg-slate-950 min-h-screen py-10 sm:py-16 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <Lock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>{t('privacy.badge', undefined, 'Privacy & Data Security')}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('privacy.mainHeading', undefined, 'Your Privacy Is Our Core Architecture')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {t('privacy.mainSubtitle', undefined, "Discovering public benefits shouldn't come at the cost of your personal privacy. Here is our solemn commitment to data minimization.")}
          </p>
        </div>

        {/* 4 Privacy Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('privacy.pillar1Title', undefined, 'Data Minimization')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('privacy.pillar1Desc', undefined, 'We never ask for sensitive personal identification cards like full Aadhaar numbers, pancard, income and caste certificates, or biometric credentials. Only generalized demographic signals (e.g. age range, state) are requested.')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('privacy.pillar2Title', undefined, 'Local-First Storage')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('privacy.pillar2Desc', undefined, "Your survey responses and shortlisted schemes are preserved locally in your browser's private storage (LocalStorage). You retain 100% control.")}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('privacy.pillar3Title', undefined, 'Zero Data Monetization')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('privacy.pillar3Desc', undefined, 'We do not sell, broker, or transfer your personal demographic details to financial aggregators, telemarketers, or loan recovery agents.')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{t('privacy.pillar4Title', undefined, 'Instant One-Click Deletion')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('privacy.pillar4Desc', undefined, 'You can wipe your stored profile, saved bookmarks, and tracking progress at any time with a single click in your dashboard.')}
            </p>
          </div>
        </div>

        {/* Detailed Privacy Statement */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-xl font-bold text-slate-900">
            {t('privacy.statementHeading', undefined, 'Information Collection & Usage Notice')}
          </h2>
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-slate-900 mb-1">{t('privacy.section1Title', undefined, '1. What We Collect')}</h4>
              <p className="text-slate-600">
                {t('privacy.section1Desc', undefined, 'When you complete the eligibility questionnaire, you provide approximate age, state, district, occupation category, and household income tier. These are used in real-time by the browser matching script to filter scheme conditions.')}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-1">{t('privacy.section2Title', undefined, '2. How It Is Used')}</h4>
              <p className="text-slate-600">
                {t('privacy.section2Desc', undefined, 'Your data is used solely to generate match percentages and explain which eligibility criteria are met. We do not use your information to track you across third-party websites.')}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-1">{t('privacy.section3Title', undefined, '3. External Links & Government Portals')}</h4>
              <p className="text-slate-600">
                {t('privacy.section3Desc', undefined, 'SchemeNavigator routes you to external official government portals (.gov.in / .nic.in). When you visit an external government website, their respective privacy policies apply.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
