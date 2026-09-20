import React, { useState, useEffect } from 'react';
import { Joyride, STATUS, type Step, type EventData } from 'react-joyride';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  ClipboardCheck,
  Award,
  Bookmark,
  TrendingUp,
  X,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useTranslation } from '../../hooks/useTranslation';

const TOUR_STORAGE_KEY = 'scheme_navigator_onboarding_completed_v1';
const WELCOME_SESSION_KEY = 'scheme_navigator_welcome_session_seen';

export const OnboardingTour: React.FC = () => {
  const { t } = useTranslation();
  const { isTourActive, startTour, stopTour, handleCheckEligibility } = useAppStore();
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show welcome window on every fresh visit / browser opening
    const hasSeenInSession = sessionStorage.getItem(WELCOME_SESSION_KEY);

    if (!hasSeenInSession) {
      // Show small welcome modal after a slight delay for smooth page load
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const tourSteps: Step[] = [
    {
      target: '#nav-check-eligibility',
      title: t('tour.step1_title', undefined, '1. Smart Eligibility Survey 📋'),
      content: t('tour.step1_desc', undefined, 'Start your journey here! Take a quick 2-minute survey without needing Aadhaar or sensitive documents to discover personalized schemes.'),
      placement: 'bottom',
      buttons: ['primary', 'skip'],
    },
    {
      target: '#nav-explore',
      title: t('tour.step2_title', undefined, '2. Explore & Recommendations 🎯'),
      content: t('tour.step2_desc', undefined, 'Browse verified Central & State government schemes with live eligibility criteria, instant match scores, and category filters.'),
      placement: 'bottom',
      buttons: ['back', 'primary', 'skip'],
    },
    {
      target: '#nav-saved-schemes',
      title: t('tour.step3_title', undefined, '3. Saved Schemes & Tracker 📌'),
      content: t('tour.step3_desc', undefined, 'Bookmark schemes you qualify for with a single tap to store and track application milestones in your citizen dashboard.'),
      placement: 'bottom',
      buttons: ['back', 'primary', 'skip'],
    },
    {
      target: '#nav-ai-advisor',
      title: t('tour.step5_title', undefined, '4. Mitra AI Scheme Advisor 🤖'),
      content: t('tour.step5_desc', undefined, 'Have queries about eligibility or guidelines? Ask Mitra, our AI Scheme Advisor 24/7 in English, Hindi, and regional languages.'),
      placement: 'bottom',
      buttons: ['back', 'primary'],
    },
  ];

  const handleJoyrideEvent = (data: EventData) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      stopTour();
      sessionStorage.setItem(WELCOME_SESSION_KEY, 'true');
    }
  };

  const handleDismissWelcome = () => {
    setShowWelcomeModal(false);
    sessionStorage.setItem(WELCOME_SESSION_KEY, 'true');
  };

  const handleStartTourFromModal = () => {
    setShowWelcomeModal(false);
    sessionStorage.setItem(WELCOME_SESSION_KEY, 'true');
    startTour();
  };

  const handleStartSurveyFromModal = () => {
    setShowWelcomeModal(false);
    sessionStorage.setItem(WELCOME_SESSION_KEY, 'true');
    handleCheckEligibility(navigate);
  };

  return (
    <>
      {/* 1. React Joyride Tooltip Tour */}
      <Joyride
        steps={tourSteps}
        run={isTourActive}
        onEvent={handleJoyrideEvent}
        options={{
          primaryColor: '#0F766E',
          textColor: '#1e293b',
          backgroundColor: '#ffffff',
          arrowColor: '#0F766E',
          zIndex: 10000,
          skipBeacon: true,
          showProgress: true,
        }}
        styles={{
          tooltip: {
            borderRadius: '1.25rem',
            padding: '1.25rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            border: '1px solid #ccfbf1',
          },
          tooltipTitle: {
            fontSize: '1rem',
            fontWeight: 800,
            color: '#0f766e',
            marginBottom: '0.5rem',
          },
          tooltipContent: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
            color: '#334155',
          },
          buttonPrimary: {
            backgroundColor: '#0F766E',
            borderRadius: '0.75rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            padding: '0.6rem 1.2rem',
            boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.3)',
          },
          buttonBack: {
            color: '#64748b',
            fontSize: '0.8125rem',
            fontWeight: 600,
            marginRight: '0.5rem',
          },
          buttonSkip: {
            color: '#94a3b8',
            fontSize: '0.8125rem',
            fontWeight: 600,
          },
        }}
        locale={{
          back: t('common.back', undefined, 'Back'),
          close: t('common.close', undefined, 'Close'),
          last: t('tour.get_started', undefined, 'Get Started 🎉'),
          next: t('tour.next', undefined, 'Next →'),
          skip: t('tour.skip', undefined, 'Skip Tour'),
        }}
      />

      {/* 2. Welcome Screen Small Window on Loading / First Visit */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-teal-100 overflow-hidden"
            >
              {/* Header Gradient Banner */}
              <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 p-6 text-white relative">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleDismissWelcome}
                  className="absolute top-4 right-4 p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  aria-label="Close welcome window"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-700/70 border border-teal-500/40 text-[11px] font-bold text-emerald-300">
                    <Sparkles className="w-3 h-3 text-emerald-300" />
                    {t('tour.welcomeBadge', undefined, 'First-Time Welcome')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-700/80 border border-teal-500/50 flex items-center justify-center shrink-0 shadow-inner">
                    <Compass className="w-7 h-7 text-emerald-300 animate-[spin_8s_linear_infinite]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold tracking-tight text-white">
                      {t('tour.welcomeTitle', undefined, 'Welcome to SchemeNavigator! 🇮🇳')}
                    </h3>
                    <p className="text-xs text-teal-200 mt-0.5">
                      {t('tour.welcomeSubtitle', undefined, 'Your guide to 100+ government welfare schemes, made simple.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body: 4 Key Pillars */}
              <div className="p-6 space-y-5">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {t('tour.welcomePillarsDesc', undefined, 'Discover financial support, grants, and subsidies tailored to your profile in 4 easy steps:')}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-100/70 text-teal-800 shrink-0">
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{t('tour.pillar1Title', undefined, '1. Quick Survey')}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{t('tour.pillar1Desc', undefined, '2 min eligibility check')}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-800 shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{t('tour.pillar2Title', undefined, '2. Match Scores')}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{t('tour.pillar2Desc', undefined, 'Transparent fit metrics')}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-100/70 text-blue-800 shrink-0">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{t('tour.pillar3Title', undefined, '3. Save Schemes')}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{t('tour.pillar3Desc', undefined, '1-click citizen locker')}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-100/70 text-purple-800 shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{t('tour.pillar4Title', undefined, '4. Track Status')}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{t('tour.pillar4Desc', undefined, 'Checklist & deadlines')}</p>
                    </div>
                  </div>
                </div>

                {/* Trust assurance */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 text-teal-900 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('tour.trustBadge', undefined, '100% Free & Secure. No Aadhaar number or login required.')}</span>
                </div>

                {/* Action CTA Buttons */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleStartTourFromModal}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-700 via-teal-800 to-teal-950 hover:from-teal-800 hover:to-slate-900 text-white text-sm font-bold rounded-2xl shadow-md shadow-teal-900/20 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{t('tour.startTourBtn', undefined, 'Take a 30s Interactive Tour ✨')}</span>
                    <ArrowRight className="w-4 h-4 text-teal-200" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleStartSurveyFromModal}
                      className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 text-teal-900 text-xs font-bold rounded-xl border border-teal-200 hover:border-teal-300 transition-all cursor-pointer"
                    >
                      {t('tour.startSurveyBtn', undefined, '🚀 Start Survey Directly')}
                    </button>
                    <button
                      type="button"
                      onClick={handleDismissWelcome}
                      className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      {t('tour.exploreOwnBtn', undefined, 'Explore on my own')}
                    </button>
                  </div>
                </div>

                {/* Quick Hint / Help */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span className="text-[11px] text-slate-400">
                    💡 You can revisit the tour anytime from the <strong className="text-teal-800">Tour</strong> button in the header.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWelcomeModal(false);
                      startTour();
                    }}
                    className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                  >
                    <HelpCircle className="w-3 h-3" />
                    {t('tour.tourHelp', undefined, 'Tour Help')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
