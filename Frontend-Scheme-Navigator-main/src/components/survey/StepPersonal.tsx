import React, { useState } from 'react';
import { UserProfile, Gender, MaritalStatus } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { HelpCircle, User, Info, Users, UserRound, UserCheck, Heart, FileText, Home } from 'lucide-react';
import { VoiceMicButton } from './VoiceMicButton';

interface StepPersonalProps {
  profile: UserProfile;
  onChange: (fields: Partial<UserProfile>) => void;
  onOpenVoice?: () => void;
}

export const StepPersonal: React.FC<StepPersonalProps> = ({ profile, onChange, onOpenVoice }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { t, tp } = useTranslation();

  const genderOptions: { id: Gender; label: string; icon: React.ReactNode }[] = [
    { id: 'male', label: t('survey.male'), icon: <UserRound className="w-5 h-5 text-blue-600" /> },
    { id: 'female', label: t('survey.female'), icon: <UserRound className="w-5 h-5 text-rose-500" /> },
    { id: 'other', label: t('survey.transgender'), icon: <Users className="w-5 h-5 text-violet-600" /> },
  ];

  const maritalOptions: { id: MaritalStatus; label: string; icon: React.ReactNode }[] = [
    { id: 'single', label: t('survey.single'), icon: <UserCheck className="w-5 h-5 text-slate-600" /> },
    { id: 'married', label: t('survey.married'), icon: <Heart className="w-5 h-5 text-rose-500" /> },
    { id: 'divorced', label: t('survey.divorced'), icon: <FileText className="w-5 h-5 text-amber-600" /> },
    { id: 'deserted', label: tp('Deserted'), icon: <Home className="w-5 h-5 text-slate-500" /> },
  ];

  const quickAges = [18, 20, 24, 30, 45, 60, 70];

  return (
    <div className="space-y-5 lg:space-y-4 animate-in fade-in duration-200">
      {/* Step Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">
            {t('survey.stepOf', { step: 1, total: 6 })} {t('survey.stepPersonal')}
          </span>
          <div className="flex items-center gap-3">
            {onOpenVoice && (
              <VoiceMicButton
                onClick={onOpenVoice}
                variant="pill"
                label={t('survey.speak')}
                sublabel="बोलें"
              />
            )}
            {/* Why do we ask this tooltip button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 hover:text-teal-900 dark:hover:text-teal-300 font-semibold cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>Why do we ask this?</span>
              </button>

              {showTooltip && (
                <div className="absolute right-0 top-6 z-30 w-72 p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 text-xs animate-in zoom-in-95">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>{t('survey.ageLabel')} & {t('survey.genderLabel')}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {t('howItWorks.subtitle')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
          {t('howItWorks.step1Title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          {t('howItWorks.step1Desc')}
        </p>
      </div>

      {/* Full Name (Optional / Friendly) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          {tp('Full Name')} <span className="text-slate-500 dark:text-slate-400 font-normal">({tp('Optional')})</span>
        </label>
        <div className="relative">
          <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="e.g. Ramesh Kumar"
            value={profile.name || ''}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full pl-12 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 focus:border-teal-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-slate-900 dark:text-white text-sm font-medium outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Age Input & Quick Select */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          {t('survey.ageLabel')} <span className="text-rose-500">*</span>
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="number"
            min={1}
            max={115}
            placeholder={t('survey.agePlaceholder')}
            value={profile.age === '' ? '' : profile.age || ''}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
              onChange({ age: isNaN(val as number) ? '' : val });
            }}
            className="w-full sm:w-36 px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 focus:border-teal-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-slate-900 dark:text-white text-base font-bold outline-hidden transition-all text-center sm:text-left"
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium mr-1">Quick select:</span>
            {quickAges.map((qAge) => (
              <button
                key={qAge}
                type="button"
                onClick={() => onChange({ age: qAge })}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  profile.age === qAge
                    ? 'bg-teal-800 dark:bg-teal-600 text-white border-teal-800 dark:border-teal-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {qAge} yrs
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gender Radio Cards */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          {t('survey.genderLabel')} <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {genderOptions.map((opt) => {
            const isSelected = profile.gender === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ gender: opt.id })}
                className={`p-3 sm:p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-teal-600 dark:border-teal-400 bg-teal-50/80 dark:bg-teal-950/70 shadow-md ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700/60">{opt.icon}</div>
                  <span className={`text-sm font-bold ${isSelected ? 'text-teal-950 dark:text-teal-200' : 'text-slate-800 dark:text-slate-100'}`}>
                    {opt.label}
                  </span>
                </div>
                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-teal-700 dark:border-teal-400 bg-teal-700 dark:bg-teal-500' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {isSelected && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Marital Status Radio Cards */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          {t('survey.maritalStatus')} <span className="text-slate-500 dark:text-slate-400 font-normal">(Optional)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {maritalOptions.map((opt) => {
            const isSelected = profile.maritalStatus === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ maritalStatus: isSelected ? '' : opt.id })}
                className={`p-3 sm:p-3.5 rounded-2xl border-2 text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-teal-600 dark:border-teal-400 bg-teal-50/80 dark:bg-teal-950/70 shadow-md ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 w-fit">{opt.icon}</div>
                <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-teal-950 dark:text-teal-200' : 'text-slate-800 dark:text-slate-100'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
