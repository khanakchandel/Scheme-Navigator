import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../../types';
import { getSavedProfile, saveUserProfile } from '../../services/storageService';
import { useAppStore } from '../../store/appStore';
import { useTranslation } from '../../hooks/useTranslation';
import { StepPersonal } from './StepPersonal';
import { StepLocation } from './StepLocation';
import { StepBackground } from './StepBackground';
import { StepEmployment } from './StepEmployment';
import { StepIncome } from './StepIncome';
import { StepReview, getMissingMandatoryFields } from './StepReview';
import { VoiceSurveyModal } from './VoiceSurveyModal';
import { VoiceMicButton } from './VoiceMicButton';
import { LanguageSelector } from '../common/LanguageSelector';
import { ParsedEntity } from '../../utils/voiceParser';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Compass,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const SurveyWizard: React.FC = () => {
  const navigate = useNavigate();
  const { profile: storeProfile, surveyDraft, saveDraft, submitSurvey } = useAppStore();
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(() => surveyDraft?.currentStep || 1);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const existing = storeProfile || getSavedProfile() || surveyDraft?.answers;
    return existing && existing.age ? existing : {};
  });
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceNotification, setVoiceNotification] = useState<{
    text: string;
    entities: ParsedEntity[];
  } | null>(null);

  const totalSteps = 6;

  const stepTitles = [
    t('survey.stepPersonal'),
    t('survey.stepLocation'),
    t('survey.stepBackground'),
    t('survey.stepEmployment'),
    t('survey.stepIncome'),
    t('survey.stepReview'),
  ];

  const handleFieldChange = (fields: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...fields };
      saveDraft(updated, currentStep);
      return updated;
    });
  };

  const handleVoiceApply = (extracted: Partial<UserProfile>, entities: ParsedEntity[]) => {
    setProfile((prev) => {
      const updated = { ...prev, ...extracted };
      saveDraft(updated, currentStep);
      return updated;
    });

    setVoiceNotification({
      text: `Updated ${entities.length} field${entities.length > 1 ? 's' : ''} from your voice answer!`,
      entities,
    });

    setTimeout(() => {
      setVoiceNotification(null);
    }, 5000);
  };

  const [stepError, setStepError] = useState<string | null>(null);

  const handleNext = async () => {
    setStepError(null);

    // Step 1 Validation
    if (currentStep === 1) {
      if (!profile.age || Number(profile.age) < 1 || Number(profile.age) > 120) {
        setStepError('⚠️ Age is mandatory (1–120 years). Please enter your age to discover matching schemes.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!profile.gender) {
        setStepError('⚠️ Gender is mandatory. Please select your gender to check scheme eligibility.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Step 2 Validation
    if (currentStep === 2) {
      if (!profile.state) {
        setStepError('⚠️ State / UT is mandatory. Please select your State to view applicable welfare schemes.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Step 4 Validation
    if (currentStep === 4) {
      if (!profile.employmentStatus && !profile.employmentType && !profile.occupation) {
        setStepError('⚠️ Occupation / Employment status is mandatory. Please select your primary occupation.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveDraft(profile, nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Step 6: Review & Confirmation -> Validate ALL Mandatory Fields before submitting
      const missing = getMissingMandatoryFields(profile);
      if (missing.length > 0) {
        setStepError(
          `⚠️ Mandatory Profile Fields Missing: Please fill ${missing.map((m) => m.label).join(', ')} before submitting to find eligible schemes.`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Save user profile immediately to local storage
      saveUserProfile(profile);

      // Trigger survey submit non-blocking so button does not freeze
      submitSurvey(profile).catch((err) => {
        console.warn('submitSurvey background error handled:', err);
      });

      // Instantly transition to analyzing screen without latency
      navigate('/analyzing');
    }
  };

  const handlePrev = () => {
    setStepError(null);
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveDraft(profile, prevStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (targetStep: number) => {
    setStepError(null);
    if (targetStep <= currentStep) {
      // Going back or staying on current step is always allowed
      setCurrentStep(targetStep);
      saveDraft(profile, targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check mandatory fields for all steps before targetStep
    const missing = getMissingMandatoryFields(profile);
    const missingBeforeTarget = missing.filter((m) => m.step < targetStep);

    if (missingBeforeTarget.length > 0) {
      setStepError(
        `⚠️ Mandatory fields missing: Please complete Step ${missingBeforeTarget[0].step} (${missingBeforeTarget[0].label}) before proceeding to Step ${targetStep}.`
      );
      setCurrentStep(missingBeforeTarget[0].step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentStep(targetStep);
    saveDraft(profile, targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditStep = (stepNumber: number) => {
    setStepError(null);
    setCurrentStep(stepNumber);
    saveDraft(profile, stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Progress percentage
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full">
      {/* Desktop & Mobile Responsive Grid Layout */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start">
        {/* Left Column: Tracking & Context Sidebar (Desktop lg:col-span-4 sticky) */}
        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-20 space-y-3.5">
          {/* Main Tracking Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            {/* Header: Title & Language Selector */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100/80 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                    Scheme Assessment
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                    Profile Matching Engine
                  </span>
                </div>
              </div>
              <LanguageSelector variant="compact" align="right" />
            </div>

            {/* Step Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800 dark:text-slate-200">
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="text-teal-700 dark:text-teal-400 font-extrabold">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Vertical Steps Checklist */}
            <div className="space-y-1 pt-1">
              {stepTitles.map((title, idx) => {
                const stepNum = idx + 1;
                const isCompleted = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;
                const isClickable = stepNum <= currentStep;

                return (
                  <button
                    key={title}
                    type="button"
                    disabled={!isClickable}
                    onClick={() => handleStepClick(stepNum)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left ${
                      isCurrent
                        ? 'bg-teal-50/90 dark:bg-teal-950/70 border border-teal-500/30 text-teal-950 dark:text-teal-200 font-bold shadow-2xs ring-1 ring-teal-500/20'
                        : isCompleted
                        ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold cursor-pointer'
                        : 'text-slate-600 dark:text-slate-400 opacity-60 cursor-not-allowed font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <span
                          className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center shrink-0 font-bold ${
                            isCurrent
                              ? 'bg-teal-700 dark:bg-teal-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {stepNum}
                        </span>
                      )}
                      <span className="truncate">{title}</span>
                    </div>

                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Profile Signals Snapshot ("Tracking on the side") */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Live Profile Signals
                </span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                  {Object.values(profile).filter(v => v !== '' && v !== undefined).length} captured
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {profile.age ? (
                  <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/70 border border-teal-200/80 dark:border-teal-800/80 text-teal-900 dark:text-teal-300 text-[11px] font-semibold">
                    Age: {profile.age} yrs
                  </span>
                ) : null}
                {profile.gender ? (
                  <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/70 border border-teal-200/80 dark:border-teal-800/80 text-teal-900 dark:text-teal-300 text-[11px] font-semibold capitalize">
                    {profile.gender}
                  </span>
                ) : null}
                {profile.state ? (
                  <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800/80 text-blue-900 dark:text-blue-300 text-[11px] font-semibold">
                    {profile.state}
                  </span>
                ) : null}
                {profile.category ? (
                  <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/70 border border-purple-200/80 dark:border-purple-800/80 text-purple-900 dark:text-purple-300 text-[11px] font-semibold">
                    {profile.category}
                  </span>
                ) : null}
                {(profile.occupation || profile.employmentStatus) ? (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 text-[11px] font-semibold">
                    {profile.occupation || profile.employmentStatus}
                  </span>
                ) : null}
                {(profile.annualIncome !== undefined && profile.annualIncome !== '') ? (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-300 text-[11px] font-semibold">
                    ₹{Number(profile.annualIncome).toLocaleString('en-IN')}
                  </span>
                ) : null}
                {(!profile.age && !profile.gender && !profile.state && !profile.category && !profile.occupation) && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                    Answers will appear here as you fill the form.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Compact Voice Assistant Card */}
          {currentStep < 6 && (
            <VoiceMicButton
              variant="banner"
              onClick={() => setIsVoiceModalOpen(true)}
              label="Voice Assistant"
              sublabel="बोलें"
              className="shadow-sm"
            />
          )}
        </aside>

        {/* Right Column: Active Form & Controls (Desktop lg:col-span-8, Mobile full width) */}
        <main className="lg:col-span-8 space-y-3">
          {/* Mobile-Only Progress Strip (<lg) */}
          <div className="block lg:hidden bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 mb-3">
            <div className="flex items-center justify-between gap-2 text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-[10px]">
                  {currentStep}
                </span>
                <span className="text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSelector variant="compact" align="right" />
                <VoiceMicButton
                  onClick={() => setIsVoiceModalOpen(true)}
                  variant="pill"
                  label="Voice"
                  sublabel="बोलें"
                />
              </div>
            </div>

            {/* Mobile Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Voice Auto-fill Notification Banner */}
          {voiceNotification && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500 text-white shadow-md border border-emerald-400 animate-in slide-in-from-top-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-100 shrink-0" />
                <div>
                  <span className="text-xs sm:text-sm font-extrabold block">{voiceNotification.text}</span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {voiceNotification.entities.map((ent, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg bg-white/20 text-white font-semibold"
                      >
                        {ent.label}: {ent.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVoiceNotification(null)}
                className="text-white/80 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Step Validation Error Alert */}
          {stepError && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 dark:border-rose-700 shadow-md text-rose-950 dark:text-rose-200 flex items-start justify-between gap-3 animate-in slide-in-from-top-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-extrabold text-rose-900 dark:text-rose-200 block">
                    Action Required
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-rose-800 dark:text-rose-300 leading-snug">
                    {stepError}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStepError(null)}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-200 font-extrabold text-sm px-2 py-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* Main Survey Card Container */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 lg:p-6 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none transition-all flex flex-col justify-between min-h-[480px]">
            {/* Step Content */}
            <div>
              {currentStep === 1 && (
                <StepPersonal
                  profile={profile}
                  onChange={handleFieldChange}
                  onOpenVoice={() => setIsVoiceModalOpen(true)}
                />
              )}
              {currentStep === 2 && (
                <StepLocation
                  profile={profile}
                  onChange={handleFieldChange}
                  onOpenVoice={() => setIsVoiceModalOpen(true)}
                />
              )}
              {currentStep === 3 && (
                <StepBackground
                  profile={profile}
                  onChange={handleFieldChange}
                  onOpenVoice={() => setIsVoiceModalOpen(true)}
                />
              )}
              {currentStep === 4 && (
                <StepEmployment
                  profile={profile}
                  onChange={handleFieldChange}
                  onOpenVoice={() => setIsVoiceModalOpen(true)}
                />
              )}
              {currentStep === 5 && (
                <StepIncome
                  profile={profile}
                  onChange={handleFieldChange}
                  onOpenVoice={() => setIsVoiceModalOpen(true)}
                />
              )}
              {currentStep === 6 && (
                <StepReview profile={profile} onEditStep={handleEditStep} />
              )}
            </div>

            {/* Wizard Footer Navigation Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('survey.back')}</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3 rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-teal-950 hover:from-teal-800 hover:to-slate-900 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-teal-950/20 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98]"
              >
                {currentStep === totalSteps ? (
                  <>
                    <Compass className="w-4 h-4 text-emerald-300 group-hover:rotate-45 transition-transform" />
                    <span>{t('survey.submit')}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-300" />
                  </>
                ) : (
                  <>
                    <span>{t('survey.next')}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Voice Survey Assistant Modal */}
      <VoiceSurveyModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApply={handleVoiceApply}
        currentStep={currentStep}
        initialProfile={profile}
      />
    </div>
  );
};
