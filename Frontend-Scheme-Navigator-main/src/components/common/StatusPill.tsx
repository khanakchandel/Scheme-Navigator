import React from 'react';
import { SchemeCategory, ApplicationStatus } from '../../types';
import {
  GraduationCap,
  Sprout,
  Briefcase,
  HeartHandshake,
  UserCheck,
  Home,
  ShieldPlus,
  Users,
  Lightbulb,
  Coins,
  ShieldCheck,
} from 'lucide-react';

import { useTranslation } from '../../hooks/useTranslation';

interface StatusPillProps {
  type: 'category' | 'status' | 'level' | 'verified';
  value: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({
  type,
  value,
  className = '',
  size = 'md',
}) => {
  const { tp } = useTranslation();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (type === 'verified') {
    return (
      <span className={`inline-flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-800 rounded-full shadow-2xs ${sizeClasses} ${className}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>{tp('Verified Information')}</span>
      </span>
    );
  }

  if (type === 'level') {
    const isCentral = value === 'Central' || value?.toLowerCase?.().includes('central') || value?.includes?.('केंद्रीय');
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full border max-w-full shrink-0 ${sizeClasses} ${
          isCentral
            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            : 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
        } ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCentral ? 'bg-blue-600 dark:bg-blue-400' : 'bg-purple-600 dark:bg-purple-400'}`} />
        <span className="truncate">{tp(value)}</span>
      </span>
    );
  }

  if (type === 'status') {
    const getStatusStyle = (st: string) => {
      switch (st as ApplicationStatus) {
        case 'Completed':
          return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
        case 'Applied Externally':
          return 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
        case 'Ready to Apply':
          return 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800';
        case 'Documents Needed':
          return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
        case 'Exploring':
        default:
          return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      }
    };

    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${getStatusStyle(value)} ${sizeClasses} ${className}`}>
        <span className="w-2 h-2 rounded-full bg-current opacity-80" />
        <span>{tp(value)}</span>
      </span>
    );
  }

  // Category Pills
  const getCategoryIcon = (cat: SchemeCategory) => {
    switch (cat) {
      case 'Education':
        return <GraduationCap className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />;
      case 'Agriculture':
        return <Sprout className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />;
      case 'Business':
        return <Briefcase className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />;
      case 'Women & Child':
        return <HeartHandshake className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />;
      case 'Employment':
        return <UserCheck className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />;
      case 'Housing':
        return <Home className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />;
      case 'Healthcare':
        return <ShieldPlus className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />;
      case 'Social Security':
        return <Users className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />;
      case 'Skill Development':
        return <Lightbulb className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />;
      case 'Financial Assistance':
      default:
        return <Coins className="w-3.5 h-3.5 text-yellow-700 dark:text-yellow-400" />;
    }
  };

  const getCategoryBg = (cat: string) => {
    switch (cat) {
      case 'Education':
        return 'bg-blue-50/90 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Agriculture':
        return 'bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Business':
        return 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'Women & Child':
        return 'bg-rose-50/90 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'Employment':
        return 'bg-teal-50/90 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'Housing':
        return 'bg-amber-50/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Healthcare':
        return 'bg-red-50/90 dark:bg-red-950/60 text-red-900 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'Social Security':
        return 'bg-purple-50/90 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Skill Development':
        return 'bg-cyan-50/90 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    }
  };

  // Robust canonical category resolver (supports English + Indic strings)
  const resolveCanonicalCategory = (val: string): SchemeCategory => {
    if (!val) return 'Financial Assistance';
    const lower = val.toLowerCase();
    if (lower.includes('edu') || lower.includes('शिक्ष') || lower.includes('ଶିକ୍ଷା') || lower.includes('கல்வி') || lower.includes('విద్య')) return 'Education';
    if (lower.includes('agri') || lower.includes('कॄष') || lower.includes('कृष') || lower.includes('କୃଷି') || lower.includes('விவசாய') || lower.includes('వ్యవసాయ')) return 'Agriculture';
    if (lower.includes('biz') || lower.includes('business') || lower.includes('व्यवसाय') || lower.includes('ବାଣିଜ୍ୟ') || lower.includes('வணிக') || lower.includes('వ్యాపార')) return 'Business';
    if (lower.includes('women') || lower.includes('child') || lower.includes('महिला') || lower.includes('ମହିଳା') || lower.includes('மகளிர்') || lower.includes('మహిళ')) return 'Women & Child';
    if (lower.includes('employ') || lower.includes('job') || lower.includes('रोजगार') || lower.includes('ରୋଜଗାର') || lower.includes('வேலை') || lower.includes('ఉపాధి')) return 'Employment';
    if (lower.includes('hous') || lower.includes('आवास') || lower.includes('ଆବାସ') || lower.includes('வீட்டு') || lower.includes('గృహ')) return 'Housing';
    if (lower.includes('health') || lower.includes('स्वास्थ्य') || lower.includes('ସ୍ୱାସ୍ଥ୍ୟ') || lower.includes('சுகாதார') || lower.includes('ఆరోగ్య')) return 'Healthcare';
    if (lower.includes('social') || lower.includes('सुरक्षा') || lower.includes('ସୁରକ୍ଷା') || lower.includes('சமூக') || lower.includes('సామాజిక')) return 'Social Security';
    if (lower.includes('skill') || lower.includes('कौशल') || lower.includes('ଦକ୍ଷତା') || lower.includes('திறன்') || lower.includes('నైపుణ్య')) return 'Skill Development';
    return val as SchemeCategory;
  };

  const canonicalCat = resolveCanonicalCategory(value);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg border shadow-2xs max-w-full shrink-0 ${getCategoryBg(
        canonicalCat
      )} ${sizeClasses} ${className}`}
    >
      <span className="shrink-0">{getCategoryIcon(canonicalCat)}</span>
      <span className="truncate">{tp(value)}</span>
    </span>
  );
};
