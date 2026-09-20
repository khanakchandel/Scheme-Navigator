import React, { useState } from 'react';
import { Scheme, ApplicationStatus } from '../../types';
import {
  ExternalLink,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  BookmarkCheck,
} from 'lucide-react';
import { updateTrackerStatus } from '../../services/storageService';
import { useTranslation } from '../../hooks/useTranslation';
import { getSafeOfficialUrl } from '../common/ExternalPortalModal';

interface ApplicationTimelineProps {
  scheme: Scheme;
  onOpenApplyModal?: () => void;
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  scheme,
  onOpenApplyModal: _onOpenApplyModal,
}) => {
  const { t } = useTranslation();
  const [trackerAdded, setTrackerAdded] = useState(false);

  const safeSteps = Array.isArray(scheme?.applicationSteps) ? scheme.applicationSteps : [];
  const deptName = scheme?.verification?.sourceDepartment || scheme?.verification?.ministryOrAuthority || 'Official Department';

  const handleAddToTracker = (status: ApplicationStatus = 'Ready to Apply') => {
    updateTrackerStatus(scheme.id || scheme.slug, scheme.name, scheme.category, status, 'Tracking guidance steps on SchemeNavigator');
    setTrackerAdded(true);
    setTimeout(() => setTrackerAdded(false), 3000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {t('scheme_detail.how_to_apply_title', undefined, 'How to Apply (Application Journey)')}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('scheme_detail.how_to_apply_subtitle', undefined, 'Follow this verified step-by-step roadmap to complete your registration on the government portal.')}
          </p>
        </div>

        <button
          onClick={() => handleAddToTracker('Ready to Apply')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            trackerAdded
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200'
          }`}
        >
          {trackerAdded ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <PlusCircle className="w-4 h-4 text-teal-700" />}
          <span>{trackerAdded ? t('scheme_detail.added_to_tracker', undefined, 'Added to Tracker') : t('scheme_detail.track_in_dashboard', undefined, 'Track in My Dashboard')}</span>
        </button>
      </div>

      {/* Steps Timeline */}
      {safeSteps.length > 0 ? (
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 sm:before:left-6 before:w-0.5 before:bg-slate-200">
          {safeSteps.map((step, idx) => {
            const stepNum = step.stepNumber || idx + 1;
            return (
              <div key={stepNum} className="relative flex items-start gap-4 sm:gap-6 group">
                {/* Step Number Circle */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-800 text-white font-mono font-extrabold text-sm sm:text-base flex items-center justify-center shrink-0 shadow-md ring-4 ring-white z-10">
                  {stepNum < 10 ? `0${stepNum}` : stepNum}
                </div>

                {/* Step Content Card */}
                <div className="flex-1 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 group-hover:border-teal-300 group-hover:bg-teal-50/30 transition-all space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                      {step.title || `Step ${stepNum}`}
                    </h4>
                    {step.actionUrl && (
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                        {t('scheme_detail.official_link_badge', undefined, 'Official Link')}
                      </span>
                    )}
                  </div>

                  {step.description && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  )}

                  {step.tips && (
                    <div className="p-2.5 rounded-xl bg-amber-50/80 text-[11px] text-amber-900 border border-amber-200/60 flex items-start gap-2 mt-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>{t('scheme_detail.helpful_tip', undefined, 'Helpful Tip:')}</strong> {step.tips}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 border border-slate-200">
          {t('scheme_detail.standard_application_flow', undefined, 'Visit the official scheme portal and follow the standard online beneficiary registration flow.')}
        </div>
      )}

      {/* Official Government Exit Callout */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-900 to-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>{t('scheme_detail.ready_to_submit', undefined, 'Ready to Submit Application?')}</span>
          </div>
          <h4 className="text-lg font-bold text-white">
            {t('scheme_detail.continue_to_prefix', undefined, 'Continue to')} {deptName}
          </h4>
          <p className="text-xs text-slate-300 max-w-lg">
            {t('scheme_detail.submission_notice', undefined, 'Application submission occurs directly on the official secured government portal. SchemeNavigator never charges any fees.')}
          </p>
        </div>

        <a
          href={getSafeOfficialUrl(scheme)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-950/40 hover:shadow-xl transition-all shrink-0 cursor-pointer w-full sm:w-auto"
        >
          <span>{t('scheme_detail.go_to_portal_btn', undefined, 'Go to Official Application Portal')}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
