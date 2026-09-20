import React, { useState } from 'react';
import { Scheme } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight, Trash2, GripVertical, Check, Plus, Calendar } from 'lucide-react';
import { toggleSaveScheme, addSchemeToTracker } from '../../services/storageService';
import { useTranslation } from '../../hooks/useTranslation';
import { DeadlineTicker } from '../calendar/DeadlineTicker';
import { YojanaCalendarModal } from '../calendar/YojanaCalendarModal';
import { YojanaCalendarBanner } from '../calendar/YojanaCalendarBanner';
import { getSchemeDeadline } from '../../utils/schemeDeadlines';
import { getGoogleCalendarUrl } from '../../utils/calendarSync';

interface SavedSchemesManagerProps {
  schemes: Scheme[];
  trackedSchemeIds?: string[];
  onRefresh: () => void;
  onDragStart?: (scheme: Scheme) => void;
  onDragEnd?: () => void;
}

export const SavedSchemesManager: React.FC<SavedSchemesManagerProps> = ({
  schemes,
  trackedSchemeIds = [],
  onRefresh,
  onDragStart,
  onDragEnd,
}) => {
  const { t } = useTranslation();
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const handleRemove = (id: string) => {
    toggleSaveScheme(id);
    onRefresh();
  };

  const handleToggleTrack = (scheme: Scheme) => {
    addSchemeToTracker(scheme, 'Exploring');
    onRefresh();
  };

  if (schemes.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
          <Bookmark className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.no_saved_title', undefined, 'No Saved Schemes Yet')}</h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {t('dashboard.no_saved_desc', undefined, 'Bookmark schemes while exploring to review benefits, share with family, and prepare application documents.')}
        </p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 dark:bg-teal-700 dark:hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          <span>{t('dashboard.explore_all_btn', undefined, 'Explore All Schemes')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {t('dashboard.saved_title', undefined, 'Bookmarked & Saved Schemes')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('dashboard.saved_subtitle', undefined, 'Drag a scheme card into the Guidance Tracker above or click "+ Track" to start monitoring your application milestones.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCalendarModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
            title="Open Yojana Application Calendar for saved schemes"
          >
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>Yojana Calendar</span>
          </button>
          <span className="text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800">
            {schemes.length} {t('dashboard.saved_badge', undefined, 'Saved')}
          </span>
        </div>
      </div>

      {/* Yojana Calendar & Deadline Urgency Alerts Banner for Saved Schemes */}
      <YojanaCalendarBanner
        schemes={schemes}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
        title="Saved Schemes Deadline Urgency Alerts"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schemes.map((scheme) => {
          const isTracked = trackedSchemeIds.includes(scheme.id) || trackedSchemeIds.includes(scheme.slug);

          return (
            <div
              key={scheme.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('application/json', JSON.stringify(scheme));
                e.dataTransfer.setData('schemeId', scheme.id);
                e.dataTransfer.setData('text/plain', scheme.id);
                onDragStart?.(scheme);
              }}
              onDragEnd={onDragEnd}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700 transition-all flex flex-col justify-between space-y-3 group cursor-grab active:cursor-grabbing active:opacity-75 active:scale-98"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span title="Drag to Guidance Tracker">
                      <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition-colors shrink-0" />
                    </span>
                    <StatusPill type="category" value={scheme.category} size="sm" />
                    {scheme.level && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {scheme.level}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(scheme.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title={t('dashboard.remove_bookmark_title', undefined, 'Remove bookmark')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-800 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                  <Link to={`/schemes/${scheme.slug}`} onClick={(e) => e.stopPropagation()}>
                    {scheme.name}
                  </Link>
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {scheme.shortDescription || (scheme as any)?.description || scheme.tagline}
                </p>

                <div className="pt-1 flex items-center justify-between gap-1.5 flex-wrap">
                  <DeadlineTicker scheme={scheme} variant="badge" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const d = getSchemeDeadline(scheme);
                      const url = getGoogleCalendarUrl(scheme, d);
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/50 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="Sync this saved scheme with Google Calendar"
                  >
                    <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Sync Calendar</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                {/* 1-click tracker button */}
                <button
                  type="button"
                  onClick={() => handleToggleTrack(scheme)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    isTracked
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                      : 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60'
                  }`}
                  title={isTracked ? 'Already tracked in Guidance Tracker' : 'Add to Application Guidance Tracker'}
                >
                  {isTracked ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('tracker.tracked_badge', undefined, 'In Tracker')}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('tracker.track_btn', undefined, 'Track Journey')}</span>
                    </>
                  )}
                </button>

                <Link
                  to={`/schemes/${scheme.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 font-bold text-teal-800 dark:text-teal-400 hover:text-teal-950 dark:hover:text-teal-300 group-hover:translate-x-0.5 transition-all ml-auto"
                >
                  <span>{t('scheme_card.view_details', undefined, 'View Details')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Yojana Calendar Modal for Saved Schemes */}
      <YojanaCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        schemes={schemes}
      />
    </div>
  );
};
