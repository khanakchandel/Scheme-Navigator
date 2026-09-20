import React from 'react';
import { ShieldAlert, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

interface DisclaimerBannerProps {
  variant?: 'inline' | 'compact' | 'footer';
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  variant = 'inline',
  className = '',
}) => {
  const { t } = useTranslation();
  const [isDismissedMobile, setIsDismissedMobile] = React.useState(false);

  if (variant === 'compact') {
    return (
      <div className={`p-3.5 bg-teal-950/5 border border-teal-800/20 rounded-2xl flex items-center justify-between text-xs text-slate-700 backdrop-blur-md ${className}`}>
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span className="font-medium">
            {t('footer.disclaimer')}
          </span>
        </div>
        <Link to="/about" className="text-teal-800 font-bold hover:text-teal-950 hover:underline shrink-0 ml-2 hidden sm:inline">
          {t('nav.about')}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Universal Top Notice Banner matching screenshot */}
      <div className={`w-full bg-slate-950 text-slate-300 py-2 px-3 sm:px-6 text-xs border-b border-slate-800/90 ${className}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
              NOTICE
            </span>
            <span className="text-[11px] sm:text-xs text-slate-300 leading-snug truncate sm:whitespace-normal">
              <span className="sm:hidden">Independent citizen discovery platform</span>
              <span className="hidden sm:inline">
                SchemeNavigator is an independent citizen discovery & guidance navigation layer. Final eligibility, approval, and disbursements are executed by respective Government Ministries.
              </span>
            </span>
          </div>

          <Link
            to="/about#what-we-are-not"
            className="inline-flex items-center gap-1 text-[10.5px] sm:text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 group"
          >
            <span className="sm:hidden">Notice Details</span>
            <span className="hidden sm:inline">Read Full Mission & Transparency Notice</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </>
  );
};
