import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Scheme } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Bookmark, Sparkles, ExternalLink } from 'lucide-react';
import { isSchemeSaved, toggleSaveScheme } from '../../services/storageService';
import { useTranslation } from '../../hooks/useTranslation';
import { translateSchemeContent } from '../../utils/schemeTranslator';

export const PopularSchemesSection: React.FC = () => {
  const { t, langCode } = useTranslation();
  const [popularSchemes, setPopularSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
    let isMounted = true;
    api
      .getSchemes({ page: 1 })
      .then((res) => {
        if (isMounted && res?.schemes) {
          setPopularSchemes(res.schemes.slice(0, 6));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveToggle = (e: React.MouseEvent, scheme: Scheme) => {
    e.preventDefault();
    toggleSaveScheme(scheme);
    setForceUpdate((prev) => prev + 1);
  };

  return (
    <section className="py-12 lg:py-16 bg-slate-50/60 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 relative overflow-hidden w-full max-w-full transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-5">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100/80 dark:bg-teal-950/60 text-teal-950 dark:text-teal-300 text-xs font-bold border border-teal-300 dark:border-teal-800 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>{t('popular.highImpact')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
              {t('popular.title')}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal max-w-2xl">
              {t('popular.subtitle')}
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-teal-800 dark:text-teal-400 hover:text-teal-950 dark:hover:text-teal-300 transition-all group shrink-0"
          >
            <span>{t('popular.viewAll')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Scheme Cards Grid */}
        {loading && popularSchemes.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="rounded-3xl bg-white p-7 border border-slate-200 animate-pulse space-y-4 h-72"
              >
                <div className="h-5 bg-slate-200 rounded-md w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded-md w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded-md w-full"></div>
                <div className="h-4 bg-slate-100 rounded-md w-5/6"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularSchemes.map((rawScheme) => {
              const scheme = translateSchemeContent(rawScheme, langCode);
              const isSaved = isSchemeSaved(scheme.id);
              const mainBenefit = Array.isArray(scheme.benefits) ? scheme.benefits[0] : null;

              return (
                <div
                  key={scheme.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 hover:border-teal-400 dark:hover:border-teal-600"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <StatusPill type="category" value={scheme.category} size="sm" />
                      <button
                        onClick={(e) => handleSaveToggle(e, scheme)}
                        className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                          isSaved
                            ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={isSaved ? 'Remove from Saved' : 'Save scheme'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-teal-700 dark:fill-teal-400' : ''}`} />
                      </button>
                    </div>

                    {/* Title & Department */}
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-teal-900 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                      <Link to={`/schemes/${scheme.slug}`}>{scheme.name}</Link>
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 font-medium">
                      {scheme.verification.ministryOrAuthority}
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed line-clamp-2 font-normal">
                      {scheme.shortDescription}
                    </p>

                    {/* Main Benefit Box */}
                    {mainBenefit && (
                      <div className="mt-4 p-3 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/60">
                        <span className="text-[10px] font-extrabold text-teal-900 dark:text-teal-300 uppercase tracking-wider block">
                          {t('popular.keyBenefit')}
                        </span>
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5">
                          {mainBenefit.amountOrValue || mainBenefit.title}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1 font-normal">
                          {mainBenefit.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer Link */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{t('popular.verifiedPortal')}</span>
                    </div>

                    <Link
                      to={`/schemes/${scheme.slug}`}
                      className="inline-flex items-center gap-1.5 font-extrabold text-teal-800 dark:text-teal-400 hover:text-teal-950 dark:hover:text-teal-300 group-hover:translate-x-1 transition-all"
                    >
                      <span>{t('explore.viewDetails')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

