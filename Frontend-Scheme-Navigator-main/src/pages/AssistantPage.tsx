import React from 'react';
import { SchemeAdvisorChat } from '../components/assistant/SchemeAdvisorChat';

export const AssistantPage: React.FC = () => {
  return (
    <div className="bg-slate-50/80 dark:bg-slate-950 min-h-screen py-8 sm:py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SchemeAdvisorChat />
      </div>
    </div>
  );
};
