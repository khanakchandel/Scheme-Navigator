import React from 'react';
import { UserProfile } from '../../types';
import { Link } from 'react-router-dom';
import { User, MapPin, Briefcase, IndianRupee, Edit3, Compass } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

import { calculateProfileCompletion } from '../../services/storageService';

interface ProfileCompletionCardProps {
  profile: UserProfile | null;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({ profile }) => {
  const { t, tp, tState, tOccupation } = useTranslation();

  const completionPercent = calculateProfileCompletion(profile);

  return (
    <div className="bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-teal-800/40 shadow-xl relative overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/80 text-emerald-300 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>{t('dashboard.active_citizen_profile', undefined, 'Active Citizen Profile')}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            {profile?.name || t('common.user', undefined, 'User')}
          </h3>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-teal-100/90">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              {profile?.age || 20} {t('common.yrs', undefined, 'Yrs')} • {profile?.gender ? tp(profile.gender.toUpperCase()) : tp('MALE')}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {profile?.state ? tState(profile.state) : tState('Haryana')} ({tp(profile?.areaType || 'Urban')})
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              {tOccupation(profile?.employmentType || 'Student')}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
              {profile?.incomeRange || '₹1–2.5 lakh'}
            </span>
          </div>
        </div>

        {/* Completion Progress & Action */}
        <div className="bg-teal-900/40 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-teal-700/50 flex flex-col items-center sm:items-end gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-teal-200 font-medium">{t('dashboard.profile_calibration', undefined, 'Profile Calibration')}</div>
              <div className="text-base font-bold text-white">{completionPercent}% {t('dashboard.complete', undefined, 'Complete')}</div>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-emerald-400 flex items-center justify-center font-bold text-xs text-emerald-300">
              {completionPercent}%
            </div>
          </div>

          <Link
            to="/survey"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t('dashboard.recalibrate_profile_btn', undefined, 'Update / Recalibrate Profile')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
