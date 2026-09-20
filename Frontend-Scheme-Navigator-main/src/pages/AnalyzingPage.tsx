import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

const STEPS = [
  { title: 'Understanding your profile signals', desc: 'Parsing location, age, occupation, and economic parameters' },
  { title: 'Checking statutory eligibility criteria', desc: 'Evaluating age brackets, income ceilings, and category guidelines' },
  { title: 'Comparing 25+ central & state welfare databases', desc: 'Matching Ministry of Education, Agriculture, MSME & Health schemes' },
  { title: 'Ranking relevant potential matches', desc: 'Generating explainable compatibility scores & document checklists' },
];

export const AnalyzingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Step progression timer
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          // Trigger light celebration confetti
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#0F766E', '#10B981', '#38BDF8'],
            });
          } catch {
            // ignore
          }
          // Redirect after completion
          setTimeout(() => {
            navigate('/recommendations');
          }, 200);
          return prev;
        }
      });
    }, 220);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 transition-colors">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-2xl dark:shadow-none text-center space-y-8 relative overflow-hidden">
        {/* Ambient Top Ring Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-teal-200/40 dark:bg-teal-900/30 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Compass Instrument */}
        <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-teal-800 to-teal-950 p-2 shadow-xl shadow-teal-950/20 border-2 border-teal-600/50 flex items-center justify-center">
          <div className="w-full h-full rounded-full border border-teal-400/30 flex items-center justify-center animate-spin-slow">
            <Compass className="w-12 h-12 text-emerald-300" />
          </div>
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping opacity-25" />
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />
            <span>Matching Engine Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Finding schemes relevant to you...
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Cross-referencing your provided profile against transparent official eligibility rules.
          </p>
        </div>

        {/* Animated Steps Progress List */}
        <div className="space-y-3 text-left max-w-md mx-auto bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-2 rounded-xl transition-all duration-300 ${
                  isCurrent
                    ? 'bg-teal-50/80 dark:bg-teal-950/50 text-teal-950 dark:text-teal-200 font-semibold'
                    : isCompleted
                    ? 'text-slate-800 dark:text-slate-200'
                    : 'text-slate-400 dark:text-slate-500 opacity-60'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full border-2 border-teal-600 dark:border-teal-400 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">{step.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transparency note */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Results indicate potential matches based on provided profile.</span>
        </div>
      </div>
    </div>
  );
};
