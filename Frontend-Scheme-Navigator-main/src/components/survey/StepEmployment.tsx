import React from 'react';
import { UserProfile, EmploymentType } from '../../types';
import { EMPLOYMENT_TYPES } from '../../constants';
import {
  GraduationCap,
  Sprout,
  Briefcase,
  UserCheck,
  Search,
  Wrench,
  Home,
  ShieldAlert,
  Sparkles,
  Building,
  User,
} from 'lucide-react';
import { VoiceMicButton } from './VoiceMicButton';
import { useTranslation } from '../../hooks/useTranslation';

interface StepEmploymentProps {
  profile: UserProfile;
  onChange: (fields: Partial<UserProfile>) => void;
  onOpenVoice?: () => void;
}

const OCCUPATION_OPTIONS = [
  'Student',
  'Farmer',
  'Teacher',
  'Engineer',
  'Doctor',
  'Business Owner',
  'Shopkeeper',
  'Daily Wage Worker',
  'Government Employee',
  'Private Employee',
  'Driver',
  'Construction Worker',
  'Healthcare Worker',
  'Homemaker',
  'Retired',
  'Unemployed',
  'Other',
];

export const StepEmployment: React.FC<StepEmploymentProps> = ({ profile, onChange, onOpenVoice }) => {
  const { t, tp, tOccupation } = useTranslation();

  const getEmploymentIcon = (type: EmploymentType) => {
    switch (type) {
      case 'Student':
        return <GraduationCap className="w-5 h-5 text-blue-600" />;
      case 'Farmer':
        return <Sprout className="w-5 h-5 text-emerald-600" />;
      case 'Business owner':
        return <Briefcase className="w-5 h-5 text-indigo-600" />;
      case 'Employed':
        return <UserCheck className="w-5 h-5 text-teal-600" />;
      case 'Unemployed':
        return <Search className="w-5 h-5 text-amber-600" />;
      case 'Self-employed':
        return <Wrench className="w-5 h-5 text-cyan-600" />;
      case 'Homemaker':
        return <Home className="w-5 h-5 text-rose-600" />;
      case 'Retired':
        return <ShieldAlert className="w-5 h-5 text-purple-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-slate-600" />;
    }
  };

  const currentEmpStatus = profile.employmentStatus || profile.employmentType || '';

  return (
    <div className="space-y-5 lg:space-y-4 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">
            {t('survey.step4_badge', undefined, 'Step 4 of 6 • Occupation & Livelihood')}
          </span>
          {onOpenVoice && (
            <VoiceMicButton
              onClick={onOpenVoice}
              variant="pill"
              label={t('voice.speak_btn', undefined, 'Speak')}
              sublabel="बोलें"
            />
          )}
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
          {t('survey.step4_title', undefined, 'Employment Status & Occupation')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          {t('survey.step4_desc', undefined, 'Government departments create specialized schemes tailored to specific professional and livelihood groups.')}
        </p>
      </div>

      {/* Main Employment Status Grid */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          {t('survey.emp_status_label', undefined, 'Employment Status')} <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {EMPLOYMENT_TYPES.map((type) => {
            const isSelected = Boolean(currentEmpStatus && currentEmpStatus === type);
            return (
              <button
                key={type}
                type="button"
                onClick={() =>
                  onChange({
                    employmentStatus: type,
                    employmentType: type,
                    occupation: profile.occupation || type,
                  })
                }
                className={`p-3 sm:p-3.5 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-teal-600 dark:border-teal-400 bg-teal-50/80 dark:bg-teal-950/70 shadow-md ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700/60">{getEmploymentIcon(type)}</div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-teal-700 dark:border-teal-400 bg-teal-700 dark:bg-teal-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-teal-950 dark:text-teal-200' : 'text-slate-800 dark:text-slate-100'}`}>
                  {tp(type)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* If Employed: Ask Government / Private */}
      {currentEmpStatus === 'Employed' && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-300 uppercase tracking-wider">
            <Building className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <span>{t('survey.emp_sector_label', undefined, 'Employment Sector')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'GOVERNMENT', labelKey: 'survey.sector_govt', label: 'Government / Public Sector', desc: 'Central / State Govt / PSU' },
              { id: 'PRIVATE', labelKey: 'survey.sector_pvt', label: 'Private Sector', desc: 'Corporate / Pvt Ltd / MSME employee' },
            ].map((sector) => {
              const isSelected = profile.employmentType === sector.id || profile.employmentType === sector.id.toLowerCase();
              return (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => onChange({ employmentType: sector.id as any })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-800 dark:bg-teal-600 text-white border-teal-800 dark:border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-teal-200 dark:border-teal-800/80 hover:bg-teal-100/50 dark:hover:bg-teal-900/50'
                  }`}
                >
                  <div className="text-xs font-bold">{t(sector.labelKey, undefined, sector.label)}</div>
                  <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-teal-200' : 'text-slate-500 dark:text-slate-400'}`}>
                    {sector.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Specific Occupation Dropdown (Single Select) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          {t('survey.specific_occupation', undefined, 'Specific Occupation')} <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-4 top-3.5 w-5 h-5 text-teal-700 dark:text-teal-400" />
          <select
            value={profile.occupation || ''}
            onChange={(e) => onChange({ occupation: e.target.value })}
            className="w-full pl-12 pr-10 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 focus:border-teal-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-slate-900 dark:text-white text-sm font-semibold outline-hidden transition-all appearance-none cursor-pointer"
          >
            <option value="" className="dark:bg-slate-800">-- {t('survey.select_occupation', undefined, 'Select Occupation')} --</option>
            {OCCUPATION_OPTIONS.map((occ) => (
              <option key={occ} value={occ} className="dark:bg-slate-800">
                {tOccupation(occ)}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400 dark:text-slate-500">▼</div>
        </div>
      </div>
    </div>
  );
};
