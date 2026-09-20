import React, { useState, useEffect, useRef } from 'react';
import {
  getSavedProfile,
  getSavedSchemeIds,
  getSavedSchemes,
  getTrackerItems,
  getAuthUser,
  addSchemeToTracker,
  updateTrackerStatus,
  calculateProfileCompletion,
} from '../services/storageService';
import { api } from '../services/api';
import { Scheme } from '../types';
import { ProfileCompletionCard } from '../components/dashboard/ProfileCompletionCard';
import { GuidanceTracker } from '../components/dashboard/GuidanceTracker';
import { SavedSchemesManager } from '../components/dashboard/SavedSchemesManager';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import {
  Compass,
  Bookmark,
  Clock,
  CheckCircle2,
  PlusCircle,
  Store,
  MapPin,
  Calendar,
} from 'lucide-react';
import { KendraFinderModal } from '../components/kendra/KendraFinderModal';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(getSavedProfile());
  const [, setSavedIds] = useState(getSavedSchemeIds());
  const [savedSchemes, setSavedSchemes] = useState<Scheme[]>(() => getSavedSchemes());
  const [trackerItems, setTrackerItems] = useState(getTrackerItems());
  const [authUser, setAuthUser] = useState(getAuthUser());
  const [totalCatalogCount, setTotalCatalogCount] = useState<number>(3866);
  const [draggedScheme, setDraggedScheme] = useState<Scheme | null>(null);
  const [isKendraModalOpen, setIsKendraModalOpen] = useState(false);
  const trackerRef = useRef<HTMLDivElement>(null);

  const [isFloatingDropOver, setIsFloatingDropOver] = useState(false);

  const refreshData = () => {
    setProfile(getSavedProfile());
    setSavedIds(getSavedSchemeIds());
    setTrackerItems(getTrackerItems());
    setAuthUser(getAuthUser());
    const stored = getSavedSchemes();
    if (stored && stored.length > 0) {
      setSavedSchemes(stored);
    }
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('sn_saved_updated', refreshData);
    window.addEventListener('sn_profile_updated', refreshData);
    window.addEventListener('sn_tracker_updated', refreshData);
    api
      .getSchemes({ page: 1 })
      .then((res) => {
        if (res?.pagination?.total) {
          setTotalCatalogCount(res.pagination.total);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('sn_saved_updated', refreshData);
      window.removeEventListener('sn_profile_updated', refreshData);
      window.removeEventListener('sn_tracker_updated', refreshData);
    };
  }, []);

  // Global window auto-scroll when user drags near top or bottom edges of viewport
  useEffect(() => {
    if (!draggedScheme) return;

    let animId: number | null = null;
    let scrollSpeed = 0;

    const scrollLoop = () => {
      if (scrollSpeed !== 0) {
        window.scrollBy(0, scrollSpeed);
      }
      animId = requestAnimationFrame(scrollLoop);
    };
    animId = requestAnimationFrame(scrollLoop);

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      const edgeSize = 140;
      if (e.clientY < edgeSize) {
        // Near top of screen: scroll up faster the closer to the top
        scrollSpeed = -Math.max(8, Math.round(((edgeSize - e.clientY) / edgeSize) * 22));
      } else if (e.clientY > window.innerHeight - edgeSize) {
        // Near bottom of screen: scroll down
        scrollSpeed = Math.max(8, Math.round(((e.clientY - (window.innerHeight - edgeSize)) / edgeSize) * 22));
      } else {
        scrollSpeed = 0;
      }
    };

    const handleWindowDragEnd = () => {
      scrollSpeed = 0;
      if (animId) cancelAnimationFrame(animId);
      setDraggedScheme(null);
      setIsFloatingDropOver(false);
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragend', handleWindowDragEnd);
    window.addEventListener('drop', handleWindowDragEnd);

    return () => {
      scrollSpeed = 0;
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragend', handleWindowDragEnd);
      window.removeEventListener('drop', handleWindowDragEnd);
    };
  }, [draggedScheme]);

  const handleDragStart = (scheme: Scheme) => {
    setDraggedScheme(scheme);
    // Smoothly scroll the tracker into view
    setTimeout(() => {
      trackerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleDragEnd = () => {
    setDraggedScheme(null);
    setIsFloatingDropOver(false);
  };

  const handleDropScheme = (partialOrFull: Scheme) => {
    const schemeId = partialOrFull.id || partialOrFull.slug;
    if (!schemeId) return;

    if (partialOrFull.name && partialOrFull.name !== 'undefined') {
      addSchemeToTracker(partialOrFull, 'Exploring');
    } else {
      const fullScheme = savedSchemes.find((s) => s.id === schemeId || s.slug === schemeId);
      if (fullScheme) {
        addSchemeToTracker(fullScheme, 'Exploring');
      } else {
        updateTrackerStatus(schemeId, partialOrFull.name || 'Scheme', partialOrFull.category, 'Exploring');
      }
    }
    refreshData();
    setDraggedScheme(null);
    setIsFloatingDropOver(false);
  };

  return (
    <div className="bg-slate-50/80 dark:bg-slate-950 min-h-screen py-6 sm:py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('dashboard.welcome', undefined, 'Welcome back,')} {authUser?.name || profile?.name || t('common.user', undefined, 'User')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t('dashboard.subtitle', undefined, 'Manage your personal profile signals, bookmarked schemes, and application progress.')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 dark:bg-teal-700 dark:hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Compass className="w-4 h-4 text-emerald-300" />
              <span>{t('dashboard.view_recs_btn', undefined, 'View Recommendations')}</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('dashboard.stat_matches', undefined, 'Recommended Matches')}</span>
              <Compass className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {totalCatalogCount}+
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block">
              {t('dashboard.stat_matches_sub', undefined, 'Based on active profile')}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('dashboard.stat_saved', undefined, 'Saved Schemes')}</span>
              <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {savedSchemes.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
              {t('dashboard.stat_saved_sub', undefined, 'Shortlisted for review')}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('dashboard.stat_milestones', undefined, 'Application Milestones')}</span>
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {trackerItems.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
              {t('dashboard.stat_milestones_sub', undefined, 'Schemes in guidance tracker')}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('dashboard.stat_profile_status', undefined, 'Profile Status')}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {calculateProfileCompletion(profile)}%
            </div>
            <span className="text-[11px] text-teal-700 dark:text-teal-400 font-medium block">
              {t('dashboard.stat_profile_sub', undefined, 'Calibrated for accuracy')}
            </span>
          </div>
        </div>

        {/* 1. Profile Completion Card */}
        <ProfileCompletionCard profile={profile} />

        {/* 2. Guidance & Application Tracker */}
        <div ref={trackerRef} className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <GuidanceTracker
            items={trackerItems}
            onRefresh={refreshData}
            isDragActive={draggedScheme !== null}
            onDropScheme={handleDropScheme}
          />
        </div>

        {/* Nearest Kendra Finder & CSC Physical Facilitation Card */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-950 rounded-3xl p-6 sm:p-7 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Store className="w-3.5 h-3.5" />
              <span>Offline Assistance • CSC / e-Mitra / MeeSeva Locator</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Nearest Kendra Finder (CSC / e-Mitra Locator)
            </h3>

            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Find verified Common Service Centers near {profile?.state ? profile.state : 'your location'} for in-person biometric e-KYC, Aadhaar authentication, and direct scheme application assistance.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => setIsKendraModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer hover:scale-102"
            >
              <MapPin className="w-4 h-4" />
              <span>Locate Nearby Kendras</span>
            </button>
          </div>
        </div>

        {/* 3. Saved Schemes Section */}
        <div id="saved" className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <SavedSchemesManager
            schemes={savedSchemes}
            trackedSchemeIds={trackerItems.map((t) => t.schemeId)}
            onRefresh={refreshData}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        </div>
      </div>

      {/* Floating Drag & Drop Capsule (Accessible anywhere on the page while dragging) */}
      {draggedScheme && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            setIsFloatingDropOver(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsFloatingDropOver(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsFloatingDropOver(false);
            handleDropScheme(draggedScheme);
          }}
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl shadow-2xl border-2 flex items-center gap-3.5 transition-all duration-200 cursor-pointer ${
            isFloatingDropOver
              ? 'bg-teal-700 text-white border-teal-300 scale-105 ring-4 ring-teal-400/50 shadow-teal-900/30'
              : 'bg-teal-950/95 text-teal-50 border-teal-400 shadow-xl backdrop-blur-md hover:border-teal-300'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black transition-colors ${
              isFloatingDropOver ? 'bg-white text-teal-800' : 'bg-teal-800 text-teal-200'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-black tracking-wider uppercase text-emerald-300">
              {isFloatingDropOver ? 'Release to Add Scheme' : 'Drop Anywhere Here to Track'}
            </div>
            <div className="text-xs sm:text-sm font-bold text-white max-w-xs sm:max-w-md truncate">
              {draggedScheme.name}
            </div>
          </div>
        </div>
      )}

      {/* Kendra Locator Modal */}
      <KendraFinderModal
        isOpen={isKendraModalOpen}
        onClose={() => setIsKendraModalOpen(false)}
      />
    </div>
  );
};
