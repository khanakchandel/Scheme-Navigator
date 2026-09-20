import React from 'react';
import { UserProfile, AreaType } from '../../types';
import { INDIAN_STATES, POPULAR_DISTRICTS } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import { MapPin, Building2, Trees, Landmark } from 'lucide-react';
import { VoiceMicButton } from './VoiceMicButton';

interface StepLocationProps {
  profile: UserProfile;
  onChange: (fields: Partial<UserProfile>) => void;
  onOpenVoice?: () => void;
}

export const StepLocation: React.FC<StepLocationProps> = ({ profile, onChange, onOpenVoice }) => {
  const { t, tp, tState } = useTranslation();
  const currentState = profile.state || '';
  const availableDistricts = currentState && POPULAR_DISTRICTS[currentState]
    ? POPULAR_DISTRICTS[currentState]
    : ['Capital / Main District', 'North District', 'South District', 'Others'];

  const areaOptions: { id: AreaType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'Urban',
      label: t('survey.urban'),
      desc: 'Municipal corporation, cities, or towns',
      icon: <Building2 className="w-5 h-5 text-blue-600" />,
    },
    {
      id: 'Rural',
      label: t('survey.rural'),
      desc: 'Gram Panchayat, villages, farm areas',
      icon: <Trees className="w-5 h-5 text-emerald-600" />,
    },
    {
      id: 'Semi-Urban',
      label: tp('Semi-Urban'),
      desc: 'Suburban outgrowths, tehsils',
      icon: <Landmark className="w-5 h-5 text-purple-600" />,
    },
  ];

  return (
    <div className="space-y-5 lg:space-y-4 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">
            {t('survey.stepOf', { step: 2, total: 6 })} {t('survey.stepLocation')}
          </span>
          {onOpenVoice && (
            <VoiceMicButton
              onClick={onOpenVoice}
              variant="pill"
              label={t('survey.speak')}
              sublabel="बोलें"
            />
          )}
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
          {t('survey.stepLocation')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          {t('howItWorks.subtitle')}
        </p>
      </div>

      {/* State Dropdown */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          {t('survey.stateLabel')} <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-teal-700 dark:text-teal-400" />
          <select
            value={profile.state || ''}
            onChange={(e) => onChange({ state: e.target.value, district: '' })}
            className="w-full pl-12 pr-10 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 focus:border-teal-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-slate-900 dark:text-white text-sm font-semibold outline-hidden transition-all appearance-none cursor-pointer"
          >
            <option value="" className="dark:bg-slate-800">-- {t('survey.select_state', undefined, 'Select Your State')} --</option>
            {INDIAN_STATES.filter((s) => s !== 'All India').map((st) => (
              <option key={st} value={st} className="dark:bg-slate-800">
                {tState(st)}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
            ▼
          </div>
        </div>
      </div>

      {/* District Dropdown */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          {t('survey.districtLabel')} <span className="text-slate-500 dark:text-slate-400 font-normal">(Optional)</span>
        </label>
        <div className="relative">
          <select
            value={profile.district || ''}
            onChange={(e) => onChange({ district: e.target.value })}
            className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 focus:border-teal-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-slate-900 dark:text-white text-sm font-medium outline-hidden transition-all appearance-none cursor-pointer"
          >
            <option value="" className="dark:bg-slate-800">-- {t('survey.districtPlaceholder')} --</option>
            {availableDistricts.map((dst) => (
              <option key={dst} value={dst} className="dark:bg-slate-800">
                {dst}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
            ▼
          </div>
        </div>
      </div>

      {/* Area Type Cards */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          {t('survey.areaType')} <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {areaOptions.map((opt) => {
            const isSelected = profile.areaType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ areaType: opt.id })}
                className={`p-3 sm:p-3.5 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-teal-600 dark:border-teal-400 bg-teal-50/80 dark:bg-teal-950/70 shadow-md ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700/60">{opt.icon}</div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-teal-700 dark:border-teal-400 bg-teal-700 dark:bg-teal-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <div className={`text-sm font-bold ${isSelected ? 'text-teal-950 dark:text-teal-200' : 'text-slate-800 dark:text-slate-100'}`}>
                    {opt.label}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
