import React from 'react';
import { Benefit } from '../../types';
import { IndianRupee, ShieldPlus, GraduationCap, Home, Wrench, Sparkles } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface BenefitCardProps {
  benefit: Benefit;
}

export const BenefitCard: React.FC<BenefitCardProps> = ({ benefit }) => {
  const { t, tp } = useTranslation();

  const getIcon = (type?: string) => {
    switch (type) {
      case 'Financial Assistance':
      case 'Loan & Credit':
      case 'Subsidy':
      case 'Pension':
        return <IndianRupee className="w-5 h-5 text-emerald-700" />;
      case 'Scholarship':
        return <GraduationCap className="w-5 h-5 text-blue-700" />;
      case 'Healthcare':
      case 'Insurance':
        return <ShieldPlus className="w-5 h-5 text-red-700" />;
      case 'Housing':
        return <Home className="w-5 h-5 text-amber-700" />;
      case 'Equipment':
      case 'Skill Training':
        return <Wrench className="w-5 h-5 text-cyan-700" />;
      default:
        return <Sparkles className="w-5 h-5 text-teal-700" />;
    }
  };

  const benefitType = benefit?.type || 'Financial Assistance';
  const benefitValue =
    benefit?.amountOrValue ||
    (benefit as any)?.amount ||
    (benefit as any)?.value ||
    (benefit as any)?.frequency ||
    '';

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            {getIcon(benefitType)}
          </div>
          <span className="text-[10px] font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
            {tp(benefitType)}
          </span>
        </div>

        <h4 className="text-base font-bold text-slate-900 leading-snug">
          {tp(benefit?.title || 'Scheme Benefit')}
        </h4>

        {benefit?.description && (
          <p className="text-xs text-slate-600 leading-relaxed">
            {benefit.description}
          </p>
        )}
      </div>

      {benefitValue && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">{t('scheme_detail.benefit_value_label', undefined, 'Value / Amount:')}</span>
          <span className="font-extrabold text-sm text-teal-800 font-mono">
            {benefitValue}
          </span>
        </div>
      )}
    </div>
  );
};
