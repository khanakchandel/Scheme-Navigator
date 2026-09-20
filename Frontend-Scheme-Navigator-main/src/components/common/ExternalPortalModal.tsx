import React from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, ShieldCheck, AlertTriangle, X, CheckSquare } from 'lucide-react';
import { Scheme } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { DeadlineTicker } from '../calendar/DeadlineTicker';

interface ExternalPortalModalProps {
  scheme: Scheme | null;
  isOpen: boolean;
  onClose: () => void;
}

// Direct Official Application Portal Registry
const KNOWN_SCHEMES_PORTALS: Record<string, string> = {
  'aaby': 'https://eshram.gov.in',
  'aam-aadmi-bima-yojana': 'https://eshram.gov.in',
  'pm-kisan': 'https://pmkisan.gov.in',
  'pm-kisan-samman-nidhi': 'https://pmkisan.gov.in',
  'pmjay': 'https://beneficiary.nha.gov.in',
  'ayushman-bharat-pmjay': 'https://beneficiary.nha.gov.in',
  'ayushman-vaya-vandana-senior-citizens': 'https://beneficiary.nha.gov.in',
  'pm-vishwakarma-scheme': 'https://pmvishwakarma.gov.in',
  'pm-vishwakarma': 'https://pmvishwakarma.gov.in',
  'pradhan-mantri-mudra-yojana': 'https://www.udyamimitra.in',
  'pradhan-mantri-mudra-yojana-pmmy': 'https://www.udyamimitra.in',
  'pm-mudra': 'https://www.udyamimitra.in',
  'prime-minister-employment-generation-programme': 'https://www.kviconline.gov.in/pmegpeportal',
  'sukanya-samriddhi-yojana': 'https://www.indiapost.gov.in',
  'atal-pension-yojana': 'https://enps.nsdl.com',
  'pm-svanidhi': 'https://pmsvanidhi.mohua.gov.in',
  'pmsvanidhi': 'https://pmsvanidhi.mohua.gov.in',
  'pm-matru-vandana-yojana': 'https://pmmvy.wcd.gov.in',
  'pmmvy': 'https://pmmvy.wcd.gov.in',
  'pm-shram-yogi-mandhan': 'https://maandhan.in',
  'pm-sym': 'https://maandhan.in',
  'national-scholarship-portal': 'https://scholarships.gov.in',
  'post-matric-scholarship-sc-obc-minority': 'https://scholarships.gov.in',
  'pre-matric-scholarship': 'https://scholarships.gov.in',
  'pm-uchchatar-shiksha-protsahan-yojana': 'https://scholarships.gov.in',
  'pm-fasal-bima-yojana': 'https://pmfby.gov.in',
  'pmfby': 'https://pmfby.gov.in',
  'kisan-credit-card': 'https://pmkisan.gov.in',
  'kcc': 'https://pmkisan.gov.in',
  'pm-awas-yojana-urban': 'https://pmaymis.gov.in',
  'pm-awas-yojana-gramin': 'https://pmayg.nic.in',
  'pmay': 'https://pmaymis.gov.in',
  'stand-up-india': 'https://www.standupmitra.in',
  'udyam-registration': 'https://udyamregistration.gov.in',
  'pm-kusum': 'https://pmkusum.mnre.gov.in',
  'swamitva-scheme': 'https://swamitva.nic.in',
  'jan-aushadhi-scheme': 'https://janaushadhi.gov.in',
  'national-apprenticeship-promotion-scheme': 'https://www.apprenticeshipindia.gov.in',
};

const STATE_DIRECT_PORTALS: Record<string, string> = {
  'Assam': 'https://sewasetu.assam.gov.in',
  'Odisha': 'https://edistrict.odisha.gov.in',
  'Puducherry': 'https://edistrict.py.gov.in',
  'Delhi': 'https://edistrict.delhigovt.nic.in',
  'Uttar Pradesh': 'https://edistrict.up.gov.in',
  'Maharashtra': 'https://aaplesarkar.mahaonline.gov.in',
  'Karnataka': 'https://sevasindhu.karnataka.gov.in',
  'Tamil Nadu': 'https://www.tnesevai.tn.gov.in',
  'Bihar': 'https://serviceonline.bihar.gov.in',
  'West Bengal': 'https://edistrict.wb.gov.in',
  'Rajasthan': 'https://jansoochna.rajasthan.gov.in',
  'Gujarat': 'https://digitalgujarat.gov.in',
  'Madhya Pradesh': 'https://mpedistrict.gov.in',
  'Punjab': 'https://esewa.punjab.gov.in',
  'Haryana': 'https://saralharyana.gov.in',
  'Andhra Pradesh': 'https://navasakam.ap.gov.in',
  'Telangana': 'https://tg.meeseva.gov.in',
  'Kerala': 'https://edistrict.kerala.gov.in',
  'Jharkhand': 'https://jharsewa.jharkhand.gov.in',
  'Chhattisgarh': 'https://edistrict.cgstate.gov.in',
  'Himachal Pradesh': 'https://edistrict.hp.gov.in',
  'Uttarakhand': 'https://eservices.uk.gov.in',
  'Jammu and Kashmir': 'https://jkeservices.jk.gov.in',
  'Goa': 'https://goaonline.gov.in',
  'Tripura': 'https://edistrict.tripura.gov.in',
  'Meghalaya': 'https://megedistrict.gov.in',
  'Manipur': 'https://eservicesmanipur.gov.in',
  'Nagaland': 'https://edistrict.nagaland.gov.in',
  'Mizoram': 'https://edistrict.mizoram.gov.in',
  'Sikkim': 'https://services.sikkim.gov.in',
  'Arunachal Pradesh': 'https://eservice.arunachal.gov.in',
  'Chandigarh': 'https://chdservices.gov.in',
};

const MINISTRY_DIRECT_PORTALS: Record<string, string> = {
  'education': 'https://scholarships.gov.in',
  'social justice': 'https://socialjustice.gov.in',
  'science': 'https://online-inspire.gov.in',
  'commerce': 'https://www.startupindia.gov.in',
  'agriculture': 'https://pmkisan.gov.in',
  'msme': 'https://udyamregistration.gov.in',
  'small scale': 'https://udyamregistration.gov.in',
  'textile': 'https://handicrafts.nic.in',
  'electronics': 'https://www.digitalindia.gov.in',
  'sports': 'https://yas.nic.in',
  'culture': 'https://indiaculture.gov.in',
  'finance': 'https://www.udyamimitra.in',
  'home affairs': 'https://mha.gov.in',
  'defence': 'https://mod.gov.in',
  'health': 'https://beneficiary.nha.gov.in',
  'labour': 'https://eshram.gov.in',
  'fisheries': 'https://dof.gov.in',
  'minority': 'https://scholarships.gov.in',
  'skill': 'https://www.skillindia.gov.in',
  'women': 'https://wcd.nic.in',
  'housing': 'https://pmsvanidhi.mohua.gov.in',
  'rural': 'https://rural.nic.in',
};

const URL_REGEX = /https?:\/\/[^\s'"<>]+/g;

export function extractCleanPortalUrl(rawUrl: string | undefined | null): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl
    .replace(/chrome-extension:\/\/[a-z0-9]+\/https?:\/\//g, 'https://')
    .replace(/chrome-extensionhttps?:\/\//g, 'https://');

  const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('file:///'));
  if (lines.length === 0) return '';

  const candidates: { score: number; url: string }[] = [];

  const priorityKeywords: [string[], number][] = [
    [['official website', 'official portal', 'portal', 'website', 'online application', 'apply', 'registration', 'apply online', 'portal login'], 120],
    [['sanman portal', 'sso', 'edistrict', 'service', 'dbt', 'mahaonline', 'e-services'], 100],
    [['application form', 'application status', 'scheme details', 'detail', 'details', 'about'], 80],
    [['guidelines', 'guideline', 'notification', 'circular', 'order', 'amendment', 'press release'], 50],
    [['user manual', 'faq', 'contact'], 30],
  ];

  for (const line of lines) {
    const matches = line.match(URL_REGEX) || [];
    for (let u of matches) {
      u = u.replace(/[.,;)\]#'"]+$/, '');
      if (!u.startsWith('http')) continue;

      // Handle google redirects
      if (u.includes('google.co.in/url?') || u.includes('google.com/url?')) {
        try {
          const parsed = new URL(u);
          const target = parsed.searchParams.get('url');
          if (target) u = target;
        } catch {
          // ignore
        }
      }

      // Handle translate.goog
      if (u.includes('translate.goog')) {
        u = u.replace(/([a-zA-Z0-9-]+)-([a-zA-Z0-9-]+)-gov-in\.translate\.goog/g, '$1.$2.gov.in')
             .replace(/([a-zA-Z0-9-]+)-gov-in\.translate\.goog/g, '$1.gov.in')
             .replace(/\.translate\.goog/g, '');
      }

      if (u.includes(':8080')) {
        u = u.replace(':8080', '');
      }

      const lineLower = line.toLowerCase();
      const uLower = u.toLowerCase();
      let score = 10;

      for (const [kws, sVal] of priorityKeywords) {
        if (kws.some(kw => lineLower.includes(kw))) {
          score = sVal;
          break;
        }
      }

      try {
        const host = new URL(u).hostname.toLowerCase();
        if (host.endsWith('.gov.in') || host.endsWith('.nic.in')) {
          score += 50;
        } else if (host.endsWith('.org.in') || host.endsWith('.ac.in') || host.endsWith('.res.in') || host.endsWith('.edu.in') || host.endsWith('.in')) {
          score += 20;
        }

        if (['drive.google.com', 'docs.google.com', 'dropbox.com', 'amazonaws.com', 'govtschemes.in', 'google.com', 'google.co.in'].some(b => host.includes(b))) {
          score -= 100;
        }
      } catch {
        continue;
      }

      if (uLower.endsWith('.pdf')) {
        score -= 25;
      } else {
        score += 15;
      }

      candidates.push({ score, url: u });
    }
  }

  if (candidates.length === 0) return '';
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].score > 0 ? candidates[0].url : '';
}

export function getSafeOfficialUrl(scheme: Scheme | null | undefined): string {
  if (!scheme) return 'https://services.india.gov.in';

  const rawUrl = scheme.verification?.officialPortalUrl?.trim();
  const cleanExtracted = extractCleanPortalUrl(rawUrl);

  if (cleanExtracted && cleanExtracted !== '#' && cleanExtracted.toLowerCase() !== 'none' && !cleanExtracted.includes('myscheme.gov.in')) {
    return cleanExtracted;
  }

  // Resolve direct application portal from scheme identity & category
  const slug = (scheme.slug || scheme.id || '').toLowerCase();
  const name = (scheme.name || '').toLowerCase();

  for (const [key, directUrl] of Object.entries(KNOWN_SCHEMES_PORTALS)) {
    if (slug === key || slug.includes(key) || name.includes(key)) {
      return directUrl;
    }
  }

  if (name.includes('scholarship') || name.includes('fellowship') || name.includes('vidyarthi') || name.includes('shiksha') || name.includes('stipend')) {
    return 'https://scholarships.gov.in';
  }
  if (name.includes('kisan') || name.includes('farmer') || name.includes('krishi') || name.includes('crop') || name.includes('paddy') || name.includes('farming')) {
    return 'https://pmkisan.gov.in';
  }
  if (name.includes('bima') || name.includes('insurance') || name.includes('ayushman') || name.includes('arogya') || name.includes('swasthya') || name.includes('health')) {
    return 'https://beneficiary.nha.gov.in';
  }
  if (name.includes('mudra') || name.includes('loan') || name.includes('credit') || name.includes('subsidy') || name.includes('business') || name.includes('udyam') || name.includes('coir') || name.includes('handicraft') || name.includes('industry')) {
    return 'https://udyamregistration.gov.in';
  }
  if (name.includes('pension') || name.includes('vridha') || name.includes('old age') || name.includes('divyang') || name.includes('disability')) {
    return 'https://enps.nsdl.com';
  }
  if (name.includes('awas') || name.includes('housing') || name.includes('ghar')) {
    return 'https://pmaymis.gov.in';
  }
  if (name.includes('labour') || name.includes('worker') || name.includes('shramik') || name.includes('employment') || name.includes('rozgar') || name.includes('job')) {
    return 'https://eshram.gov.in';
  }

  const covered = Array.isArray(scheme.coveredStates) ? scheme.coveredStates : [];
  if (covered.length > 0 && !covered.includes('All India')) {
    for (const st of covered) {
      if (STATE_DIRECT_PORTALS[st]) {
        return STATE_DIRECT_PORTALS[st];
      }
    }
  }

  const dept = (scheme.verification?.ministryOrAuthority || scheme.verification?.sourceDepartment || '').toLowerCase();
  for (const [key, directUrl] of Object.entries(MINISTRY_DIRECT_PORTALS)) {
    if (dept.includes(key)) {
      return directUrl;
    }
  }

  return 'https://services.india.gov.in';
}

export const ExternalPortalModal: React.FC<ExternalPortalModalProps> = ({
  scheme,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!isOpen || !scheme) return null;

  const targetUrl = getSafeOfficialUrl(scheme);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg my-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-950 text-white p-5 pr-12 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>{t('modal.portal_exit_badge', undefined, 'Official Government Portal Exit')}</span>
          </div>
          <h3 className="text-lg font-bold leading-snug">
            {t('modal.portal_exit_title', undefined, 'Continuing to Official Application Channel')}
          </h3>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs font-medium text-slate-700 block mb-0.5">{t('modal.dest_scheme', undefined, 'Destination Scheme:')}</span>
            <div className="font-bold text-slate-900 text-base">{scheme.name}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <DeadlineTicker scheme={scheme} variant="badge" />
            </div>
            <div className="text-xs text-teal-800 font-medium mt-1.5 flex items-center gap-1">
              <span>{t('modal.managed_by', undefined, 'Managed by:')}</span>
              <span className="text-slate-800">{scheme.verification?.ministryOrAuthority || 'Government Department'}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700">
              <span>{t('modal.target_website', undefined, 'Target Website:')}</span>
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-semibold text-teal-800 hover:underline bg-teal-50 px-2 py-0.5 rounded border border-teal-200 max-w-[240px] truncate"
              >
                {targetUrl}
              </a>
            </div>
          </div>

          <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>{t('modal.notice_label', undefined, 'Notice:')}</strong> {t('modal.notice_text', undefined, 'You are now leaving SchemeNavigator. Application submission, document verification, and benefits approval take place exclusively on the official government website.')}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('modal.preflight_checklist_title', undefined, 'Recommended Quick Pre-flight Checklist:')}</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {t('modal.checklist_item1', undefined, 'Keep your Aadhaar linked mobile number handy for OTP verification.')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {t('modal.checklist_item2', undefined, 'Prepare scanned copies of mandatory documents under 200KB / 2MB.')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {t('modal.checklist_item3', undefined, 'Never pay any unofficial third party agent or private middlemen.')}
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            {t('modal.stay_on_sn', undefined, 'Stay on SchemeNavigator')}
          </button>
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-700 to-teal-900 hover:from-teal-800 hover:to-teal-950 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-900/20 hover:shadow-lg transition-all cursor-pointer"
          >
            <span>{t('modal.go_to_official_portal', undefined, 'Go to Official Portal')}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
};
