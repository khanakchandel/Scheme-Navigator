import React, { useState } from 'react';
import { UserProfile, IncomeRange } from '../../types';
import { HelpCircle, Info, ShieldCheck } from 'lucide-react';
import { VoiceMicButton } from './VoiceMicButton';
import { useTranslation } from '../../hooks/useTranslation';

interface StepIncomeProps {
  profile: UserProfile;
  onChange: (fields: Partial<UserProfile>) => void;
  onOpenVoice?: () => void;
}

export const StepIncome: React.FC<StepIncomeProps> = ({ profile, onChange, onOpenVoice }) => {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  const quickIncomePresets = [
    { label: '₹80,000 / yr', val: 80000, range: 'Below ₹1 lakh' as IncomeRange },
    { label: '₹1.5 Lakh / yr', val: 150000, range: '₹1–2.5 lakh' as IncomeRange },
    { label: '₹3 Lakh / yr', val: 300000, range: '₹2.5–5 lakh' as IncomeRange },
    { label: '₹6 Lakh / yr', val: 600000, range: '₹5–10 lakh' as IncomeRange },
    { label: '₹12 Lakh / yr', val: 1200000, range: '₹10 lakh+' as IncomeRange },
  ];

  const currentIncome = profile.annualIncome !== undefined && profile.annualIncome !== '' ? Number(profile.annualIncome) : null;

  return (
    <div className="space-y-5 lg:space-y-4 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">
            {t('survey.step5_badge', undefined, 'Step 5 of 6 • Household Income')}
          </span>
          <div className="flex items-center gap-3">
            {onOpenVoice && (
              <VoiceMicButton
                onClick={onOpenVoice}
                variant="pill"
                label={t('voice.speak_btn', undefined, 'Speak')}
                sublabel="बोलें"
              />
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 hover:text-teal-900 dark:hover:text-teal-300 font-semibold cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>{t('survey.income_help_btn', undefined, 'Why do we ask this?')}</span>
              </button>

              {showTooltip && (
                <div className="absolute right-0 top-6 z-30 w-72 p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 text-xs animate-in zoom-in-95">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>{t('survey.income_help_title', undefined, 'Income Ceiling Calibration')}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {t('survey.income_help_desc', undefined, 'Government welfare initiatives apply progressive means-testing thresholds (e.g. ₹2.5L for scholarships, ₹3L for state health cards, ₹8L for EWS/OBC non-creamy layer).')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
          {t('survey.step5_title', undefined, 'Annual Household Income')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          {t('survey.step5_desc', undefined, "Enter your family's approximate total annual income from all sources.")}
        </p>
      </div>

      {/* Numeric Amount Input */}
      <div className="space-y-2.5 p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          {t('survey.annual_income_label', undefined, 'Annual Household Income (₹ INR)')} <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-4 top-3 text-teal-700 dark:text-teal-400 font-bold text-lg">₹</div>
          <input
            type="number"
            min={0}
            step={5000}
            placeholder="e.g. 1,50,000"
            value={profile.annualIncome === '' ? '' : (profile.annualIncome ?? '')}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10));
              let range: IncomeRange = '₹1–2.5 lakh';
              if (typeof val === 'number') {
                if (val < 100000) range = 'Below ₹1 lakh';
                else if (val <= 250000) range = '₹1–2.5 lakh';
                else if (val <= 500000) range = '₹2.5–5 lakh';
                else if (val <= 1000000) range = '₹5–10 lakh';
                else range = '₹10 lakh+';
              }
              onChange({ annualIncome: isNaN(val as number) ? '' : val, incomeRange: range });
            }}
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-teal-600 rounded-2xl text-slate-900 dark:text-white text-base sm:text-lg font-bold outline-hidden transition-all"
          />
        </div>

        {/* Quick select presets */}
        <div className="flex items-center gap-2 flex-wrap pt-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('survey.quick_presets', undefined, 'Quick presets:')}</span>
          {quickIncomePresets.map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => onChange({ annualIncome: preset.val, incomeRange: preset.range })}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                currentIncome === preset.val
                  ? 'bg-teal-800 dark:bg-teal-600 text-white border-teal-800 dark:border-teal-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
        <span>{t('survey.income_privacy_shield', undefined, 'Your financial data is protected by strict data minimization and is never shared with third parties.')}</span>
      </div>
    </div>
  );
};
