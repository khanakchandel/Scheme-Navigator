import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  BellRing,
  Download,
} from 'lucide-react';
import { Scheme } from '../../types';
import {
  SchemeDeadlineInfo,
  getSchemeDeadline,
} from '../../utils/schemeDeadlines';
import {
  getGoogleCalendarUrl,
  downloadIcsFile,
} from '../../utils/calendarSync';
import { useTranslation } from '../../hooks/useTranslation';

interface YojanaCalendarBannerProps {
  schemes: Scheme[];
  onOpenCalendar: () => void;
  title?: string;
  className?: string;
}

export const YojanaCalendarBanner: React.FC<YojanaCalendarBannerProps> = ({
  schemes,
  onOpenCalendar,
  title,
  className = '',
}) => {
  const { t } = useTranslation();
  const [, setTick] = useState(0);

  // Live second-by-second ticker update
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute deadline intelligence for all provided schemes
  const deadlineItems = useMemo(() => {
    if (!schemes || schemes.length === 0) return [];

    return schemes
      .map((scheme) => ({
        scheme,
        deadline: getSchemeDeadline(scheme),
      }))
      .sort((a, b) => {
        // Prioritize active cutoff schemes first, sorted by closest deadline
        if (!a.deadline.isOpenYearRound && b.deadline.isOpenYearRound) return -1;
        if (a.deadline.isOpenYearRound && !b.deadline.isOpenYearRound) return 1;
        return a.deadline.totalSeconds - b.deadline.totalSeconds;
      });
  }, [schemes]);

  // Separate cutoff schemes from continuous enrollment
  const cutoffItems = useMemo(
    () => deadlineItems.filter((item) => !item.deadline.isOpenYearRound && !item.deadline.isExpired),
    [deadlineItems]
  );

  const yearRoundCount = useMemo(
    () => deadlineItems.filter((item) => item.deadline.isOpenYearRound).length,
    [deadlineItems]
  );

  // Pick the most urgent scheme for the primary countdown ticker
  const primaryItem = cutoffItems[0] || deadlineItems[0];

  if (!primaryItem) return null;

  const { scheme: primaryScheme, deadline: primaryDeadline } = primaryItem;
  const hasCutoffs = cutoffItems.length > 0;
  const isCritical = primaryDeadline.urgencyLevel === 'critical';
  const isUrgent = primaryDeadline.urgencyLevel === 'urgent';

  const handleGoogleCalendarSync = (scheme: Scheme, deadline: SchemeDeadlineInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getGoogleCalendarUrl(scheme, deadline);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleIcsDownload = (scheme: Scheme, deadline: SchemeDeadlineInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadIcsFile(scheme, deadline);
  };

  return (
    <div
      className={`rounded-3xl border transition-all overflow-hidden shadow-sm ${
        hasCutoffs && isCritical
          ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 border-rose-500/40 text-white'
          : hasCutoffs && isUrgent
          ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border-amber-500/40 text-white'
          : 'bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 border-teal-500/30 text-white'
      } ${className}`}
    >
      <div className="p-5 sm:p-7 space-y-5">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-2xl ${
                hasCutoffs && isCritical
                  ? 'bg-rose-500/20 text-rose-300'
                  : hasCutoffs
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              <Calendar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  {title || 'Yojana Calendar & Deadline Alerts'}
                </span>
                {hasCutoffs && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isCritical
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {cutoffItems.length} {cutoffItems.length === 1 ? 'Approaching Deadline' : 'Approaching Deadlines'}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-snug">
                {hasCutoffs
                  ? `Application Deadline Approaching: ${primaryScheme.name}`
                  : 'All Schemes Active • Open Year-Round Continuous Enrollment'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCalendar}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/15 shadow-xs"
            >
              <span>View Full Calendar ({deadlineItems.length})</span>
              <ChevronRight className="w-3.5 h-3.5 text-teal-300" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {hasCutoffs ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Scheme Summary & Cutoff Details (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs ${
                    isCritical
                      ? 'bg-rose-600 text-white'
                      : isUrgent
                      ? 'bg-amber-600 text-white'
                      : 'bg-teal-700 text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {isCritical
                      ? 'Critical - Closing in 7 Days'
                      : isUrgent
                      ? 'Closing This Month'
                      : 'Active Cycle'}
                  </span>
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  Official Cutoff:{' '}
                  <strong className="text-white font-bold">{primaryDeadline.formattedDeadline}</strong>
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-teal-300 font-semibold truncate max-w-[200px]">
                  {primaryDeadline.cycleName}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed line-clamp-2">
                {primaryDeadline.cycleDescription || primaryScheme.tagline}
              </p>

              {/* Action Buttons: Direct 1-Click Google Calendar Sync */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={(e) => handleGoogleCalendarSync(primaryScheme, primaryDeadline, e)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md hover:scale-102 transition-all cursor-pointer"
                  title="Add this scheme deadline directly to your Google Calendar"
                >
                  <Calendar className="w-4 h-4 text-slate-950" />
                  <span>Sync with Google Calendar</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => handleIcsDownload(primaryScheme, primaryDeadline, e)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-white/15"
                  title="Download .ics calendar event file for Outlook or Apple Calendar"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .ics</span>
                </button>
              </div>
            </div>

            {/* Right: Live Digital Countdown Ticker (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center sm:items-end justify-center">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Time Remaining To Apply:
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Days */}
                <div className="flex flex-col items-center justify-center w-14 sm:w-16 h-16 sm:h-18 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-inner">
                  <span className="font-mono text-xl sm:text-2xl font-black text-white">
                    {String(primaryDeadline.daysRemaining).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-teal-300">Days</span>
                </div>

                <span className="font-mono text-xl font-bold text-slate-400">:</span>

                {/* Hours */}
                <div className="flex flex-col items-center justify-center w-14 sm:w-16 h-16 sm:h-18 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-inner">
                  <span className="font-mono text-xl sm:text-2xl font-black text-white">
                    {String(primaryDeadline.hoursRemaining).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-teal-300">Hours</span>
                </div>

                <span className="font-mono text-xl font-bold text-slate-400">:</span>

                {/* Mins */}
                <div className="flex flex-col items-center justify-center w-14 sm:w-16 h-16 sm:h-18 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-inner">
                  <span className="font-mono text-xl sm:text-2xl font-black text-white">
                    {String(primaryDeadline.minutesRemaining).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-teal-300">Mins</span>
                </div>

                <span className="font-mono text-xl font-bold text-slate-400">:</span>

                {/* Secs */}
                <div className="flex flex-col items-center justify-center w-14 sm:w-16 h-16 sm:h-18 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-inner">
                  <span
                    className={`font-mono text-xl sm:text-2xl font-black ${
                      isCritical ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {String(primaryDeadline.secondsRemaining).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-teal-300">Secs</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Case B: All Schemes are Open Year-Round */
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    Continuous Open Enrollment (365 Days)
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  All {yearRoundCount} welfare schemes (DBT, Ayushman Bharat, PM-KISAN, PM Mudra, Housing, Pensions)
                  accept applications year-round without cutoff deadlines. You can prepare documents and apply anytime.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => handleGoogleCalendarSync(primaryScheme, primaryDeadline, e)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Add application preparation reminder to Google Calendar"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-950" />
                <span>Add Reminder to Google Calendar</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Bottom Strip: If there are multiple cutoff deadlines, show mini badges */}
        {cutoffItems.length > 1 && (
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-400 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>Other Approaching Cutoffs:</span>
            </span>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {cutoffItems.slice(1, 4).map((item) => (
                <div
                  key={item.scheme.id || item.scheme.slug}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white shrink-0 transition-colors"
                >
                  <span className="font-semibold truncate max-w-[150px]">{item.scheme.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    {item.deadline.daysRemaining}d left ({item.deadline.formattedDeadline})
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleGoogleCalendarSync(item.scheme, item.deadline, e)}
                    className="p-1 hover:text-emerald-300 transition-colors cursor-pointer"
                    title="Add to Google Calendar"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
