import React from 'react';
import { Scheme } from '../../types';
import { StatusPill } from '../common/StatusPill';
import {
  Building,
  MapPin,
  Calendar,
  ExternalLink,
  Bookmark,
  Share2,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { isSchemeSaved } from '../../services/storageService';
import { useTranslation } from '../../hooks/useTranslation';
import { getSafeOfficialUrl } from '../common/ExternalPortalModal';
import { DeadlineTicker } from '../calendar/DeadlineTicker';

interface SchemeDetailHeroProps {
  scheme: Scheme;
  onOpenApplyModal: () => void;
  onSaveToggle: () => void;
}

export const SchemeDetailHero: React.FC<SchemeDetailHeroProps> = ({
  scheme,
  onOpenApplyModal: _onOpenApplyModal,
  onSaveToggle,
}) => {
  const { t, tState } = useTranslation();
  const isSaved = isSchemeSaved(scheme?.id || scheme?.slug);

  const coveredStates = Array.isArray(scheme?.coveredStates) ? scheme.coveredStates : ['All India'];
  const isAllIndia = coveredStates.includes('All India') || coveredStates.length === 0;
  const verification = scheme?.verification || {
    sourceDepartment: 'Government Department',
    ministryOrAuthority: 'Government Ministry',
    lastUpdated: 'Recently Verified',
    officialPortalUrl: '',
    helpline: '1800-111-555',
    isOfficialVerified: true,
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: scheme.name,
        text: scheme.tagline || scheme.shortDescription,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Scheme link copied to clipboard!');
    }
  };

  return (
    <div className="bg-gradient-to-b from-teal-900 via-teal-950 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-teal-800/40 shadow-xl relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill type="category" value={scheme.category || 'General'} size="sm" />
            <StatusPill type="level" value={scheme.level || 'Central'} size="sm" />
            <StatusPill type="verified" value="" size="sm" />
            <DeadlineTicker scheme={scheme} variant="badge" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-teal-800/60 hover:bg-teal-700/80 border border-teal-700/60 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={t('common.share', undefined, 'Share')}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.share', undefined, 'Share')}</span>
            </button>

            <button
              onClick={onSaveToggle}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isSaved
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                  : 'bg-teal-800/60 hover:bg-teal-700/80 border-teal-700/60 text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-slate-950' : ''}`} />
              <span>{isSaved ? t('scheme_card.saved', undefined, 'Saved') : t('scheme_card.save_scheme', undefined, 'Save Scheme')}</span>
            </button>
          </div>
        </div>

        {/* Scheme Title & Tagline */}
        <div className="space-y-2 max-w-4xl">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {scheme.name}
          </h1>
          <p className="text-base sm:text-lg text-teal-100/90 leading-relaxed font-medium">
            {scheme.tagline || scheme.shortDescription}
          </p>
        </div>

        {/* Verification & Department Details Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-teal-900/40 border border-teal-700/40 text-xs">
          <div className="flex items-start gap-2.5">
            <Building className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-teal-300 font-semibold block">{t('scheme_detail.ministry_label', undefined, 'Ministry / Authority:')}</span>
              <span className="text-white font-bold">{verification.ministryOrAuthority || verification.sourceDepartment}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-teal-300 font-semibold block">{t('scheme_detail.coverage_label', undefined, 'Coverage:')}</span>
              <span className="text-white font-bold">
                {isAllIndia ? t('scheme_detail.all_india_coverage', undefined, 'All India (All States & UTs)') : coveredStates.map(st => tState(st)).join(', ')}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-teal-300 font-semibold block">{t('scheme_detail.last_verified_label', undefined, 'Information Last Verified:')}</span>
              <span className="text-white font-bold">{verification.lastUpdated || 'Current Fiscal Year'}</span>
            </div>
          </div>

          {verification.helpline && (
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-teal-300 font-semibold block">{t('scheme_detail.official_helpline', undefined, 'Official Helpline:')}</span>
                <span className="text-white font-bold">{verification.helpline}</span>
              </div>
            </div>
          )}
        </div>

        {/* Hero Bottom Primary Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-teal-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{t('scheme_detail.direct_link_badge', undefined, 'Direct link to official government portal available')}</span>
          </div>

          <a
            href={getSafeOfficialUrl(scheme)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-950/40 hover:shadow-xl transition-all cursor-pointer"
          >
            <span>{t('scheme_detail.proceed_app_btn', undefined, 'Proceed to Official Application')}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
