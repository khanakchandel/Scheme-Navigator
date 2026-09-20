import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  AlertTriangle,
  Download,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { Scheme } from '../../types';
import {
  SchemeDeadlineInfo,
  getSchemeDeadline,
} from '../../utils/schemeDeadlines';
import {
  downloadIcsFile,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
} from '../../utils/calendarSync';

interface DeadlineTickerProps {
  scheme: Partial<Scheme>;
  variant?: 'card' | 'badge' | 'compact';
  onOpenCalendarModal?: () => void;
}

export const DeadlineTicker: React.FC<DeadlineTickerProps> = ({
  scheme,
  variant = 'badge',
}) => {
  const [deadline, setDeadline] = useState<SchemeDeadlineInfo>(() =>
    getSchemeDeadline(scheme)
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Live second-by-second countdown for schemes with deadlines
  useEffect(() => {
    if (deadline.isOpenYearRound) return; // No ticking needed for year-round open enrollment

    const timer = setInterval(() => {
      setDeadline(getSchemeDeadline(scheme));
    }, 1000);

    return () => clearInterval(timer);
  }, [scheme, deadline.isOpenYearRound]);

  const handleIcsDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    downloadIcsFile(scheme, deadline);
    setIsDropdownOpen(false);
  };

  const handleGoogleCalendar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getGoogleCalendarUrl(scheme, deadline);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsDropdownOpen(false);
  };

  const handleOutlookCalendar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getOutlookCalendarUrl(scheme, deadline);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsDropdownOpen(false);
  };

  // 1. Badge Variant (Used inside SchemeCard & Compact Lists)
  if (variant === 'badge') {
    if (deadline.isOpenYearRound) {
      return (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs"
          title="Continuous Enrollment: Open 365 days a year with no closing cut-off date"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Open Year-Round (Active)</span>
        </div>
      );
    }

    const isCritical = deadline.urgencyLevel === 'critical';
    const isUrgent = deadline.urgencyLevel === 'urgent';

    return (
      <div
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-[11px] border transition-all ${
          isCritical
            ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 shadow-2xs'
            : isUrgent
            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        }`}
        title={`${deadline.cycleName}: Applications close on ${deadline.formattedDeadline}`}
      >
        <Clock
          className={`w-3.5 h-3.5 ${
            isCritical ? 'text-rose-600 animate-pulse' : isUrgent ? 'text-amber-600' : 'text-emerald-600'
          }`}
        />
        <span>
          {isCritical
            ? `Closing: ${deadline.daysRemaining}d ${deadline.hoursRemaining}h left`
            : isUrgent
            ? `Deadline: ${deadline.daysRemaining}d left (${deadline.formattedDeadline})`
            : `Closes: ${deadline.formattedDeadline}`}
        </span>
      </div>
    );
  }

  // 2. Card Variant - Case A: Open Year-Round (Continuous Enrollment)
  if (deadline.isOpenYearRound) {
    return (
      <div className="rounded-3xl p-5 sm:p-6 border transition-all relative overflow-hidden bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border-emerald-200 dark:border-emerald-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Ongoing Intake Details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-700 text-white shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Open Year-Round • Active Enrollment</span>
              </span>

              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold hidden sm:inline">
                No Closing Cutoff Date
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
              Continuous Government Intake (Open 365 Days)
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              {deadline.cycleDescription}
            </p>
          </div>

          {/* Right: Informational Highlights */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex flex-col items-center justify-center px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl shadow-2xs text-center min-w-[105px]">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Always Open
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                365 Days / Year
              </span>
            </div>

            <div className="flex flex-col items-center justify-center px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl shadow-2xs text-center min-w-[105px]">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Online & CSC
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                Direct Submission
              </span>
            </div>
          </div>
        </div>

        {/* Action Strip: Direct 1-Click Google Calendar Sync + More Options */}
        <div className="mt-4 pt-3.5 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Sync application reminder directly with your calendar:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGoogleCalendar}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Add this reminder directly to Google Calendar"
            >
              <Calendar className="w-3.5 h-3.5 text-white" />
              <span>Add to Google Calendar</span>
              <ExternalLink className="w-3 h-3 text-white/80" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
                title="More calendar formats (Outlook, .ics)"
              >
                <span>More</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 py-1 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={handleOutlookCalendar}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                  >
                    <span>Microsoft Outlook</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={handleIcsDownload}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                  >
                    <span>Download .ics File</span>
                    <Download className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Card Variant - Case B: Fixed / Seasonal Cutoff Schemes (Scholarships, Crop Insurance)
  const isCritical = deadline.urgencyLevel === 'critical';
  const isUrgent = deadline.urgencyLevel === 'urgent';

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 border transition-all relative overflow-hidden ${
        isCritical
          ? 'bg-gradient-to-br from-rose-50/90 via-white to-amber-50/50 dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 border-rose-300 dark:border-rose-800 shadow-sm'
          : isUrgent
          ? 'bg-gradient-to-br from-amber-50/90 via-white to-teal-50/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border-amber-300 dark:border-amber-800 shadow-sm'
          : 'bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/50 dark:from-teal-950/30 dark:via-slate-900 dark:to-slate-900 border-teal-200 dark:border-teal-800 shadow-sm'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Urgency Badge & Cycle Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isCritical
                  ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                  : isUrgent
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-teal-800 dark:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isCritical
                  ? 'Critical Deadline Closing'
                  : isUrgent
                  ? 'Approaching Application Deadline'
                  : 'Active Enrollment Cycle'}
              </span>
            </span>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Target: <strong className="text-slate-900 dark:text-white">{deadline.formattedDeadline}</strong>
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
            {deadline.cycleName}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">
            {deadline.cycleDescription}
          </p>
        </div>

        {/* Right: Live Digital Countdown Ticker */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Days */}
          <div className="flex flex-col items-center justify-center w-14 sm:w-16 h-16 sm:h-18 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl shadow-2xs">
            <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {String(deadline.daysRemaining).padStart(2, '0')}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Days</span>
          </div>

          <span className="font-mono text-xl font-bold text-slate-400">:</span>

          {/* Hours */}
          <div className="flex flex-col items-center justify-center w-14 sm:w-16 h-16 sm:h-18 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl shadow-2xs">
            <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {String(deadline.hoursRemaining).padStart(2, '0')}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Hours</span>
          </div>

          <span className="font-mono text-xl font-bold text-slate-400">:</span>

          {/* Mins */}
          <div className="flex flex-col items-center justify-center w-14 sm:w-16 h-16 sm:h-18 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl shadow-2xs">
            <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {String(deadline.minutesRemaining).padStart(2, '0')}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Mins</span>
          </div>

          <span className="font-mono text-xl font-bold text-slate-400">:</span>

          {/* Secs */}
          <div className="flex flex-col items-center justify-center w-14 sm:w-16 h-16 sm:h-18 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl shadow-2xs">
            <span
              className={`font-mono text-xl sm:text-2xl font-black ${
                isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-teal-700 dark:text-emerald-400'
              }`}
            >
              {String(deadline.secondsRemaining).padStart(2, '0')}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Secs</span>
          </div>
        </div>
      </div>

      {/* Action Strip: Direct 1-Click Google Calendar Sync + More Options */}
      <div className="mt-4 pt-3.5 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>Sync application deadline directly with your personal calendar:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGoogleCalendar}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Add this application cutoff directly to Google Calendar"
          >
            <Calendar className="w-3.5 h-3.5 text-white" />
            <span>Add to Google Calendar</span>
            <ExternalLink className="w-3 h-3 text-white/80" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="More calendar formats (Outlook, .ics)"
            >
              <span>More</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 py-1 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={handleOutlookCalendar}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <span>Microsoft Outlook</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={handleIcsDownload}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <span>Download .ics File</span>
                  <Download className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
