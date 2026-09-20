/**
 * calendarSync.ts
 *
 * Provides 1-Click .ics iCalendar file downloads with built-in reminder alarms,
 * and direct one-click web sync links for Google Calendar and Microsoft Outlook.
 */

import { Scheme } from '../types';
import { SchemeDeadlineInfo } from './schemeDeadlines';
import { getSafeOfficialUrl } from '../components/common/ExternalPortalModal';

function formatToIcsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Format a Date object to Google Calendar format: YYYYMMDDTHHMMSSZ
 */
function formatToGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate and trigger download of an .ics file for calendar import.
 * Supported natively by Apple Calendar, Google Calendar, and Microsoft Outlook.
 */
export function downloadIcsFile(
  scheme: Partial<Scheme>,
  deadlineInfo: SchemeDeadlineInfo
): void {
  const now = new Date();
  const schemeName = scheme.name || 'Government Scheme';
  const slug = (scheme.slug || scheme.id || 'scheme').replace(/[^a-z0-9-_]/gi, '-');
  const portalUrl = getSafeOfficialUrl(scheme as Scheme);
  const ministry = scheme.verification?.ministryOrAuthority || 'Government of India';
  const helpline = scheme.verification?.helpline || '1800-111-555';

  const docs = Array.isArray(scheme.documents) && scheme.documents.length > 0
    ? scheme.documents.map((d) => `- ${d.name} (${d.isMandatory ? 'Mandatory' : 'Optional'})`).join('\\n')
    : '- Aadhaar Card\\n- Bank Passbook\\n- Income/Caste Proof (if applicable)';

  const targetDate = deadlineInfo.deadlineDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startDate = new Date(targetDate.getTime() - 2 * 60 * 60 * 1000);
  const endDate = targetDate;

  const isYearRound = deadlineInfo.isOpenYearRound;
  const eventTitle = isYearRound
    ? `[Reminder] Apply for ${schemeName}`
    : `[Scheme Deadline] ${schemeName}`;

  const description = isYearRound
    ? `PERSONAL APPLICATION REMINDER\\n\\n` +
      `Scheme: ${schemeName}\\n` +
      `Nodal Authority: ${ministry}\\n` +
      `Status: Open Year-Round (Continuous Enrollment)\\n` +
      `Official Portal: ${portalUrl}\\n` +
      `Toll-Free Helpline: ${helpline}\\n\\n` +
      `Required Documents Checklist:\\n${docs}\\n\\n` +
      `Tip: You can apply anytime online or visit your nearest Common Service Center (CSC / e-Mitra / MeeSeva).`
    : `SCHEME APPLICATION DEADLINE ALERT\\n\\n` +
      `Scheme: ${schemeName}\\n` +
      `Nodal Authority: ${ministry}\\n` +
      `Enrollment Cycle: ${deadlineInfo.cycleName}\\n` +
      `Cutoff Date: ${deadlineInfo.formattedDeadline}\\n\\n` +
      `Official Portal: ${portalUrl}\\n` +
      `Toll-Free Helpline: ${helpline}\\n\\n` +
      `Required Documents Checklist:\\n${docs}\\n\\n` +
      `Tip: Submit online or visit your nearest Common Service Center (CSC / e-Mitra / MeeSeva) before the cutoff date.`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SchemeNavigator//Yojana Calendar 2.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:yojana-${slug}-${targetDate.getTime()}@schemenavigator.gov`,
    `DTSTAMP:${formatToIcsDate(now)}`,
    `DTSTART:${formatToIcsDate(startDate)}`,
    `DTEND:${formatToIcsDate(endDate)}`,
    `SUMMARY:${eventTitle}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${portalUrl}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    // 1 Day Prior Alarm
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: Complete your application for ${schemeName}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const icsBlob = new Blob([icsLines.join('\r\n')], {
    type: 'text/calendar;charset=utf-8',
  });

  const downloadUrl = URL.createObjectURL(icsBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `${slug}-reminder.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Generate 1-Click "Add to Google Calendar" URL
 */
export function getGoogleCalendarUrl(
  scheme: Partial<Scheme>,
  deadlineInfo: SchemeDeadlineInfo
): string {
  const now = new Date();
  const schemeName = scheme.name || 'Government Scheme';
  const portalUrl = getSafeOfficialUrl(scheme as Scheme);
  const ministry = scheme.verification?.ministryOrAuthority || 'Government Department';

  const targetDate = deadlineInfo.deadlineDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startDate = new Date(targetDate.getTime() - 2 * 60 * 60 * 1000);
  const dates = `${formatToGoogleDate(startDate)}/${formatToGoogleDate(targetDate)}`;

  const isYearRound = deadlineInfo.isOpenYearRound;
  const text = isYearRound ? `[Reminder] Apply for ${schemeName}` : `[Deadline] ${schemeName}`;

  const details = isYearRound
    ? `Scheme: ${schemeName}\n` +
      `Authority: ${ministry}\n` +
      `Status: Open Year-Round (Continuous Enrollment)\n` +
      `Official Portal: ${portalUrl}\n\n` +
      `Reminder to prepare documents and submit application on the portal or at your nearest CSC / e-Mitra center.`
    : `Scheme: ${schemeName}\n` +
      `Authority: ${ministry}\n` +
      `Enrollment Cycle: ${deadlineInfo.cycleName}\n` +
      `Cutoff: ${deadlineInfo.formattedDeadline}\n` +
      `Official Portal: ${portalUrl}\n\n` +
      `Submit application before this deadline on the official portal or at your nearest CSC / e-Mitra / MeeSeva center.`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text,
    dates,
    details,
    location: portalUrl,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate 1-Click "Add to Microsoft Outlook" URL
 */
export function getOutlookCalendarUrl(
  scheme: Partial<Scheme>,
  deadlineInfo: SchemeDeadlineInfo
): string {
  const now = new Date();
  const schemeName = scheme.name || 'Government Scheme';
  const portalUrl = getSafeOfficialUrl(scheme as Scheme);

  const targetDate = deadlineInfo.deadlineDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startDate = new Date(targetDate.getTime() - 2 * 60 * 60 * 1000);
  const startdt = startDate.toISOString();
  const enddt = targetDate.toISOString();

  const isYearRound = deadlineInfo.isOpenYearRound;
  const subject = isYearRound ? `[Reminder] Apply for ${schemeName}` : `[Deadline] ${schemeName}`;

  const body = isYearRound
    ? `Scheme Application Reminder:\n` +
      `Scheme: ${schemeName}\n` +
      `Status: Open Year-Round (Continuous Enrollment)\n` +
      `Portal: ${portalUrl}\n`
    : `Government Scheme Application Cut-off Reminder:\n` +
      `Scheme: ${schemeName}\n` +
      `Cycle: ${deadlineInfo.cycleName}\n` +
      `Portal: ${portalUrl}\n`;

  const params = new URLSearchParams({
    subject,
    startdt,
    enddt,
    body,
    location: portalUrl,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
