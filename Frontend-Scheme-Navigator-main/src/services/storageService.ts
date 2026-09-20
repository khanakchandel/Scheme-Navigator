import {
  UserProfile,
  TrackerItem,
  ApplicationStatus,
  SchemeCategory,
  Scheme,
  SchemeMatchResult,
} from '../types';
import { getSafeOfficialUrl, extractCleanPortalUrl } from '../components/common/ExternalPortalModal';

const STORAGE_KEYS = {
  PROFILE: 'sn_user_profile_v2',
  SAVED_SCHEMES: 'sn_saved_schemes_v2',
  SAVED_SCHEME_OBJS: 'sn_saved_scheme_objs_v2',
  TRACKER: 'sn_tracker_items_v2',
  AUTH: 'sn_auth_user_v2',
  RECOMMENDATIONS: 'sn_cached_recommendations_v2',
};

// Safe helper to read JSON from localStorage
function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return fallback;
}

// Safe helper to write JSON to localStorage
function writeToStorage(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

// ── In-memory & Persistent Store ─────────────────────────────────────────────

let _profile: UserProfile | null = readFromStorage<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
let _savedSchemeIds: string[] = readFromStorage<string[]>(STORAGE_KEYS.SAVED_SCHEMES, []);
let _savedSchemes: Scheme[] = readFromStorage<Scheme[]>(STORAGE_KEYS.SAVED_SCHEME_OBJS, []);
let _trackerItems: TrackerItem[] = readFromStorage<TrackerItem[]>(STORAGE_KEYS.TRACKER, []);
let _authUser: AuthUser | null = readFromStorage<AuthUser | null>(STORAGE_KEYS.AUTH, null);

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
  avatarUrl?: string;
}

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'deserted';

export const DEFAULT_DEMO_PROFILE: UserProfile = {
  age: 20,
  gender: 'male',
  state: 'Haryana',
  district: 'Gurugram',
  areaType: 'Urban',
  category: 'General',
  isDisability: false,
  isMinority: false,
  hasBPLCard: false,
  employmentType: 'Student',
  studentCourse: 'Bachelor of Technology (B.Tech)',
  incomeRange: '₹1–2.5 lakh',
  completedAt: new Date().toISOString(),
};

// ── User Profile ─────────────────────────────────────────────────────────────

export function getSavedProfile(): UserProfile | null {
  if (!_profile) {
    _profile = readFromStorage<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
  }
  return _profile;
}

export function saveUserProfile(profile: UserProfile): void {
  _profile = { ...profile, completedAt: new Date().toISOString() };
  writeToStorage(STORAGE_KEYS.PROFILE, _profile);
  try {
    localStorage.removeItem(STORAGE_KEYS.RECOMMENDATIONS);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('sn_profile_updated'));
}

export function clearUserProfile(): void {
  _profile = null;
  try {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.RECOMMENDATIONS);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('sn_profile_updated'));
}

export function clearCachedRecommendations(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.RECOMMENDATIONS);
  } catch {
    // ignore
  }
}

export function calculateProfileCompletion(profile: UserProfile | null): number {
  if (!profile) return 0;
  let score = 0;
  if (profile.age !== undefined && profile.age !== '') score += 15;
  if (profile.gender) score += 15;
  if (profile.state) score += 15;
  if (profile.areaType || profile.residenceArea) score += 10;
  if (profile.employmentType || profile.occupation || profile.employmentStatus) score += 15;
  if (profile.category) score += 15;
  if (profile.incomeRange || profile.annualIncome !== undefined) score += 15;

  return Math.min(100, Math.max(0, score));
}

// ── Cached Recommendations ──────────────────────────────────────────────────

export function getCachedRecommendations(): SchemeMatchResult[] {
  return readFromStorage<SchemeMatchResult[]>(STORAGE_KEYS.RECOMMENDATIONS, []);
}

export function saveCachedRecommendations(recommendations: SchemeMatchResult[]): void {
  writeToStorage(STORAGE_KEYS.RECOMMENDATIONS, recommendations);
}

// ── Saved Schemes ─────────────────────────────────────────────────────────────

export function getSavedSchemeIds(): string[] {
  _savedSchemeIds = readFromStorage<string[]>(STORAGE_KEYS.SAVED_SCHEMES, []);
  return [..._savedSchemeIds];
}

export function getSavedSchemes(): Scheme[] {
  _savedSchemes = readFromStorage<Scheme[]>(STORAGE_KEYS.SAVED_SCHEME_OBJS, []);
  return [..._savedSchemes];
}

export function isSchemeSaved(schemeId: string): boolean {
  return getSavedSchemeIds().includes(schemeId);
}

export function toggleSaveScheme(schemeOrId: string | Scheme, schemeObj?: Scheme): boolean {
  const schemeId = typeof schemeOrId === 'string' ? schemeOrId : schemeOrId.id;
  const targetObj = typeof schemeOrId === 'object' ? schemeOrId : schemeObj;

  const currentIds = getSavedSchemeIds();
  const currentObjs = readFromStorage<Scheme[]>(STORAGE_KEYS.SAVED_SCHEME_OBJS, []);

  if (currentIds.includes(schemeId)) {
    _savedSchemeIds = currentIds.filter((id) => id !== schemeId);
    _savedSchemes = currentObjs.filter((s) => s.id !== schemeId && s.slug !== schemeId);
    writeToStorage(STORAGE_KEYS.SAVED_SCHEMES, _savedSchemeIds);
    writeToStorage(STORAGE_KEYS.SAVED_SCHEME_OBJS, _savedSchemes);
    window.dispatchEvent(new Event('sn_saved_updated'));
    return false;
  } else {
    _savedSchemeIds = [...currentIds, schemeId];
    if (targetObj) {
      _savedSchemes = [targetObj, ...currentObjs.filter((s) => s.id !== schemeId && s.slug !== schemeId)];
    } else {
      _savedSchemes = currentObjs;
    }
    writeToStorage(STORAGE_KEYS.SAVED_SCHEMES, _savedSchemeIds);
    writeToStorage(STORAGE_KEYS.SAVED_SCHEME_OBJS, _savedSchemes);
    window.dispatchEvent(new Event('sn_saved_updated'));
    return true;
  }
}

// ── Application Guidance Tracker ─────────────────────────────────────────────

export function getTrackerItems(): TrackerItem[] {
  _trackerItems = readFromStorage<TrackerItem[]>(STORAGE_KEYS.TRACKER, []);
  
  // Auto-repair missing fields or 'undefined' names from saved schemes store
  const saved = readFromStorage<Scheme[]>(STORAGE_KEYS.SAVED_SCHEME_OBJS, []);
  let hasRepaired = false;
  
  _trackerItems = _trackerItems.map((item) => {
    // Auto-repair any legacy unparsed portal URLs stored in localStorage
    if (item.officialPortalUrl && (item.officialPortalUrl.includes('\n') || item.officialPortalUrl.includes('Guidelines:') || item.officialPortalUrl.includes('file:///'))) {
      item.officialPortalUrl = extractCleanPortalUrl(item.officialPortalUrl);
      hasRepaired = true;
    }

    if (
      !item.schemeName ||
      item.schemeName === 'undefined' ||
      item.schemeName === 'Unknown Scheme' ||
      !item.category
    ) {
      const match = saved.find((s) => s.id === item.schemeId || s.slug === item.schemeId);
      if (match) {
        hasRepaired = true;
        const officialUrl = getSafeOfficialUrl(match);
        return {
          ...item,
          schemeName: match.name || item.schemeName,
          category: match.category || item.category || ('Social Welfare' as SchemeCategory),
          level: match.level || item.level || 'Central',
          shortDescription: match.shortDescription || (match as any)?.description || item.shortDescription,
          officialPortalUrl: officialUrl || item.officialPortalUrl,
          totalDocumentsCount: match.documents?.length || item.totalDocumentsCount,
        };
      }
    }
    return item;
  });

  if (hasRepaired) {
    writeToStorage(STORAGE_KEYS.TRACKER, _trackerItems);
  }

  return [..._trackerItems];
}

export function addSchemeToTracker(
  scheme: Scheme,
  status: ApplicationStatus = 'Exploring',
  notes?: string
): void {
  const schemeId = scheme.id || scheme.slug;
  if (!schemeId) return;

  const current = getTrackerItems();
  const existingIndex = current.findIndex((i) => i.schemeId === schemeId);
  const officialPortalUrl = getSafeOfficialUrl(scheme);

  const itemData: TrackerItem = {
    id: existingIndex >= 0 ? current[existingIndex].id : 'tr-' + Date.now(),
    schemeId,
    schemeName: scheme.name || (existingIndex >= 0 ? current[existingIndex].schemeName : 'Scheme'),
    category: scheme.category || (existingIndex >= 0 ? current[existingIndex].category : ('Social Welfare' as SchemeCategory)),
    level: scheme.level || (existingIndex >= 0 ? current[existingIndex].level : 'Central'),
    shortDescription: scheme.shortDescription || (scheme as any)?.description || (existingIndex >= 0 ? current[existingIndex].shortDescription : undefined),
    officialPortalUrl: officialPortalUrl || (existingIndex >= 0 ? current[existingIndex].officialPortalUrl : undefined),
    status: existingIndex >= 0 ? current[existingIndex].status : status,
    notes: notes || (existingIndex >= 0 ? current[existingIndex].notes : 'Started exploring scheme guidance.'),
    preparedDocuments: existingIndex >= 0 ? current[existingIndex].preparedDocuments : [],
    totalDocumentsCount: scheme.documents?.length || (existingIndex >= 0 ? current[existingIndex].totalDocumentsCount : undefined),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    _trackerItems = current.map((item, idx) => (idx === existingIndex ? { ...item, ...itemData } : item));
  } else {
    _trackerItems = [itemData, ...current];
  }

  writeToStorage(STORAGE_KEYS.TRACKER, _trackerItems);
  window.dispatchEvent(new Event('sn_tracker_updated'));
}

export function updateTrackerStatus(
  schemeId: string,
  schemeName: string,
  category: SchemeCategory,
  status: ApplicationStatus,
  notes?: string
): void {
  const current = getTrackerItems();
  const existingIndex = current.findIndex((i) => i.schemeId === schemeId);

  if (existingIndex >= 0) {
    _trackerItems = current.map((item, idx) =>
      idx === existingIndex
        ? {
            ...item,
            schemeName: schemeName && schemeName !== 'undefined' ? schemeName : item.schemeName,
            category: category || item.category,
            status,
            notes: notes ?? item.notes,
            updatedAt: new Date().toISOString(),
          }
        : item
    );
  } else {
    _trackerItems = [
      {
        id: 'tr-' + Date.now(),
        schemeId,
        schemeName: schemeName || 'Scheme',
        category: category || ('Social Welfare' as SchemeCategory),
        status,
        notes: notes || 'Started exploring scheme guidance.',
        preparedDocuments: [],
        updatedAt: new Date().toISOString(),
      },
      ...current,
    ];
  }

  writeToStorage(STORAGE_KEYS.TRACKER, _trackerItems);
  window.dispatchEvent(new Event('sn_tracker_updated'));
}

export function removeTrackerItem(schemeId: string): void {
  const current = getTrackerItems();
  _trackerItems = current.filter((i) => i.schemeId !== schemeId);
  writeToStorage(STORAGE_KEYS.TRACKER, _trackerItems);
  window.dispatchEvent(new Event('sn_tracker_updated'));
}

export function saveTrackerItem(item: TrackerItem): void {
  const current = getTrackerItems();
  const existingIndex = current.findIndex((i) => i.schemeId === item.schemeId);
  if (existingIndex >= 0) {
    _trackerItems = current.map((t, idx) =>
      idx === existingIndex ? { ...item, updatedAt: new Date().toISOString() } : t
    );
  } else {
    _trackerItems = [
      { ...item, id: item.id || 'tr-' + Date.now(), updatedAt: new Date().toISOString() },
      ...current,
    ];
  }
  writeToStorage(STORAGE_KEYS.TRACKER, _trackerItems);
  window.dispatchEvent(new Event('sn_tracker_updated'));
}

// ── Auth State ────────────────────────────────────────────────────────────────

export function getAuthUser(): AuthUser | null {
  if (!_authUser) {
    _authUser = readFromStorage<AuthUser | null>(STORAGE_KEYS.AUTH, null);
  }
  return _authUser;
}

export function setAuthUser(user: AuthUser | null): void {
  _authUser = user;
  if (user) {
    writeToStorage(STORAGE_KEYS.AUTH, user);
  } else {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    } catch {
      // ignore
    }
  }
  window.dispatchEvent(new Event('sn_auth_updated'));
}

export function loginMockUser(name: string = 'User', email: string = 'user@example.com'): AuthUser {
  const user: AuthUser = {
    id: 'usr-101',
    name,
    email,
    isLoggedIn: true,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
  };
  setAuthUser(user);
  return user;
}

export function logoutUser(): void {
  setAuthUser(null);
}

export const logoutMockUser = logoutUser;


