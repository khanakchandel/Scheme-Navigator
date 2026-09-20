import React from 'react';
import { ShieldAlert, Scale } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export const TermsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-slate-50/80 dark:bg-slate-950 min-h-screen py-10 sm:py-16 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700">
            <Scale className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span>{t('terms.badge', undefined, 'Legal Notice & Terms')}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('terms.mainHeading', undefined, 'Terms of Guidance & Service')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {t('terms.mainSubtitle', undefined, "Please read these terms explaining the scope of SchemeNavigator's informational guidance services.")}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-amber-950 dark:text-amber-100">{t('terms.noticeTitle', undefined, 'Important Notice:')}</strong>
              {t('terms.noticeDesc', undefined, 'SchemeNavigator provides navigational guidance based on publicly notified scheme guidelines. Final eligibility determinations, application processing, and benefits transfers are executed exclusively by the respective government department or state nodal agency.')}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{t('terms.section1Title', undefined, '1. Scope of Service')}</h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t('terms.section1Desc', undefined, 'SchemeNavigator is an independent discovery platform. We do not act as an official government intermediary, representative, or broker. Use of our service does not guarantee scheme admission or monetary approval.')}
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{t('terms.section2Title', undefined, '2. Accuracy of Scheme Information')}</h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t('terms.section2Desc', undefined, 'While we continuously audit and verify guidelines against official ministry publications and gazettes, government policies and fund allocations may change. Users should verify requirements on the official portal before incurring expenses.')}
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{t('terms.section3Title', undefined, '3. Third-Party Portals & Security')}</h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t('terms.section3Desc', undefined, 'We provide direct navigation links to verified .gov.in and .nic.in domains. SchemeNavigator is not responsible for the uptime, technical maintenance, or privacy practices of external government web services.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
