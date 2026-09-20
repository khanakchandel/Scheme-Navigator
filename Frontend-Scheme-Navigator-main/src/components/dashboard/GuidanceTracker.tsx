import React, { useState } from 'react';
import { TrackerItem, ApplicationStatus, Scheme } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { Link } from 'react-router-dom';
import {
  Clock,
  Trash2,
  ExternalLink,
  ArrowRight,
  Info,
  PlusCircle,
  FileCheck2,
  Globe,
} from 'lucide-react';
import { removeTrackerItem, updateTrackerStatus } from '../../services/storageService';
import { useTranslation } from '../../hooks/useTranslation';

interface GuidanceTrackerProps {
  items: TrackerItem[];
  onRefresh: () => void;
  isDragActive?: boolean;
  onDropScheme?: (scheme: Scheme) => void;
}

export const GuidanceTracker: React.FC<GuidanceTrackerProps> = ({
  items,
  onRefresh,
  isDragActive = false,
  onDropScheme,
}) => {
  const { t, tStatus } = useTranslation();
  const [isOver, setIsOver] = useState(false);

  const statuses: ApplicationStatus[] = [
    'Exploring',
    'Documents Needed',
    'Ready to Apply',
    'Applied Externally',
    'Completed',
  ];

  const handleStatusChange = (schemeId: string, schemeName: string, category: any, newStatus: ApplicationStatus) => {
    updateTrackerStatus(schemeId, schemeName, category, newStatus);
    onRefresh();
  };

  const handleRemove = (schemeId: string) => {
    removeTrackerItem(schemeId);
    onRefresh();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);

    let parsedScheme: Scheme | null = null;
    try {
      const rawJson = e.dataTransfer.getData('application/json');
      if (rawJson) {
        parsedScheme = JSON.parse(rawJson);
      }
    } catch {
      // ignore
    }

    const schemeId = parsedScheme?.id || e.dataTransfer.getData('schemeId') || e.dataTransfer.getData('text/plain');

    if (onDropScheme) {
      if (parsedScheme && parsedScheme.id) {
        onDropScheme(parsedScheme);
      } else if (schemeId) {
        onDropScheme({ id: schemeId } as Scheme);
      }
    }
  };

  const dropZoneClass = isOver
    ? 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-400 ring-offset-2'
    : isDragActive
    ? 'border-teal-400 bg-teal-50/40 border-dashed animate-pulse'
    : 'border-slate-200';

  if (items.length === 0) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-3xl p-8 sm:p-12 border-2 text-center space-y-4 shadow-xs transition-all duration-200 ${dropZoneClass} ${
          isOver ? '' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto transition-colors ${
            isOver ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-200' : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
          }`}
        >
          {isOver ? <PlusCircle className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {isOver
            ? t('tracker.release_to_add', undefined, 'Release to Add Scheme to Tracker')
            : isDragActive
            ? t('tracker.drop_here', undefined, 'Drop Saved Scheme Here to Track')
            : t('tracker.empty_title', undefined, 'No Applications in Guidance Tracker Yet')}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {isOver || isDragActive
            ? t(
                'tracker.drag_hint',
                undefined,
                'The scheme will be added with full details to your guidance tracker at the "Exploring" stage.'
              )
            : t(
                'tracker.empty_desc',
                undefined,
                'Drag any saved scheme card from below or click "+ Track Journey" to organize documents, monitor readiness, and access official application portals.'
              )}
        </p>
        {!isDragActive && (
          <Link
            to="/recommendations"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 dark:bg-teal-700 dark:hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            <span>{t('tracker.explore_btn', undefined, 'Explore Recommended Schemes')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {t('tracker.title', undefined, 'Application Guidance & Journey Tracker')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t(
              'tracker.subtitle',
              undefined,
              'Track required documents, status stages, and access direct official portal application links.'
            )}
          </p>
        </div>
        <span className="text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800">
          {items.length} {t('tracker.active', undefined, 'Active')}{' '}
          {items.length === 1 ? t('common.scheme', undefined, 'Scheme') : t('common.schemes', undefined, 'Schemes')}
        </span>
      </div>

      {/* Drag active banner / drop zone */}
      {isDragActive && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-4 px-5 text-sm font-semibold transition-all duration-150 ${
            isOver
              ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-300 ring-offset-1'
              : 'border-teal-300 bg-teal-50/50 text-teal-600'
          }`}
        >
          <PlusCircle className="w-5 h-5 shrink-0" />
          <span>
            {isOver
              ? t('tracker.release_to_add', undefined, 'Release to add scheme to tracker')
              : t('tracker.drop_scheme_here', undefined, 'Drop scheme here to add to guidance tracker')}
          </span>
        </div>
      )}

      {/* Tracked Schemes List with Rich Cards */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            {/* Scheme Info & Details */}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill type="category" value={item.category} size="sm" />
                <StatusPill type="status" value={item.status} size="sm" />
                {item.level && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {item.level}
                  </span>
                )}
                {item.totalDocumentsCount !== undefined && item.totalDocumentsCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <FileCheck2 className="w-3 h-3" />
                    <span>
                      {item.preparedDocuments.length}/{item.totalDocumentsCount} Docs Prepared
                    </span>
                  </span>
                )}
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                <Link
                  to={`/schemes/${item.schemeId}`}
                  className="hover:text-teal-800 dark:hover:text-teal-400 transition-colors"
                  title={item.schemeName}
                >
                  {item.schemeName}
                </Link>
              </h4>

              {item.shortDescription && (
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {item.shortDescription}
                </p>
              )}

              {item.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                  "{item.notes}"
                </p>
              )}
            </div>

            {/* Stage Selector, Direct Portal Link & Actions */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {t('tracker.update_stage_label', undefined, 'Update Stage:')}
                </label>
                <select
                  value={item.status}
                  onChange={(e) =>
                    handleStatusChange(
                      item.schemeId,
                      item.schemeName,
                      item.category,
                      e.target.value as ApplicationStatus
                    )
                  }
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-teal-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-hidden cursor-pointer"
                >
                  {statuses.map((st) => (
                    <option key={st} value={st} className="dark:bg-slate-800 dark:text-white">
                      {tStatus(st)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Direct Official Portal Button (if URL available) */}
              {item.officialPortalUrl && (
                <a
                  href={item.officialPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-colors self-end"
                  title="Open Official Portal / Apply Link"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Official Portal</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}

              <div className="flex items-center gap-1 self-end">
                <Link
                  to={`/schemes/${item.schemeId}`}
                  className="p-2 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  title={t('tracker.view_details_title', undefined, 'View Scheme Details')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => handleRemove(item.schemeId)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  title={t('tracker.remove_title', undefined, 'Remove from tracker')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          <strong>{t('tracker.reminder_title', undefined, 'Reminder:')}</strong>{' '}
          {t(
            'tracker.reminder_desc',
            undefined,
            'SchemeNavigator is a navigation guidance platform. All application processing, biometric approvals, and funds transfers are executed by the designated government department.'
          )}
        </span>
      </div>
    </div>
  );
};
