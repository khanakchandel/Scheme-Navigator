import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Scheme } from '../types';
import { getSavedProfile, toggleSaveScheme } from '../services/storageService';
import { SchemeDetailHero } from '../components/schemes/SchemeDetailHero';
import { BenefitCard } from '../components/schemes/BenefitCard';
import { EligibilityChecklist } from '../components/schemes/EligibilityChecklist';
import { ExplainabilityBox } from '../components/schemes/ExplainabilityBox';
import { DocumentList } from '../components/schemes/DocumentList';
import { ApplicationTimeline } from '../components/schemes/ApplicationTimeline';
import { VoiceReaderBar } from '../components/schemes/VoiceReaderBar';
import { ExternalPortalModal, getSafeOfficialUrl } from '../components/common/ExternalPortalModal';
import { StatusPill } from '../components/common/StatusPill';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useTranslation } from '../hooks/useTranslation';
import { translateSchemeContent } from '../utils/schemeTranslator';
import {
  ArrowLeft,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Store,
  MapPin,
  Navigation,
  FileCheck,
} from 'lucide-react';
import { DeadlineTicker } from '../components/calendar/DeadlineTicker';
import { KendraFinderModal } from '../components/kendra/KendraFinderModal';

export const SchemeDetailPage: React.FC = () => {
  const { t, langCode } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [related, setRelated] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKendraModalOpen, setIsKendraModalOpen] = useState(false);
  const [, setForceUpdate] = useState(0);

  const userProfile = getSavedProfile();

  const localizedScheme = useMemo(() => {
    if (!scheme) return null;
    return translateSchemeContent(scheme, langCode);
  }, [scheme, langCode]);

  useEffect(() => {
    let isMounted = true;
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .getScheme(id)
      .then((data) => {
        if (isMounted) {
          if (data) {
            setScheme(data);
            // Fetch related schemes by category
            if (data.category) {
              api
                .getSchemes({ category: data.category, page: 1 })
                .then((res) => {
                  if (isMounted && res?.schemes) {
                    const filtered = res.schemes
                      .filter((s) => s.id !== data.id && s.slug !== data.slug)
                      .slice(0, 3);
                    setRelated(filtered);
                  }
                })
                .catch(() => {});
            }
          } else {
            setScheme(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) setScheme(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
          <p className="text-xs font-semibold">Loading scheme details...</p>
        </div>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-4 max-w-md shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{t('scheme_detail.not_found_title', undefined, 'Scheme Not Found')}</h2>
          <p className="text-xs text-slate-500">
            {t('scheme_detail.not_found_desc', undefined, 'The requested scheme may have been archived or updated in our catalog.')}
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 text-white text-xs font-bold rounded-xl"
          >
            <span>{t('scheme_detail.explore_all_btn', undefined, 'Explore All Schemes')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveToggle = () => {
    toggleSaveScheme(scheme);
    setForceUpdate((prev) => prev + 1);
  };

  const activeScheme = localizedScheme || scheme;

  const safeTags = Array.isArray(activeScheme.tags) ? activeScheme.tags : [];
  const safeBenefits = Array.isArray(activeScheme.benefits) ? activeScheme.benefits : [];
  const safeDocuments = Array.isArray(activeScheme.documents) ? activeScheme.documents : [];
  const safeVerification = activeScheme.verification || {
    sourceDepartment: 'Government Department',
    ministryOrAuthority: 'Government Ministry',
    lastUpdated: 'Recently Verified',
    officialPortalUrl: '',
    helpline: '1800-111-555',
    isOfficialVerified: true,
  };

  return (
    <ErrorBoundary>
      <div className="bg-slate-50/80 dark:bg-slate-950 min-h-screen py-6 sm:py-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Breadcrumbs & Back Navigation */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-teal-900 dark:hover:text-teal-400 font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('scheme_detail.back_btn', undefined, 'Back to Schemes')}</span>
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <Link to="/" className="hover:underline">{t('nav.home', undefined, 'Home')}</Link>
              <span>/</span>
              <Link to="/explore" className="hover:underline">{t('nav.schemes', undefined, 'Schemes')}</Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-bold truncate max-w-[200px]">{activeScheme.shortName || activeScheme.name}</span>
            </div>
          </div>

          {/* 1. Scheme Hero with Verified Metadata */}
          <SchemeDetailHero
            scheme={activeScheme}
            onOpenApplyModal={() => setIsModalOpen(true)}
            onSaveToggle={handleSaveToggle}
          />

          {/* Voice Reader Audio Player for Scheme Information */}
          <VoiceReaderBar scheme={activeScheme} />

          {/* Scheme Application Deadline Urgency & Countdown Ticker */}
          <DeadlineTicker scheme={activeScheme} variant="card" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Column (8 Cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* 2. What Is This Scheme? (Plain Language Explanation) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">
                    {t('scheme_detail.summary_badge', undefined, 'Plain Language Summary')}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {t('scheme_detail.summary_title', undefined, 'What Is This Scheme?')}
                  </h3>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeScheme.detailedDescription || activeScheme.shortDescription || activeScheme.tagline}
                </p>

                {safeTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {safeTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Key Benefits Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('scheme_detail.benefits_title', undefined, 'Key Scheme Benefits')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('scheme_detail.benefits_desc', undefined, 'Direct financial support, subsidies, or institutional entitlements provided under this scheme.')}
                  </p>
                </div>

                {safeBenefits.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {safeBenefits.map((benefit, idx) => (
                      <BenefitCard key={idx} benefit={benefit} />
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    {t('scheme_detail.benefits_available', undefined, 'Government benefits and direct entitlements apply as notified under scheme guidelines.')}
                  </div>
                )}
              </div>

              {/* 4. Who May Qualify? (Eligibility Checklist) */}
              <EligibilityChecklist scheme={activeScheme} userProfile={userProfile} />

              {/* 5. Documents You May Need */}
              <DocumentList documents={safeDocuments} />

              {/* 6. Step-by-Step Application Roadmap */}
              <ApplicationTimeline
                scheme={activeScheme}
                onOpenApplyModal={() => setIsModalOpen(true)}
              />
            </div>

            {/* Sidebar Column (4 Cols) */}
            <div className="lg:col-span-4 space-y-6 sticky top-24">
              {/* Nearest Kendra & 1-Click Printable Checklist Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  <Store className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  <span>Offline Kendra & CSC Assistance</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Need in-person support? Visit an authorized Common Service Centre (CSC), e-Mitra, or MeeSeva for biometric e-KYC and offline form filling.
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsKendraModalOpen(true)}
                    className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-emerald-300" />
                    <span>Find Nearest Kendra Centers</span>
                  </button>
                </div>
              </div>

              {/* Explainability Box ("Why It Was Recommended To You") */}
              <ExplainabilityBox scheme={activeScheme} userProfile={userProfile} />

              {/* Official Source & Verification Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{t('scheme_detail.authenticity_title', undefined, 'Information Authenticity')}</span>
                </div>

                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="font-semibold text-slate-400 dark:text-slate-500 block">{t('scheme_detail.department_label', undefined, 'Department:')}</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{safeVerification.sourceDepartment || safeVerification.ministryOrAuthority}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 dark:text-slate-500 block">{t('scheme_detail.official_portal_label', undefined, 'Official Website:')}</span>
                    <a
                      href={getSafeOfficialUrl(scheme)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-bold text-teal-800 dark:text-teal-400 hover:underline break-all"
                    >
                      {getSafeOfficialUrl(scheme)}
                    </a>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 dark:text-slate-500 block">{t('scheme_detail.last_verified_label', undefined, 'Last Verified Date:')}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{safeVerification.lastUpdated || 'Current Fiscal Year'}</span>
                  </div>
                </div>

                <a
                  href={getSafeOfficialUrl(scheme)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-teal-800 hover:bg-teal-900 dark:bg-teal-700 dark:hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{t('scheme_detail.visit_portal_btn', undefined, 'Visit Official Portal')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Related Schemes */}
              {related.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {t('scheme_detail.similar_schemes', undefined, 'Similar Schemes to Explore')}
                  </h4>

                  <div className="space-y-3">
                    {related.map((rel) => (
                      <Link
                        key={rel.id}
                        to={`/schemes/${rel.slug || rel.id}`}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-600 block transition-all group"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <StatusPill type="category" value={rel.category} size="sm" />
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{rel.level}</span>
                        </div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-teal-800 dark:group-hover:text-teal-300 transition-colors line-clamp-1">
                          {rel.name}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* External Official Portal Confirmation Modal */}
        <ExternalPortalModal
          scheme={scheme}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />

        {/* Kendra Finder Modal */}
        <KendraFinderModal
          isOpen={isKendraModalOpen}
          onClose={() => setIsKendraModalOpen(false)}
          preselectedScheme={activeScheme}
        />
      </div>
    </ErrorBoundary>
  );
};
