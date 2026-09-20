import React from 'react';
import { UserProfile } from '../../types';
import { formatIndianRupee } from '../../utils/formatIndianNumber';
import {
  User,
  MapPin,
  Briefcase,
  IndianRupee,
  ShieldCheck,
  Edit2,
  Lock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export function getMissingMandatoryFields(profile: UserProfile): { field: string; step: number; label: string }[] {
  const missing: { field: string; step: number; label: string }[] = [];

  if (!profile.age || Number(profile.age) < 1 || Number(profile.age) > 120) {
    missing.push({ field: 'age', step: 1, label: 'Age (1–120 yrs)' });
  }
  if (!profile.gender) {
    missing.push({ field: 'gender', step: 1, label: 'Gender' });
  }
  if (!profile.state) {
    missing.push({ field: 'state', step: 2, label: 'State / Union Territory' });
  }
  if (!profile.employmentStatus && !profile.employmentType && !profile.occupation) {
    missing.push({ field: 'employment', step: 4, label: 'Occupation / Employment' });
  }

  return missing;
}

interface StepReviewProps {
  profile: UserProfile;
  onEditStep: (stepNumber: number) => void;
}

export const StepReview: React.FC<StepReviewProps> = ({ profile, onEditStep }) => {
  const { t, tp, tCategory, tState, tOccupation } = useTranslation();
  const hasDisability = Boolean(profile.hasDisability ?? profile.isDisability);
  const isBpl = Boolean(profile.hasBPLCard ?? profile.isBPL);

  const missingFields = getMissingMandatoryFields(profile);

  const maritalStatusLabels: Record<string, string> = {
    single: t('survey.marital_single', undefined, 'Unmarried / Single'),
    married: t('survey.marital_married', undefined, 'Married'),
    divorced: t('survey.marital_divorced', undefined, 'Divorced'),
    deserted: t('survey.marital_deserted', undefined, 'Deserted'),
  };

  const summaryItems = [
    {
      step: 1,
      title: t('survey.review_s1_title', undefined, 'Personal Info'),
      icon: User,
      items: [
        {
          label: t('survey.age_label', undefined, 'Age'),
          value: profile.age ? `${profile.age} ${t('common.years', undefined, 'years')}` : t('common.not_specified', undefined, 'Not specified'),
          isMissing: !profile.age || Number(profile.age) < 1,
        },
        {
          label: t('survey.gender_label', undefined, 'Gender'),
          value: profile.gender
            ? tp(profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1))
            : t('common.not_specified', undefined, 'Not specified'),
          isMissing: !profile.gender,
        },
        {
          label: t('survey.marital_status_label', undefined, 'Marital Status'),
          value: profile.maritalStatus ? maritalStatusLabels[profile.maritalStatus] || tp(profile.maritalStatus) : t('common.not_specified', undefined, 'Not specified'),
          isMissing: false,
        },
      ],
    },
    {
      step: 2,
      title: t('survey.review_s2_title', undefined, 'Location & Domicile'),
      icon: MapPin,
      items: [
        {
          label: t('survey.state_label', undefined, 'State'),
          value: profile.state ? tState(profile.state) : t('common.not_specified', undefined, 'Not specified'),
          isMissing: !profile.state,
        },
        {
          label: t('survey.district_label', undefined, 'District'),
          value: profile.district || t('common.any_all', undefined, 'Any / All'),
          isMissing: false,
        },
        {
          label: t('survey.locality_label', undefined, 'Locality'),
          value: (profile.residenceArea || profile.areaType) ? tp(profile.residenceArea || profile.areaType || '') : t('common.not_specified', undefined, 'Not specified'),
          isMissing: false,
        },
      ],
    },
    {
      step: 3,
      title: t('survey.review_s3_title', undefined, 'Social Category & Status'),
      icon: ShieldCheck,
      items: [
        {
          label: t('survey.category_label', undefined, 'Category'),
          value: profile.category ? tCategory(profile.category) : t('common.not_specified', undefined, 'Not specified'),
          isMissing: false,
        },
        {
          label: t('survey.disability_label', undefined, 'Disability'),
          value: hasDisability
            ? `${t('common.yes', undefined, 'Yes')} (${profile.disabilityPercentage ?? 40}%)`
            : t('common.no', undefined, 'No'),
          isMissing: false,
        },
        {
          label: t('survey.minority_label', undefined, 'Minority Status'),
          value: profile.isMinority ? t('common.yes', undefined, 'Yes') : t('common.no', undefined, 'No'),
          isMissing: false,
        },
        {
          label: t('survey.bpl_label', undefined, 'BPL Status'),
          value: isBpl ? t('common.yes', undefined, 'Yes') : t('common.no', undefined, 'No'),
          isMissing: false,
        },
      ],
    },
    {
      step: 4,
      title: t('survey.review_s4_title', undefined, 'Occupation & Livelihood'),
      icon: Briefcase,
      items: [
        {
          label: t('survey.emp_status_label', undefined, 'Employment Status'),
          value: (profile.employmentStatus || profile.employmentType) ? tp(profile.employmentStatus || profile.employmentType || '') : t('common.not_specified', undefined, 'Not specified'),
          isMissing: !profile.employmentStatus && !profile.employmentType && !profile.occupation,
        },
        {
          label: t('survey.specific_occupation', undefined, 'Occupation'),
          value: profile.occupation ? tOccupation(profile.occupation) : t('common.not_specified', undefined, 'Not specified'),
          isMissing: false,
        },
      ],
    },
    {
      step: 5,
      title: t('survey.review_s5_title', undefined, 'Household Income'),
      icon: IndianRupee,
      items: [
        {
          label: t('survey.annual_income_label', undefined, 'Annual Income'),
          value:
            profile.annualIncome !== undefined && profile.annualIncome !== ''
            ? formatIndianRupee(Number(profile.annualIncome))
            : profile.incomeRange || t('common.not_specified', undefined, 'Not specified'),
          isMissing: false,
        },
      ],
    },
  ];

  return (
    <div className="space-y-5 lg:space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">
          {t('survey.step6_badge', undefined, 'Step 6 of 6 • Review & Confirmation')}
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
          {t('survey.step6_title', undefined, 'Your Eligibility Profile Summary')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          {t('survey.step6_desc', undefined, 'Review your answers before our matching engine evaluates thousands of scheme conditions.')}
        </p>
      </div>

      {/* Prominent Red Alert when Mandatory Fields are Missing */}
      {missingFields.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/80 dark:border-rose-700 shadow-lg shadow-rose-500/10 text-rose-950 dark:text-rose-200 space-y-2.5 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-rose-800 dark:text-rose-300 font-extrabold text-sm sm:text-base">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />
            <span>⚠️ Mandatory Profile Details Incomplete</span>
          </div>
          <p className="text-xs sm:text-sm text-rose-900 dark:text-rose-200 font-semibold leading-relaxed">
            You cannot find eligible schemes until all mandatory details are provided. Schemes require your Age, Gender, State, and Occupation to calculate accurate statutory eligibility.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {missingFields.map((item) => (
              <button
                key={item.field}
                type="button"
                onClick={() => onEditStep(item.step)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <span>Complete Step {item.step} ({item.label})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Review Summary Grid */}
      <div className="space-y-3">
        {summaryItems.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.step}
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-300 uppercase tracking-wider">
                  <Icon className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  <span>{section.title}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-0.5">
                  {section.items.map((item, iIdx) => (
                    <div key={iIdx}>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium block">
                        {item.label}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onEditStep(section.step)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-teal-50 dark:hover:bg-teal-950/70 text-slate-700 dark:text-slate-300 hover:text-teal-900 dark:hover:text-teal-300 text-xs font-bold transition-colors shrink-0 self-start sm:self-center cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{t('common.edit', undefined, 'Edit')}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust & Privacy Notice */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
        <Lock className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-teal-950 dark:text-teal-300 block mb-0.5">{t('survey.privacy_assurance_title', undefined, 'Privacy Assurance:')}</span>
          {t('survey.privacy_assurance_desc', undefined, 'Your profile signals are evaluated securely according to data minimization principles. We use these parameters solely to calculate statutory eligibility compatibility scores.')}
        </div>
      </div>
    </div>
  );
};
