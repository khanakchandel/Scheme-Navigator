import React from 'react';
import { SurveyWizard } from '../components/survey/SurveyWizard';
import { Compass } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export const SurveyPage: React.FC = () => {
  return (
    <div className="bg-slate-50/80 dark:bg-slate-950 min-h-[calc(100vh-70px)] py-2 sm:py-4 lg:py-3 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Wizard Container with 2-Column Desktop Grid */}
        <SurveyWizard />
      </div>
    </div>
  );
};
