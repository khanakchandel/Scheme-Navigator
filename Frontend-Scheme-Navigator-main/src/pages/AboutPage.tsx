import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-slate-50/80 dark:bg-slate-950 min-h-screen py-10 sm:py-16 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/80 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 text-xs font-bold border border-teal-200 dark:border-teal-800">
            <Compass className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span>{t('about.badge', undefined, 'About SchemeNavigator')}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('about.mainHeading', undefined, 'Bridging the Gap Between Citizens & Public Welfare')}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {t('about.mainSubtitle', undefined, "SchemeNavigator was built on a simple principle: Welfare schemes exist for citizens, but complex bureaucracy shouldn't prevent you from finding them.")}
          </p>
        </div>

        {/* 1. The Core Problem */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <span className="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">
            {t('about.challengeBadge', undefined, 'The Challenge')}
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('about.challengeHeading', undefined, 'Government Schemes = Complex Maze')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('about.challengeText', undefined, 'Every year, the Central and State Governments of India allocate lakhs of crores toward scholarships, farmer income support, healthcare covers, and MSME grants. However, millions of eligible citizens miss out because:')}
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 pt-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
              <span>{t('about.challengePoint1', undefined, 'They do not know which specific schemes exist or apply to their situation.')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
              <span>{t('about.challengePoint2', undefined, 'Government gazettes and circulars are written in dense administrative jargon.')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
              <span>{t('about.challengePoint3', undefined, 'Finding the genuine official application portal is difficult amidst deceptive agent websites.')}</span>
            </li>
          </ul>
        </div>

        {/* 2. SchemeNavigator = Compass / Navigation Layer */}
        <div className="bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-teal-800/40 shadow-xl space-y-6">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
              {t('about.philosophyBadge', undefined, 'Our Product Philosophy')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {t('about.philosophyHeading', undefined, 'DISCOVER → UNDERSTAND → APPLY')}
            </h2>
            <p className="text-sm text-teal-100/90 leading-relaxed">
              {t('about.philosophyText', undefined, 'SchemeNavigator serves as a modern navigation compass. We ask you a few simple questions about yourself, deterministically calculate compatibility against official eligibility criteria, explain exactly why each scheme matches in plain English, and guide you directly to the official government application portal.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-teal-800/60 text-xs">
            <div className="p-4 rounded-2xl bg-teal-900/40 border border-teal-700/50 space-y-1">
              <div className="font-bold text-emerald-300 text-sm">{t('about.step1Title', undefined, '01. Discover')}</div>
              <p className="text-slate-300">{t('about.step1Desc', undefined, 'Uncover schemes you never knew existed through automatic multi-criteria matching.')}</p>
            </div>
            <div className="p-4 rounded-2xl bg-teal-900/40 border border-teal-700/50 space-y-1">
              <div className="font-bold text-emerald-300 text-sm">{t('about.step2Title', undefined, '02. Understand')}</div>
              <p className="text-slate-300">{t('about.step2Desc', undefined, 'Read clear summaries, exact monetary benefits, and prepared document checklists.')}</p>
            </div>
            <div className="p-4 rounded-2xl bg-teal-900/40 border border-teal-700/50 space-y-1">
              <div className="font-bold text-emerald-300 text-sm">{t('about.step3Title', undefined, '03. Apply')}</div>
              <p className="text-slate-300">{t('about.step3Desc', undefined, 'Follow structured roadmaps and submit safely on official .gov.in websites.')}</p>
            </div>
          </div>
        </div>

        {/* 3. What We Are NOT (Crucial Transparency Box) */}
        <div id="what-we-are-not" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{t('about.transparencyBadge', undefined, 'Transparency & Independence Notice')}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('about.transparencyHeading', undefined, 'What SchemeNavigator Is NOT')}
          </h2>
          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              {t('about.transparencyIntro', undefined, 'To protect citizens from confusion and predatory agents, we maintain total transparency:')}
            </p>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <span className="text-rose-600 dark:text-rose-400 font-bold">✕</span>
                <span><strong className="text-slate-900 dark:text-white">{t('about.notGovTitle', undefined, 'Not a Government Department:')}</strong> {t('about.notGovDesc', undefined, 'SchemeNavigator is an independent civic technology platform. We do not represent any Ministry or Government agency.')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <span className="text-rose-600 dark:text-rose-400 font-bold">✕</span>
                <span><strong className="text-slate-900 dark:text-white">{t('about.notApproverTitle', undefined, 'No Application Approvals:')}</strong> {t('about.notApproverDesc', undefined, 'We do not approve, process, or reject welfare applications. Only competent government officers and state nodal bodies determine official eligibility.')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <span className="text-rose-600 dark:text-rose-400 font-bold">✕</span>
                <span><strong className="text-slate-900 dark:text-white">{t('about.noFeeTitle', undefined, 'Zero Fee Policy:')}</strong> {t('about.noFeeDesc', undefined, 'We never charge citizens money for scheme information, recommendations, or links. Government schemes are free public entitlements.')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="text-center pt-4">
          <Link
            to="/survey"
            className="inline-flex items-center gap-2 px-8 py-4 bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm rounded-2xl shadow-md transition-all"
          >
            <Compass className="w-4 h-4 text-emerald-300" />
            <span>{t('about.startSurveyCta', undefined, 'Start Your Personalized Discovery')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
