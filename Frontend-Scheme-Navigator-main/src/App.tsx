import React, { useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/appStore';
import { initStoredLanguage } from './utils/translator';
import { RootLayout } from './layouts/RootLayout';
import { HomePage } from './pages/HomePage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Code-split routes for instant initial load and lightweight bundles
const SurveyPage = lazy(() => import('./pages/SurveyPage').then((m) => ({ default: m.SurveyPage })));
const AnalyzingPage = lazy(() => import('./pages/AnalyzingPage').then((m) => ({ default: m.AnalyzingPage })));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage').then((m) => ({ default: m.RecommendationsPage })));
const SchemeDetailPage = lazy(() => import('./pages/SchemeDetailPage').then((m) => ({ default: m.SchemeDetailPage })));
const ExplorePage = lazy(() => import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AssistantPage = lazy(() => import('./pages/AssistantPage').then((m) => ({ default: m.AssistantPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const KendraFinderPage = lazy(() => import('./pages/KendraFinderPage').then((m) => ({ default: m.KendraFinderPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center p-8">
    <div className="w-8 h-8 rounded-full border-3 border-teal-200 dark:border-teal-900 border-t-teal-700 dark:border-t-teal-400 animate-spin" />
  </div>
);

export function App() {
  useEffect(() => {
    initStoredLanguage();
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <HashRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<RootLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/how-it-works" element={<HomePage />} />
                <Route path="/survey" element={<SurveyPage />} />
                <Route path="/analyzing" element={<AnalyzingPage />} />
                <Route path="/recommendations" element={<RecommendationsPage />} />
                <Route path="/schemes/:id" element={<SchemeDetailPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/kendra-finder" element={<KendraFinderPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </HashRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
