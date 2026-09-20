/**
 * schemeDeadlines.ts
 *
 * Provides authentic, accurate deadline intelligence for Indian Government Schemes.
 *
 * Distinguishes between:
 * 1. Open Year-Round (Continuous Enrollment) Schemes:
 *    - Healthcare (Ayushman Bharat PM-JAY, CGHS, Senior Citizen cards)
 *    - Social Security & Pensions (Atal Pension Yojana, PMJJBY, PMSBY, Old Age Pensions)
 *    - Financial & Loans (PM Mudra Yojana, PM SVANidhi, Stand-Up India, Jan Dhan)
 *    - Agriculture DBT (PM-KISAN, Kisan Credit Card)
 *    - Women & Child (Sukanya Samriddhi Yojana, PMMVY)
 *    - Housing (PMAY Gramin & Urban)
 *    - Livelihood & Skills (PM Vishwakarma, PMKVY, NAPS)
 *    These schemes DO NOT have artificial closing deadlines. They are active 365 days a year.
 *
 * 2. Schemes with Genuine Cut-Off Dates:
 *    - Education / Academic Scholarships (NSP, Post-Matric, PM-USP, Fellowship quotas)
 *      which follow the annual academic session intake (closing 31 October).
 *    - Agriculture Crop Insurance (PMFBY / RWBCIS)
 *      which have seasonal cutoffs: Kharif (31 July) & Rabi (31 December).
 *    - Explicit scheme deadline dates from verified government notifications.
 */

import { Scheme } from '../types';

export type UrgencyLevel = 'critical' | 'urgent' | 'normal';

export interface SchemeDeadlineInfo {
  isOpenYearRound: boolean;
  deadlineDate: Date;
  formattedDeadline: string;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  totalSeconds: number;
  isExpired: boolean;
  urgencyLevel: UrgencyLevel;
  cycleName: string;
  cycleDescription: string;
  isRolling: boolean;
}

/**
 * Check if a scheme is an Academic Scholarship / Education fellowship
 */
function isEducationScholarship(scheme: Partial<Scheme>): boolean {
  const category = (scheme.category || '').toLowerCase();
  const slug = (scheme.slug || scheme.id || '').toLowerCase();
  const name = (scheme.name || '').toLowerCase();
  const tags = Array.isArray(scheme.tags) ? scheme.tags.map((t) => t.toLowerCase()) : [];

  if (category.includes('edu')) return true;

  const scholarshipKeywords = [
    'scholarship',
    'fellowship',
    'chhatravritti',
    'post-matric',
    'pre-matric',
    'merit',
    'nsp',
    'vidyarthi',
    'protsahan',
    'stipend',
    'shiksha',
    'higher education',
  ];

  return (
    scholarshipKeywords.some((kw) => slug.includes(kw) || name.includes(kw)) ||
    tags.some((t) => scholarshipKeywords.some((kw) => t.includes(kw)))
  );
}

/**
 * Check if a scheme is Seasonal Crop Insurance (PMFBY)
 */
function isSeasonalCropInsurance(scheme: Partial<Scheme>): boolean {
  const slug = (scheme.slug || scheme.id || '').toLowerCase();
  const name = (scheme.name || '').toLowerCase();
  const insuranceKeywords = ['fasal-bima', 'pmfby', 'crop-insurance', 'weather-based-crop', 'bima yojana'];
  return insuranceKeywords.some((kw) => slug.includes(kw) || name.includes(kw));
}

/**
 * Check if scheme has an explicit deadline date provided in data
 */
function getExplicitDate(scheme: Partial<Scheme>): Date | null {
  const anyScheme = scheme as Record<string, any>;
  const dateStr =
    anyScheme.deadline ||
    anyScheme.last_date ||
    anyScheme.applicationDeadline ||
    anyScheme.validUntil ||
    anyScheme.endDate;

  if (dateStr && typeof dateStr === 'string') {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

/**
 * Deterministically compute the authentic application deadline information for any scheme
 */
export function getSchemeDeadline(
  scheme: Partial<Scheme> | null | undefined
): SchemeDeadlineInfo {
  const now = new Date();
  const currentYear = now.getFullYear();

  if (!scheme) {
    return getYearRoundInfo(now);
  }

  // 1. Check if scheme has an explicit deadline in its data
  const explicitDate = getExplicitDate(scheme);
  if (explicitDate) {
    return calculateCutoffDifferences(
      explicitDate,
      now,
      'Official Scheme Application Deadline',
      'Cutoff date as published in the official government notification.'
    );
  }

  // 2. Check Seasonal Crop Insurance (PMFBY)
  if (isSeasonalCropInsurance(scheme)) {
    const currentMonth = now.getMonth(); // 0-11
    let targetMonth: number;
    let targetDay: number;
    let cycleName: string;

    if (currentMonth <= 6) {
      // Kharif season deadline: 31 July
      targetMonth = 6; // July (0-indexed)
      targetDay = 31;
      cycleName = 'PMFBY Kharif Seasonal Insurance Cutoff';
    } else {
      // Rabi season deadline: 31 December
      targetMonth = 11; // Dec (0-indexed)
      targetDay = 31;
      cycleName = 'PMFBY Rabi Seasonal Insurance Cutoff';
    }

    let targetDate = new Date(currentYear, targetMonth, targetDay, 23, 59, 59, 999);
    if (targetDate.getTime() <= now.getTime()) {
      // Roll to next seasonal cycle
      targetDate = new Date(currentYear + 1, 6, 31, 23, 59, 59, 999);
      cycleName = 'PMFBY Kharif Seasonal Insurance Cutoff';
    }

    return calculateCutoffDifferences(
      targetDate,
      now,
      cycleName,
      'Mandatory seasonal crop notification cutoff for loanee and non-loanee farmers.'
    );
  }

  // 3. Check Academic Scholarships (NSP & State Portals)
  if (isEducationScholarship(scheme)) {
    // Official NSP Academic intake cycle cutoff: 31 October
    let targetDate = new Date(currentYear, 9, 31, 23, 59, 59, 999); // 31 Oct
    if (targetDate.getTime() <= now.getTime()) {
      targetDate = new Date(currentYear + 1, 9, 31, 23, 59, 59, 999);
    }

    return calculateCutoffDifferences(
      targetDate,
      now,
      'NSP Academic Session Intake Cycle',
      'Online student application and institute verification cutoff for the current academic session.'
    );
  }

  // 4. Default for All Other Welfare / Social / Livelihood / Healthcare / Housing Schemes:
  // They are OPEN YEAR-ROUND (Continuous Enrollment).
  return getYearRoundInfo(now);
}

/**
 * Returns accurate continuous enrollment info for year-round government schemes
 */
function getYearRoundInfo(now: Date): SchemeDeadlineInfo {
  // Set a 7-day reminder date for calendar sync convenience
  const reminderDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  reminderDate.setHours(18, 0, 0, 0);

  return {
    isOpenYearRound: true,
    deadlineDate: reminderDate,
    formattedDeadline: 'Open Year-Round',
    daysRemaining: 0,
    hoursRemaining: 0,
    minutesRemaining: 0,
    secondsRemaining: 0,
    totalSeconds: 0,
    isExpired: false,
    urgencyLevel: 'normal',
    cycleName: 'Open Year-Round (Continuous Enrollment)',
    cycleDescription:
      'Active all year. Eligible citizens can submit applications anytime on the official portal or nearest CSC Kendra with no cutoff date.',
    isRolling: true,
  };
}

/**
 * Calculates countdown differences for schemes with genuine fixed/seasonal cutoffs
 */
function calculateCutoffDifferences(
  targetDate: Date,
  now: Date,
  cycleName: string,
  cycleDesc: string
): SchemeDeadlineInfo {
  const diffMs = targetDate.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const isExpired = totalSeconds <= 0;

  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let urgencyLevel: UrgencyLevel = 'normal';
  if (days <= 7) {
    urgencyLevel = 'critical';
  } else if (days <= 30) {
    urgencyLevel = 'urgent';
  }

  const dayOfMonth = targetDate.getDate();
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const formattedDeadline = `${dayOfMonth} ${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`;

  return {
    isOpenYearRound: false,
    deadlineDate: targetDate,
    formattedDeadline,
    daysRemaining: days,
    hoursRemaining: hours,
    minutesRemaining: minutes,
    secondsRemaining: seconds,
    totalSeconds,
    isExpired,
    urgencyLevel,
    cycleName,
    cycleDescription: cycleDesc,
    isRolling: false,
  };
}
