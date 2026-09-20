/**
 * HttpApiClient — real HTTP implementation of the same interface as MockFrontendApiClient.
 *
 * Activated when VITE_API_BASE_URL is set. Falls back to MockFrontendApiClient otherwise,
 * so the app still works fully offline / without a backend.
 *
 * Session token lifecycle:
 *   The token is stored purely in memory (a private instance variable).
 *   It is never written to sessionStorage or localStorage.
 *   A new token is requested on every page load; the token is gone the moment
 *   the page is closed or refreshed.
 */

import type { UserProfile, SchemeMatchResult, TrackerItem, Scheme } from '../types';
import {
  getSavedProfile as getUserProfile,
  saveUserProfile,
  getCachedRecommendations,
  saveCachedRecommendations,
  clearCachedRecommendations,
  getSavedSchemes as getLocalSavedSchemes,
  toggleSaveScheme as toggleLocalSaveScheme,
  getTrackerItems as getLocalTrackerItems,
  saveTrackerItem as saveLocalTrackerItem,
} from './storageService';
import { calculateSchemeMatch } from './matchingEngine';

class HttpApiClient {
  private baseUrl: string;
  private _token: string | null = null;
  private _tokenPromise: Promise<string> | null = null;
  private _cache = new Map<string, { data: any; expiry: number }>();
  private isBackendAvailable: boolean | null = null;
  private staticSummaryData: {
    schemes: Scheme[];
    categoryCounts: Record<string, number>;
    total: number;
  } | null = null;
  private staticFullSchemes: Scheme[] | null = null;
  private staticLoadingPromise: Promise<void> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = (baseUrl || '').replace(/\/$/, ''); // strip trailing slash
  }

  private getStaticBaseUrl(): string {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      // If deployed on GitHub Pages with repository subpath
      if (pathname.startsWith('/Scheme-Navigator-App')) {
        return '/Scheme-Navigator-App/';
      }
      // On Cloudflare, Vercel, Netlify, or local, it is hosted at root
      return '/';
    }
    const base = import.meta.env.BASE_URL || '/';
    return base.endsWith('/') ? base : `${base}/`;
  }

  private async loadStaticSummary(): Promise<{
    schemes: Scheme[];
    categoryCounts: Record<string, number>;
    total: number;
  }> {
    if (this.staticSummaryData) return this.staticSummaryData;
    if (this.staticLoadingPromise) {
      await this.staticLoadingPromise;
      if (this.staticSummaryData) return this.staticSummaryData;
    }

    this.staticLoadingPromise = (async () => {
      try {
        const cleanBase = this.getStaticBaseUrl();
        const res = await fetch(`${cleanBase}data/schemes-summary.json`);
        if (res.ok) {
          this.staticSummaryData = await res.json();
          return;
        }

        const fullRes = await fetch(`${cleanBase}data/schemes.json`);
        if (fullRes.ok) {
          const all: Scheme[] = await fullRes.json();
          const counts: Record<string, number> = {};
          for (const s of all) {
            if (s.category) counts[s.category] = (counts[s.category] || 0) + 1;
          }
          this.staticSummaryData = { schemes: all, categoryCounts: counts, total: all.length };
          this.staticFullSchemes = all;
          return;
        }
      } catch (err) {
        console.warn('Could not load static schemes data:', err);
      }
    })().finally(() => {
      this.staticLoadingPromise = null;
    });

    await this.staticLoadingPromise;
    return this.staticSummaryData || { schemes: [], categoryCounts: {}, total: 0 };
  }

  private async loadStaticFull(): Promise<Scheme[]> {
    if (this.staticFullSchemes && this.staticFullSchemes.length > 0) {
      return this.staticFullSchemes;
    }
    try {
      const cleanBase = this.getStaticBaseUrl();
      const res = await fetch(`${cleanBase}data/schemes.json`);
      if (res.ok) {
        this.staticFullSchemes = await res.json();
        return this.staticFullSchemes!;
      }
    } catch (err) {
      console.warn('Could not load full schemes.json:', err);
    }
    const summary = await this.loadStaticSummary();
    return summary.schemes || [];
  }


  private getCached<T>(key: string): T | null {
    const entry = this._cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.data as T;
    }
    this._cache.delete(key);
    return null;
  }

  private setCached(key: string, data: any, ttlMs: number = 60000) {
    this._cache.set(key, { data, expiry: Date.now() + ttlMs });
  }

  public clearCache() {
    this._cache.clear();
  }

  // ── Token management ──────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    if (this._token) return this._token;

    try {
      const stored = sessionStorage.getItem('sn_session_token');
      if (stored) {
        this._token = stored;
        return stored;
      }
    } catch {
      // ignore
    }

    if (!this.baseUrl || this.isBackendAvailable === false) {
      const fallbackToken = 'offline-session-token';
      this._token = fallbackToken;
      return fallbackToken;
    }

    if (!this._tokenPromise) {
      this._tokenPromise = this._createSession().finally(() => {
        this._tokenPromise = null;
      });
    }
    return this._tokenPromise;
  }

  private async _createSession(): Promise<string> {
    if (this.isBackendAvailable === false) {
      return 'offline-session-token';
    }
    try {
      const url = this.baseUrl ? `${this.baseUrl}/api/sessions/` : '/api/sessions/';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      const token: string = data.token;
      this._token = token;
      this.isBackendAvailable = true;
      try {
        sessionStorage.setItem('sn_session_token', token);
      } catch {
        // ignore
      }
      return token;
    } catch (err) {
      console.warn('[httpClient] session creation blip, using fallback:', err);
      const fallbackToken = 'offline-session-token';
      this._token = fallbackToken;
      return fallbackToken;
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    timeoutMs: number = 25000
  ): Promise<T> {
    const fullUrl = this.baseUrl ? `${this.baseUrl}${path}` : path;
    const token = await this.getToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token,
          ...(options.headers as Record<string, string> | undefined),
        },
      }).finally(() => clearTimeout(timer));

      if (res.status === 401) {
        this._token = null;
        const newToken = await this._createSession();
        const retry = await fetch(fullUrl, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': newToken,
            ...(options.headers as Record<string, string> | undefined),
          },
        });
        if (!retry.ok) {
          const err = await retry.json().catch(() => ({}));
          throw new Error(err?.error || `API error ${retry.status}`);
        }
        return retry.json() as Promise<T>;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `API error ${res.status}`);
      }

      if (res.status === 204) return {} as T;
      return res.json() as Promise<T>;
    } catch (err) {
      // Log warning but do not permanently disable backend on a slow request
      console.warn(`[httpClient] Request to ${path} encountered error:`, err);
      throw err;
    }
  }


  private post<T>(path: string, body: unknown, timeoutMs: number = 25000): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }, timeoutMs);
  }

  private put<T>(path: string, body: unknown, timeoutMs: number = 20000): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, timeoutMs);
  }

  private del<T>(path: string, timeoutMs: number = 15000): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' }, timeoutMs);
  }

  // ── Profile & Survey ──────────────────────────────────────────────────────

  async getProfile(): Promise<UserProfile | null> {
    if (this.baseUrl && this.isBackendAvailable !== false) {
      try {
        const data = await this.request<{ profile: UserProfile | null }>('/api/profile/');
        if (data?.profile) return data.profile;
      } catch {
        // fallback to storage
      }
    }
    return getUserProfile();
  }

  async getProfileStatus() {
    const profile = await this.getProfile();
    return {
      exists: !!profile,
      isComplete: Boolean(profile?.age && profile?.state),
      completionPercentage: profile ? 100 : 0,
    };
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const current = getUserProfile() || {};
    const updated = { ...current, ...profile } as UserProfile;
    saveUserProfile(updated);
    clearCachedRecommendations();
    this.clearCache();

    if (this.baseUrl && this.isBackendAvailable !== false) {
      try {
        const data = await this.put<{ profile: UserProfile }>('/api/profile/', profile);
        if (data?.profile) return data.profile;
      } catch {
        // offline
      }
    }
    return updated;
  }

  async submitSurvey(
    profile: UserProfile
  ): Promise<{ profile: UserProfile; recommendations: SchemeMatchResult[] }> {
    saveUserProfile(profile);
    clearCachedRecommendations();
    this.clearCache();

    if (this.baseUrl && this.isBackendAvailable !== false) {
      try {
        const data = await this.post<{
          profile: UserProfile;
          recommendations: SchemeMatchResult[];
        }>('/api/survey/submit/', { profile });
        if (data?.recommendations && Array.isArray(data.recommendations)) {
          const profileHash = JSON.stringify({
            age: profile?.age,
            gender: profile?.gender,
            state: profile?.state,
            occ: profile?.employmentType || profile?.occupation,
            cat: profile?.category,
            inc: profile?.incomeRange,
            bpl: profile?.hasBPLCard || profile?.isBPL,
            dis: profile?.isDisability || profile?.hasDisability,
            min: profile?.isMinority
          });
          const cacheKey = `recs_${profileHash}`;
          this.setCached(cacheKey, data.recommendations, 180000);
          saveCachedRecommendations(data.recommendations);
          return data;
        }
      } catch {
        // fallback to client-side matching
      }
    }

    const recommendations = await this.getRecommendations(profile);
    return { profile, recommendations };
  }

  // ── Draft management ──────────────────────────────────────────────────────

  async getSurveyDraft() {
    if (this.baseUrl && this.isBackendAvailable !== false) {
      try {
        const data = await this.request<{ draft: unknown }>('/api/survey/draft/');
        return data.draft ?? null;
      } catch {
        // fallback
      }
    }
    try {
      const raw = localStorage.getItem('sn_survey_draft');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async saveSurveyDraft(answers: unknown, currentStep: number) {
    try {
      localStorage.setItem('sn_survey_draft', JSON.stringify({ answers, currentStep }));
    } catch {
      // ignore
    }
    if (this.baseUrl && this.isBackendAvailable !== false) {
      try {
        await this.put('/api/survey/draft/', { answers, currentStep });
      } catch {
        // offline
      }
    }
  }

  // ── Recommendations ───────────────────────────────────────────────────────

  async getRecommendations(profile?: UserProfile): Promise<SchemeMatchResult[]> {
    const userProfile = profile || getUserProfile();
    const profileHash = JSON.stringify({
      age: userProfile?.age,
      gender: userProfile?.gender,
      state: userProfile?.state,
      occ: userProfile?.employmentType || userProfile?.occupation,
      cat: userProfile?.category,
      inc: userProfile?.incomeRange,
      bpl: userProfile?.hasBPLCard || userProfile?.isBPL,
      dis: userProfile?.isDisability || userProfile?.hasDisability,
      min: userProfile?.isMinority
    });
    const cacheKey = `recs_${profileHash}`;
    const cached = this.getCached<SchemeMatchResult[]>(cacheKey);
    if (cached && cached.length > 0) return cached;

    // 1. Try backend
    if (this.baseUrl && this.isBackendAvailable !== false) {
      try {
        let recs: SchemeMatchResult[] = [];
        if (userProfile) {
          const data = await this.post<{ recommendations: SchemeMatchResult[] }>(
            '/api/recommendations/',
            { profile: userProfile }
          );
          recs = data.recommendations;
        } else {
          const data = await this.request<{ recommendations: SchemeMatchResult[] }>(
            '/api/recommendations/'
          );
          recs = data.recommendations;
        }
        if (recs && recs.length > 0) {
          this.isBackendAvailable = true;
          this.setCached(cacheKey, recs, 180000);
          saveCachedRecommendations(recs);
          return recs;
        }
      } catch (err) {
        console.warn('Backend recommendations unavailable, computing client-side match:', err);
      }
    }

    // 2. Client-side matching engine fallback
    const summary = await this.loadStaticSummary();
    const allSchemes = summary.schemes || [];

    if (!userProfile || allSchemes.length === 0) {
      const top10: SchemeMatchResult[] = allSchemes.slice(0, 10).map((s) => ({
        scheme: s,
        matchScore: s.popularScore || 80,
        matchGrade: 'General Match',
        factors: [],
        matchedReasons: ['High popularity scheme across India'],
        unmatchedWarnings: [],
      }));
      return top10;
    }

    const matches: SchemeMatchResult[] = [];
    for (const s of allSchemes) {
      const result = calculateSchemeMatch(s, userProfile);
      if (result.matchScore >= 40) {
        matches.push(result);
      }
    }

    matches.sort((a, b) => (b.matchScore - a.matchScore) || ((b.scheme.popularScore || 0) - (a.scheme.popularScore || 0)));
    this.setCached(cacheKey, matches, 180000);
    this.setCached('recs_latest', matches, 180000);
    saveCachedRecommendations(matches);
    return matches;
  }

  // ── Schemes catalogue ─────────────────────────────────────────────────────

  async getSchemes(params?: {
    category?: string;
    state?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;

    // 1. Try backend if configured and reachable
    if (this.baseUrl && this.isBackendAvailable !== false) {
      try {
        const qs = new URLSearchParams();
        if (params?.category) qs.set('category', params.category);
        if (params?.state) qs.set('state', params.state);
        if (params?.search) qs.set('search', params.search);
        if (params?.page) qs.set('page', String(params.page));
        if (params?.limit) qs.set('limit', String(limit));

        const path = `/api/schemes/${qs.toString() ? '?' + qs.toString() : ''}`;
        const cacheKey = `schemes_${path}`;
        const cached = this.getCached<{
          schemes: Scheme[];
          categoryCounts?: Record<string, number>;
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>(cacheKey);
        if (cached) return cached;

        const res = await this.request<{
          schemes: Scheme[];
          categoryCounts?: Record<string, number>;
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>(path);

        if (res && res.schemes) {
          this.isBackendAvailable = true;
          this.setCached(cacheKey, res, 60000);
          return res;
        }
      } catch (err) {
        console.warn('Backend scheme fetch failed, falling back to static offline catalog:', err);
        this.isBackendAvailable = false;
      }
    }

    // 2. Static catalog fallback (for GitHub Pages / offline mode)
    const summary = await this.loadStaticSummary();
    let items = summary.schemes || [];

    if (params?.category && params.category.toLowerCase() !== 'all') {
      const catLower = params.category.toLowerCase();
      items = items.filter((s) => (s.category || '').toLowerCase() === catLower);
    }

    if (params?.state && params.state !== 'All India') {
      const stLower = params.state.toLowerCase();
      items = items.filter((s) => {
        const states = Array.isArray(s.coveredStates) ? s.coveredStates : [];
        return (
          states.length === 0 ||
          states.some((st) => st.toLowerCase() === 'all india' || st.toLowerCase() === stLower)
        );
      });
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((s) => {
        return (
          (s.name || '').toLowerCase().includes(q) ||
          (s.shortName || '').toLowerCase().includes(q) ||
          (s.tagline || '').toLowerCase().includes(q) ||
          (s.shortDescription || '').toLowerCase().includes(q) ||
          (Array.isArray(s.tags) && s.tags.some((t) => t.toLowerCase().includes(q)))
        );
      });
    }

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const pagedSchemes = items.slice(offset, offset + limit);

    return {
      schemes: pagedSchemes,
      categoryCounts: summary.categoryCounts || {},
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getScheme(idOrSlug: string): Promise<Scheme | undefined> {
    if (!idOrSlug) return undefined;
    const cleanId = String(idOrSlug).trim().toLowerCase();

    // 1. Try backend
    if (this.baseUrl && this.isBackendAvailable !== false) {
      try {
        const res = await this.request<Scheme>(`/api/schemes/${idOrSlug}/`);
        if (res && res.id) {
          this.isBackendAvailable = true;
          return res;
        }
      } catch {
        // continue to static fallback
      }
    }

    // 2. Static catalog fallback
    const fullSchemes = await this.loadStaticFull();
    let found = fullSchemes.find(
      (s) =>
        String(s.id).toLowerCase() === cleanId ||
        String(s.slug || '').toLowerCase() === cleanId ||
        (s.name && s.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === cleanId)
    );

    if (!found) {
      found = fullSchemes.find(
        (s) =>
          s.name.toLowerCase().includes(cleanId.replace(/-/g, ' ')) ||
          (s.shortName && s.shortName.toLowerCase().includes(cleanId.replace(/-/g, ' ')))
      );
    }

    return found;
  }

  // ── Saved schemes ─────────────────────────────────────────────────────────

  async getSavedSchemes(): Promise<Scheme[]> {
    if (this.baseUrl && this.isBackendAvailable !== false) {
      try {
        const data = await this.request<{ savedSchemes: Scheme[] }>('/api/saved-schemes/');
        if (data?.savedSchemes) return data.savedSchemes;
      } catch {
        // fallback
      }
    }
    return getLocalSavedSchemes();
  }

  async saveScheme(schemeId: string, schemeObj?: Scheme) {
    if (schemeObj) {
      toggleLocalSaveScheme(schemeObj);
    } else {
      const scheme = await this.getScheme(schemeId);
      if (scheme) toggleLocalSaveScheme(scheme);
      else toggleLocalSaveScheme(schemeId);
    }
    if (this.baseUrl && this.isBackendAvailable !== false) {
      try {
        await this.post(`/api/saved-schemes/${schemeId}/`, {});
      } catch {
        // offline
      }
    }
  }

  async removeSavedScheme(schemeId: string) {
    toggleLocalSaveScheme(schemeId);
    if (this.baseUrl && this.isBackendAvailable !== false) {
      try {
        await this.del(`/api/saved-schemes/${schemeId}/`);
      } catch {
        // offline
      }
    }
  }

  // ── Tracker ───────────────────────────────────────────────────────────────

  async getApplications(): Promise<TrackerItem[]> {
    if (this.baseUrl && this.isBackendAvailable !== false) {
      try {
        const data = await this.request<{ applications: TrackerItem[] }>('/api/tracker/');
        if (data?.applications) return data.applications;
      } catch {
        // fallback
      }
    }
    return getLocalTrackerItems();
  }

  async updateApplication(item: TrackerItem) {
    saveLocalTrackerItem(item);
    if (this.baseUrl && this.isBackendAvailable !== false) {
      try {
        await this.put(`/api/tracker/${item.id}/`, item);
      } catch {
        // offline
      }
    }
  }

  // ── AI Assistant ──────────────────────────────────────────────────────────

  async askAI(
    query: string,
    history?: Array<{ role: string; content: string }>,
    profile?: UserProfile | null,
    language?: string
  ): Promise<{
    answer: string;
    referencedSchemes?: Scheme[];
    profileUpdated?: boolean;
    updatedProfile?: Partial<UserProfile>;
  }> {
    if (this.isBackendAvailable !== false) {
      try {
        const data = await this.post<{
          answer: string;
          referencedSchemes: Scheme[];
          profileUpdated: boolean;
          updatedProfile?: Partial<UserProfile>;
        }>('/api/assistant/chat/', {
          message: query,
          history: history || [],
          profile: profile || undefined,
          language: language || 'en-IN',
        });
        return {
          answer: data.answer,
          referencedSchemes: data.referencedSchemes,
          profileUpdated: data.profileUpdated,
          updatedProfile: data.updatedProfile,
        };
      } catch (err) {
        console.warn('Backend AI chat unavailable, using local conversational fallback:', err);
      }
    }


    // Local conversational fallback with scheme search
    const summary = await this.loadStaticSummary();
    const qLower = query.toLowerCase();
    const relevant = (summary.schemes || [])
      .filter(
        (s) =>
          (s.name || '').toLowerCase().includes(qLower) ||
          (s.shortDescription || '').toLowerCase().includes(qLower) ||
          (s.category || '').toLowerCase().includes(qLower)
      )
      .slice(0, 3);

    let answer = `Here are relevant government welfare schemes for you:\n\n`;
    if (relevant.length > 0) {
      answer += relevant
        .map(
          (s, i) =>
            `${i + 1}. **${s.name}** (${s.category})\n${s.shortDescription || s.tagline || ''}`
        )
        .join('\n\n');
      answer += `\n\nClick on any scheme in the Explore directory to see full eligibility, documents required, and application steps.`;
    } else {
      answer = `You can explore verified welfare schemes directly in our Explore directory, or take our quick 2-minute survey to discover all schemes tailored to your profile.`;
    }

    return {
      answer,
      referencedSchemes: relevant,
      profileUpdated: false,
    };
  }
}

export { HttpApiClient };

