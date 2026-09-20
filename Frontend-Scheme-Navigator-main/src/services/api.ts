import { UserProfile, SchemeMatchResult, TrackerItem, Scheme } from '../types';
import { HttpApiClient } from './httpClient';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

// On remote domains like GitHub Pages, avoid mixed-content localhost requests so static catalog fallback works instantly
let _backendUrl = envUrl || '';
if (!isLocalhost && _backendUrl.includes('localhost')) {
  _backendUrl = '';
} else if (isLocalhost) {
  const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  _backendUrl = `http://${host}:8000`;
}

export const API_BASE_URL = _backendUrl;
export const api = new HttpApiClient(_backendUrl);

export default api;

