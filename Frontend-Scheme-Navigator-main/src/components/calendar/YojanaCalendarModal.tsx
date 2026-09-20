import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Scheme } from '../../types';
import { getSchemeDeadline } from '../../utils/schemeDeadlines';
import { Link } from 'react-router-dom';

interface YojanaCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemes: Scheme[];
}

export const YojanaCalendarModal: React.FC<YojanaCalendarModalProps> = ({
  isOpen,
  onClose,
  schemes,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'cutoff' | 'year_round'>('all');

  const schemeDeadlines = useMemo(() => {
    return schemes.map((scheme) => ({
      scheme,
      deadline: getSchemeDeadline(scheme),
    })).sort((a, b) => {
      // Prioritize schemes with active closing cutoffs first
      if (!a.deadline.isOpenYearRound && b.deadline.isOpenYearRound) return -1;
      if (a.deadline.isOpenYearRound && !b.deadline.isOpenYearRound) return 1;
      return a.deadline.totalSeconds - b.deadline.totalSeconds;
    });
  }, [schemes]);

  const filtered = useMemo(() => {
    if (filterType === 'all') return schemeDeadlines;
    if (filterType === 'cutoff') return schemeDeadlines.filter((item) => !item.deadline.isOpenYearRound);
    return schemeDeadlines.filter((item) => item.deadline.isOpenYearRound);
  }, [schemeDeadlines, filterType]);

  const cutoffCount = useMemo(
    () => schemeDeadlines.filter((item) => !item.deadline.isOpenYearRound).length,
    [schemeDeadlines]
  );
  const yearRoundCount = useMemo(
    () => schemeDeadlines.filter((item) => item.deadline.isOpenYearRound).length,
    [schemeDeadlines]
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl my-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-950 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Official Welfare Intake & Calendar Intelligence</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Yojana Calendar & Enrollment Windows
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-xl">
            Monitor approaching scholarship submission cycles, seasonal crop insurance deadlines, and 365-day continuous enrollment welfare schemes.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="font-bold text-slate-500 dark:text-slate-400 mr-1">View:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              All Schemes ({schemeDeadlines.length})
            </button>
            <button
              onClick={() => setFilterType('cutoff')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'cutoff'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Upcoming Cutoffs ({cutoffCount})
            </button>
            <button
              onClick={() => setFilterType('year_round')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'year_round'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Open Year-Round ({yearRoundCount})
            </button>
          </div>

          <span className="text-slate-400 font-medium hidden sm:inline text-[11px]">
            Showing {filtered.length} entries
          </span>
        </div>

        {/* Deadlines List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 max-h-[60vh]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No schemes matching this filter.
            </div>
          ) : (
            filtered.map(({ scheme, deadline }) => {
              const isYearRound = deadline.isOpenYearRound;
              const isCritical = deadline.urgencyLevel === 'critical';
              const isUrgent = deadline.urgencyLevel === 'urgent';

              return (
                <div
                  key={scheme.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isYearRound ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Open Year-Round</span>
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                              : isUrgent
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{deadline.daysRemaining} days remaining</span>
                        </span>
                      )}

                      <span className="text-xs text-slate-400 font-mono">
                        {isYearRound ? 'Continuous Enrollment' : `Cutoff: ${deadline.formattedDeadline}`}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      <Link
                        to={`/schemes/${scheme.slug || scheme.id}`}
                        onClick={onClose}
                        className="hover:text-teal-800 dark:hover:text-teal-400 transition-colors"
                      >
                        {scheme.name}
                      </Link>
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {deadline.cycleName} • {deadline.cycleDescription}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link
                      to={`/schemes/${scheme.slug || scheme.id}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 transition-colors"
                    >
                      <span>View Scheme</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Synced with official Central & State Government intake schedules.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
