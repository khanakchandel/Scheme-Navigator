import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { GlobalVoiceReader } from '../components/common/GlobalVoiceReader';
import { Footer } from '../components/common/Footer';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { ChatbotFAB } from '../components/common/ChatbotFAB';
import { OnboardingTour } from '../components/common/OnboardingTour';
import { MobileBottomNav } from '../components/common/MobileBottomNav';

export const RootLayout: React.FC = () => {
  const location = useLocation();

  // Scroll to top on route transition
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-teal-100 selection:text-teal-900 dark:selection:bg-teal-900 dark:selection:text-teal-100 transition-colors duration-200">
      {/* Top Universal Transparency Notice */}
      <DisclaimerBanner variant="inline" />

      {/* Primary Sticky Header */}
      <Navbar />

      {/* Global Universal Page Voice Reader (Docked at top / floating) */}
      <GlobalVoiceReader />

      {/* Main Page Body */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden pb-24 md:pb-0">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile App Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Floating AI Advisor Chatbot Button */}
      <ChatbotFAB />

      {/* Interactive Onboarding Tour & Welcome Screen Window */}
      <OnboardingTour />
    </div>
  );
};
